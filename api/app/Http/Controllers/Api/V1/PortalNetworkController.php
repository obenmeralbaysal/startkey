<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use App\Support\PortalNetworkAccess;
use App\Support\PortalPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PortalNetworkController extends Controller
{
    /** @var list<string> */
    private const CONTACT_KEYS = ['phone', 'email', 'owner_email', 'owner_phone'];

    public function __construct(private readonly ReonixClient $reonix) {}

    public function summary(Request $request): JsonResponse
    {
        $session = $this->session($request);
        if ($session === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }
        if (PortalNetworkAccess::role($session['user']) === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 403);
        }

        try {
            $upstream = $this->reonix->exchange('get', 'admin/network/summary', [], null, [], $session['token']);
        } catch (ReonixException) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $raw = $upstream->json();
        if (! $upstream->successful() || ! is_array($raw)) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        return response()->json([
            'offices' => (int) ($raw['offices'] ?? 0),
            'consultants' => (int) ($raw['consultants'] ?? 0),
            'active_portfolios' => (int) ($raw['active_portfolios'] ?? 0),
            'branches' => (int) ($raw['branches'] ?? 0),
            'updated_at' => is_string($raw['updated_at'] ?? null) ? $raw['updated_at'] : '',
        ]);
    }

    public function offices(Request $request): JsonResponse
    {
        return $this->list($request, 'admin/network/offices', [
            'page' => $request->query('page'),
            'q' => $request->query('q'),
        ]);
    }

    public function consultants(Request $request): JsonResponse
    {
        return $this->list($request, 'admin/network/consultants', [
            'page' => $request->query('page'),
            'q' => $request->query('q'),
            'office_id' => $request->query('office_id'),
        ]);
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function list(Request $request, string $path, array $query): JsonResponse
    {
        $session = $this->session($request);
        if ($session === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }
        if (PortalNetworkAccess::role($session['user']) === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 403);
        }

        $query = array_filter($query, fn ($value) => $value !== null && $value !== '');

        try {
            $upstream = $this->reonix->exchange('get', $path, $query, null, [], $session['token']);
        } catch (ReonixException) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $raw = $upstream->json();
        if (! $upstream->successful() || ! is_array($raw)) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $rows = is_array($raw['data'] ?? null) ? $this->stripContact($raw['data']) : [];
        $rows = PortalPayload::scrub($rows);
        $pagination = is_array($raw['pagination'] ?? null) ? $raw['pagination'] : [
            'current_page' => 1,
            'per_page' => 20,
            'total_items' => 0,
            'total_pages' => 0,
        ];

        return response()->json([
            'data' => $rows,
            'pagination' => $pagination,
        ]);
    }

    private function stripContact(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $out = [];
        foreach ($value as $key => $child) {
            if (is_string($key) && in_array($key, self::CONTACT_KEYS, true)) {
                continue;
            }
            $out[$key] = $this->stripContact($child);
        }

        return $out;
    }

    /**
     * @return array{token: string, user: array<string, mixed>}|null
     */
    private function session(Request $request): ?array
    {
        $sessionId = $request->cookie('startkey_portal');
        if (! is_string($sessionId) || $sessionId === '') {
            return null;
        }
        $session = Cache::get('portal-session:'.$sessionId);
        if (! is_array($session) || ! is_string($session['token'] ?? null) || ! is_array($session['user'] ?? null)) {
            return null;
        }

        return $session;
    }
}
