<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

        try {
            $upstream = Http::withHeaders([
                'X-Portal-Key' => $key,
                'Accept' => 'image/*',
            ])->timeout(20)->withoutRedirecting()->get($base.'/api/v1/integrations/portal/catalogue/media/'.$kind.'/'.$id.'/'.$index);
        } catch (\Throwable) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        $type = strtolower((string) $upstream->header('Content-Type'));
        $body = $upstream->body();
        if (! $upstream->successful() || ! str_starts_with($type, 'image/') || strlen($body) > 8_000_000) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        $etag = '"'.sha1($body).'"';
        $headers = [
            'Cache-Control' => 'public, max-age=3600',
            'ETag' => $etag,
            'X-Content-Type-Options' => 'nosniff',
        ];
        if (self::noneMatch($request->headers->get('If-None-Match'), $etag)) {
            return response('', 304, $headers);
        }

        return response($body, 200, [
            'Content-Type' => strtok($type, ';') ?: 'image/jpeg',
            ...$headers,
        ]);
    }

    private static function noneMatch(?string $header, string $etag): bool
    {
        if ($header === null || $header === '') {
            return false;
        }
        foreach (explode(',', $header) as $part) {
            $part = trim($part);
            if ($part === '*' || $part === $etag || $part === 'W/'.$etag) {
                return true;
            }
        }

        return false;
    }
}
