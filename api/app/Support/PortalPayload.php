<?php

namespace App\Support;

final class PortalPayload
{
    /** @var list<string> */
    private const HIDDEN = [
        'access_token',
        'current_password',
        'password',
        'password_confirmation',
        'plainTextToken',
        'portal_key',
        'refresh_token',
        'remember_token',
        'secret',
    ];

    public static function scrub(mixed $value, bool $stripToken = false, ?string $key = null): mixed
    {
        if (! is_array($value)) {
            return is_string($value) ? self::rewrite($value, $key) : $value;
        }

        $out = [];
        foreach ($value as $childKey => $child) {
            $name = is_string($childKey) ? $childKey : null;
            if (is_string($childKey) && self::hidden($childKey, $stripToken)) {
                continue;
            }
            $out[$childKey] = self::scrub($child, $stripToken, $name);
        }

        return $out;
    }

    private static function hidden(string $key, bool $stripToken): bool
    {
        if ($stripToken && $key === 'token') {
            return true;
        }

        return in_array($key, self::HIDDEN, true);
    }

    private static function rewrite(string $value, ?string $key): string
    {
        if ($key === 'message' || $key === 'error') {
            $value = str_ireplace('Reonix', 'Portal', $value);
        }

        $value = preg_replace('#https?://[^/\s"\']+/p/s/([A-Za-z0-9_-]+)#', '/portal/share/showcase/$1', $value) ?? $value;
        $value = preg_replace('#https?://[^/\s"\']+/intake/s/([A-Za-z0-9_-]+)#', '/portal/share/intake/$1', $value) ?? $value;
        $value = preg_replace('#https?://[^/\s"\']+/p/([A-Za-z0-9_-]+)#', '/portal/share/presentation/$1', $value) ?? $value;

        $base = rtrim((string) config('reonix.base_url'), '/');
        if ($base !== '' && str_starts_with($value, $base.'/storage/')) {
            return '/api/v1/portal/media/'.substr($value, strlen($base) + 1);
        }

        return $value;
    }
}
