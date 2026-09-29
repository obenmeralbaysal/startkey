<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AuthenticatePortalSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $sessionId = $request->cookie('startkey_portal');
        $session = is_string($sessionId) && $sessionId !== ''
            ? Cache::get('portal-session:'.$sessionId)
            : null;

        if (! is_array($session) || ! is_string($session['token'] ?? null)) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }

        return $next($request);
    }
}
