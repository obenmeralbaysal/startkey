<?php

namespace App\Http\Middleware;

use App\Support\PortalNetworkAccess;
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

        $user = is_array($session['user'] ?? null) ? $session['user'] : [];
        if (! in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true) && PortalNetworkAccess::isReader($user)) {
            return response()->json(['message' => __('messages.portal.forbidden')], 403);
        }

        return $next($request);
    }
}
