<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\PortalPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class PortalMediaController extends Controller
{
    public function __invoke(Request $request, string $path): Response
    {
        $sessionId = $request->cookie('startkey_portal');
        $session = is_string($sessionId) ? Cache::get('portal-session:'.$sessionId) : null;
        if (! is_array($session) || ! is_string($session['token'] ?? null)) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }

        $media = PortalPath::media($path);
        $base = rtrim((string) config('reonix.base_url'), '/');
        if ($media === null || $base === '') {
            return response()->json(['message' => __('messages.portal.forbidden')], 404);
        }

        try {
            $upstream = Http::withToken($session['token'])
                ->timeout(20)
                ->withoutRedirecting()
                ->get($base.'/'.$media);
        } catch (\Throwable) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $type = strtolower((string) $upstream->header('Content-Type'));
        $allowed = str_starts_with($type, 'image/')
            || str_starts_with($type, 'video/')
            || str_starts_with($type, 'application/pdf')
            || str_starts_with($type, 'application/octet-stream');
        if (! $upstream->successful() || ! $allowed || strlen($upstream->body()) > 20_000_000) {
            return response()->json(['message' => __('messages.portal.unavailable')], 404);
        }

        return response($upstream->body(), 200, [
            'Content-Type' => strtok($type, ';') ?: 'application/octet-stream',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }
}
