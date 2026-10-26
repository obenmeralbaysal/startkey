<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class CatalogueMediaController extends Controller
{
    public function __invoke(Request $request, string $kind, int $id, ?int $index = null): Response
    {
        $index = $index ?? 0;
        $base = rtrim((string) config('reonix.base_url'), '/');
        $key = (string) config('reonix.portal_key');
        if ($base === '' || $key === '' || $index < 0 || $index > 59 || ! in_array($kind, ['offices', 'consultants', 'portfolios'], true)) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        $cached = $this->readCache($kind, $id, $index);
        if ($cached !== null && $this->cacheIsFresh($cached['fetched_at'])) {
            return $this->imageResponse($request, $cached['bytes'], $cached['type'], $cached['fetched_at']);
        }

        try {
            $upstream = Http::withHeaders([
                'X-Portal-Key' => $key,
                'Accept' => 'image/*',
            ])->timeout(20)->withoutRedirecting()->get($base.'/api/v1/integrations/portal/catalogue/media/'.$kind.'/'.$id.'/'.$index);
        } catch (\Throwable) {
            return $this->staleOrMissing($request, $cached);
        }

        $type = strtolower((string) $upstream->header('Content-Type'));
        $bytes = $upstream->body();
        if (! $upstream->successful() || ! str_starts_with($type, 'image/') || strlen($bytes) > 8_000_000) {
            return $this->staleOrMissing($request, $cached);
        }

        $contentType = strtok($type, ';') ?: 'image/jpeg';
        $fetchedAt = time();
        $this->writeCache($kind, $id, $index, $bytes, $contentType, $fetchedAt);

        return $this->imageResponse($request, $bytes, $contentType, $fetchedAt);
    }

    /**
     * @param  array{bytes: string, type: string, fetched_at: int}|null  $cached
     */
    private function staleOrMissing(Request $request, ?array $cached): Response
    {
        if ($cached === null) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        return $this->imageResponse($request, $cached['bytes'], $cached['type'], $cached['fetched_at']);
    }

    private function imageResponse(Request $request, string $bytes, string $type, int $fetchedAt): Response
    {
        $etag = sha1($bytes);
        $headers = [
            'Content-Type' => $type,
            'Cache-Control' => 'public, max-age=86400, stale-while-revalidate=604800',
            'X-Content-Type-Options' => 'nosniff',
            'ETag' => '"'.$etag.'"',
            'Last-Modified' => gmdate('D, d M Y H:i:s', $fetchedAt).' GMT',
        ];

        if ($this->noneMatch($request->headers->get('If-None-Match'), $etag)) {
            return response('', 304, $headers);
        }

        return response($bytes, 200, $headers);
    }

    private function noneMatch(?string $header, string $etag): bool
    {
        if ($header === null || $header === '') {
            return false;
        }

        $quoted = '"'.$etag.'"';
        foreach (explode(',', $header) as $part) {
            $part = trim($part);
            if ($part === '*' || $part === $quoted || $part === $etag || strcasecmp($part, 'W/'.$quoted) === 0) {
                return true;
            }
        }

        return false;
    }

    private function cacheIsFresh(int $fetchedAt): bool
    {
        $ttl = (int) config('reonix.media_cache_ttl', 21600);

        return (time() - $fetchedAt) < $ttl;
    }

    /**
     * @return array{bytes: string, type: string, fetched_at: int}|null
     */
    private function readCache(string $kind, int $id, int $index): ?array
    {
        $disk = Storage::disk('local');
        $bin = $this->binPath($kind, $id, $index);
        $metaPath = $this->metaPath($kind, $id, $index);
        if (! $disk->exists($bin) || ! $disk->exists($metaPath)) {
            return null;
        }

        $meta = json_decode($disk->get($metaPath), true);
        if (! is_array($meta) || ! is_string($meta['type'] ?? null) || ! isset($meta['fetched_at'])) {
            return null;
        }

        $type = strtolower($meta['type']);
        $bytes = $disk->get($bin);
        if (! is_string($bytes) || $bytes === '' || ! str_starts_with($type, 'image/') || strlen($bytes) > 8_000_000) {
            return null;
        }

        return [
            'bytes' => $bytes,
            'type' => strtok($type, ';') ?: 'image/jpeg',
            'fetched_at' => (int) $meta['fetched_at'],
        ];
    }

    private function writeCache(string $kind, int $id, int $index, string $bytes, string $type, int $fetchedAt): void
    {
        if (! str_starts_with($type, 'image/') || strlen($bytes) > 8_000_000) {
            return;
        }

        $disk = Storage::disk('local');
        $disk->put($this->binPath($kind, $id, $index), $bytes);
        $disk->put($this->metaPath($kind, $id, $index), json_encode([
            'type' => $type,
            'fetched_at' => $fetchedAt,
        ], JSON_THROW_ON_ERROR));
    }

    private function binPath(string $kind, int $id, int $index): string
    {
        return 'catalogue-media/'.$kind.'/'.$id.'/'.$index.'.bin';
    }

    private function metaPath(string $kind, int $id, int $index): string
    {
        return 'catalogue-media/'.$kind.'/'.$id.'/'.$index.'.meta';
    }
}
