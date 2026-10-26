<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use App\Support\PortalNetworkAccess;
use App\Support\PortalPath;
use App\Support\PortalPayload;
use App\Support\PortalReadCache;
use App\Support\PortalSettings;
use App\Support\WatermarkFlags;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class OfficeProxyController extends Controller
{
    public function __construct(private readonly ReonixClient $reonix) {}

    public function __invoke(Request $request, string $path): Response
    {
        $sessionId = $request->cookie('startkey_portal');
        $session = $this->session($sessionId);
        if ($session === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }

        $remotePath = PortalPath::office($path);
        if ($remotePath === null || ! in_array(strtoupper($request->method()), ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return response()->json(['message' => __('messages.portal.forbidden')], 404);
        }

        $officeId = $request->header('X-Portal-Office');
        if (is_string($officeId) && $officeId !== '') {
            if (! ctype_digit($officeId) || ! in_array((int) $officeId, $this->officeIds($session['user']), true)) {
                return response()->json(['message' => __('messages.portal.forbidden')], 403);
            }
        } else {
            $officeId = null;
        }

        if (PortalSettings::denies($request->method(), $remotePath, $session['user'], $officeId)) {
            return response()->json(['message' => PortalSettings::message()], 403);
        }

        $location = $this->locationQuery($remotePath, $request->query());
        if ($location !== null) {
            return $location;
        }

        $query = $request->query();
        $json = $this->jsonBody($request);
        $files = $this->files($request);
        if (in_array(strtoupper($request->method()), ['PUT', 'PATCH'], true) && $remotePath === 'office/settings') {
            $query = $this->withoutBranding($query);
            $json = $json === null ? null : $this->withoutBranding($json);
            $files = $this->withoutBrandingFiles($files);
        }
        if ($request->isMethod('GET') && is_string($sessionId) && $sessionId !== '') {
            $cached = PortalReadCache::get($sessionId, $officeId, $remotePath, $query);
            if ($cached !== null) {
                return $this->json($cached, 200, PortalReadCache::seconds($remotePath));
            }
        }

        try {
            $upstream = $this->reonix->exchange(
                strtolower($request->method()),
                $remotePath,
                $query,
                $json,
                $files,
                $session['token'],
                $officeId,
            );
        } catch (ReonixException) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        return $this->reply($upstream, $remotePath, $session, $sessionId, $request->method(), $officeId, $query);
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function locationQuery(string $path, array $query): ?Response
    {
        $key = match ($path) {
            'locations/districts' => 'city_id',
            'locations/neighborhoods' => 'district_id',
            default => null,
        };
        if ($key === null) {
            return null;
        }
        $value = $query[$key] ?? null;
        if (is_string($value) && preg_match('/^[1-9]\d*$/', $value) === 1) {
            return null;
        }
        if (is_int($value) && $value >= 1) {
            return null;
        }

        return response()->json([
            'message' => $key === 'city_id'
                ? __('messages.portal.city_required')
                : __('messages.portal.district_required'),
            'data' => [],
        ], 422);
    }

    /**
     * @param  array{token: string, user: array<string, mixed>}  $session
     * @param  array<string, mixed>  $query
     */
    private function reply(\Illuminate\Http\Client\Response $upstream, string $path, array $session, ?string $sessionId, string $method, ?string $officeId, array $query): Response
    {
        $type = strtolower((string) $upstream->header('Content-Type'));
        $raw = $upstream->json();
        if (! is_array($raw) || (! str_contains($type, 'json') && ! str_contains($type, 'text'))) {
            if ($this->binary($type)) {
                return response($upstream->body(), $upstream->status(), array_filter([
                    'Content-Type' => strtok($type, ';') ?: null,
                    'Content-Disposition' => $this->disposition($upstream->header('Content-Disposition')),
                ]));
            }

            return response()->json(['message' => __('messages.portal.unavailable')], $upstream->status() >= 400 ? $upstream->status() : 422);
        }

        if (str_starts_with($path, 'locations/') && $this->oversized($raw)) {
            return response()->json([
                'message' => __('messages.portal.location_too_large'),
                'data' => [],
            ], 422);
        }

        $rotated = $path === 'auth/switch-office' && is_string($raw['data']['token'] ?? null)
            ? $raw['data']['token']
            : null;
        $body = PortalPayload::scrub($raw, $rotated !== null);
        if (! is_array($body)) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }
        if ($this->portfolioPayload($path)) {
            $ensured = WatermarkFlags::ensure($body, null, preg_match('#(^|/)media($|/)#', $path) === 1);
            if (is_array($ensured)) {
                $body = $ensured;
            }
        }

        $role = PortalNetworkAccess::role($session['user']);
        if ($path === 'me' && $role !== null) {
            $body['context'] = 'network';
            $body['role'] = $role;
            if (isset($body['user']) && is_array($body['user'])) {
                $body['user']['context'] = 'network';
                $body['user']['role'] = $role;
            }
        }

        if (is_string($sessionId) && $sessionId !== '') {
            if ($rotated !== null) {
                $session['token'] = $rotated;
            }
            $offices = $body['offices'] ?? null;
            if (is_array($offices) && ($path === 'me' || $path === 'auth/switch-office')) {
                $session['user']['offices'] = $offices;
            }
            if ($rotated !== null || ($path === 'me' && is_array($offices))) {
                Cache::put('portal-session:'.$sessionId, $session, now()->addHours(12));
            }
            if (! in_array(strtoupper($method), ['GET', 'HEAD'], true) && $upstream->successful()) {
                PortalReadCache::bump($sessionId);
            }
        }

        $ttl = null;
        if ($upstream->status() === 200 && is_string($sessionId) && $sessionId !== '' && strtoupper($method) === 'GET') {
            $ttl = PortalReadCache::seconds($path);
            PortalReadCache::put($sessionId, $officeId, $path, $query, $body);
        }

        return $this->json($body, $upstream->status(), $ttl);
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function json(array $body, int $status, ?int $ttl = null): Response
    {
        $response = response()->json($body, $status);
        if ($status === 200 && $ttl !== null && $ttl > 0) {
            $response->headers->set('Cache-Control', 'private, max-age='.$ttl);
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private function oversized(array $raw): bool
    {
        $rows = $raw['data'] ?? $raw;

        return is_array($rows) && count($rows) > 2000;
    }

    private function portfolioPayload(string $path): bool
    {
        return $path === 'portfolios'
            || str_starts_with($path, 'portfolios/')
            || $path === 'dashboard'
            || str_starts_with($path, 'dashboard/')
            || $path === 'matches'
            || str_starts_with($path, 'matches/');
    }

    private function binary(string $type): bool
    {
        foreach (['image/', 'video/', 'application/pdf', 'application/octet-stream'] as $allowed) {
            if (str_starts_with($type, $allowed)) {
                return true;
            }
        }

        return false;
    }

    private function disposition(string $value): ?string
    {
        if ($value === '' || preg_match('/[\r\n]/', $value) === 1) {
            return null;
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function withoutBranding(array $payload): array
    {
        foreach (array_keys($payload) as $key) {
            if ($this->brandingKey((string) $key)) {
                unset($payload[$key]);
            }
        }

        return $payload;
    }

    /**
     * @param  array<string, array{contents: string, filename: string, type: string}>  $files
     * @return array<string, array{contents: string, filename: string, type: string}>
     */
    private function withoutBrandingFiles(array $files): array
    {
        foreach (array_keys($files) as $name) {
            if ($this->brandingKey((string) $name)) {
                unset($files[$name]);
            }
        }

        return $files;
    }

    private function brandingKey(string $key): bool
    {
        $normalized = strtolower((string) preg_replace('/[^a-z0-9]/i', '', $key));

        return in_array($normalized, [
            'logo',
            'logourl',
            'removelogo',
            'primarycolor',
            'secondarycolor',
            'brandcolor',
            'brandcolour',
        ], true);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function jsonBody(Request $request): ?array
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'DELETE'], true) || $request->allFiles() !== []) {
            return $request->allFiles() === [] ? null : $request->except(array_keys($request->allFiles()));
        }
        $decoded = json_decode($request->getContent(), true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @return array<string, array{contents: string, filename: string, type: string}>
     */
    private function files(Request $request): array
    {
        $out = [];
        $this->flatten($request->allFiles(), '', $out);

        return $out;
    }

    /**
     * @param  array<mixed>  $files
     * @param  array<string, array{contents: string, filename: string, type: string}>  $out
     */
    private function flatten(array $files, string $prefix, array &$out): void
    {
        foreach ($files as $name => $file) {
            $field = $prefix === '' ? (string) $name : $prefix.'['.$name.']';
            if (is_array($file)) {
                $this->flatten($file, $field, $out);
                continue;
            }
            if (! $file instanceof UploadedFile || ! $file->isValid()) {
                continue;
            }
            $path = $file->getRealPath();
            if ($path === false) {
                continue;
            }
            $contents = file_get_contents($path);
            if ($contents === false) {
                continue;
            }
            $out[$field] = [
                'contents' => $contents,
                'filename' => $file->getClientOriginalName(),
                'type' => $file->getMimeType() ?: 'application/octet-stream',
            ];
        }
    }

    /**
     * @return array{token: string, user: array<string, mixed>}|null
     */
    private function session(?string $sessionId): ?array
    {
        if (! is_string($sessionId) || $sessionId === '') {
            return null;
        }
        $session = Cache::get('portal-session:'.$sessionId);
        if (! is_array($session) || ! is_string($session['token'] ?? null) || ! is_array($session['user'] ?? null)) {
            return null;
        }

        return $session;
    }

    /**
     * @param  array<string, mixed>  $user
     * @return list<int>
     */
    private function officeIds(array $user): array
    {
        $ids = [];
        $offices = $user['offices'] ?? [];
        if (! is_array($offices)) {
            return [];
        }
        foreach ($offices as $office) {
            if (! is_array($office)) {
                continue;
            }
            foreach (['id', 'office_id'] as $key) {
                if (isset($office[$key]) && is_numeric($office[$key])) {
                    $ids[] = (int) $office[$key];
                }
            }
        }

        return array_values(array_unique($ids));
    }
}
