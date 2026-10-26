<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class CatalogueMediaController extends Controller
{
    public function __invoke(string $kind, int $id, ?int $index = null): Response
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
        if (! $upstream->successful() || ! str_starts_with($type, 'image/') || strlen($upstream->body()) > 8_000_000) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        return response($upstream->body(), 200, [
            'Content-Type' => strtok($type, ';') ?: 'image/jpeg',
            'Cache-Control' => 'public, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
