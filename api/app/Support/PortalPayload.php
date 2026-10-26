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

        if (self::unchanged($value, $stripToken)) {
            return $value;
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

    /**
     * A list of scalar rows needs no secret stripping and no URL rewrite.
     * Returning it avoids a second copy of a large location catalogue.
     *
     * @param  array<mixed>  $value
     */
    private static function unchanged(array $value, bool $stripToken): bool
    {
        if ($value === []) {
            return true;
        }
        if (! array_is_list($value)) {
            return false;
        }
        foreach ($value as $row) {
            if (is_array($row)) {
                if (array_is_list($row) || ! self::flatClean($row, $stripToken)) {
                    return false;
                }
                continue;
            }
            if (is_string($row) && self::needsRewrite($row, null)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<mixed>  $row
     */
    private static function flatClean(array $row, bool $stripToken): bool
    {
        foreach ($row as $key => $child) {
            if (is_array($child)) {
                return false;
            }
            if (is_string($key) && self::hidden($key, $stripToken)) {
                return false;
            }
            if (is_string($child) && self::needsRewrite($child, is_string($key) ? $key : null)) {
                return false;
            }
        }

        return true;
    }

    private static function needsRewrite(string $value, ?string $key): bool
    {
        if (($key === 'message' || $key === 'error') && stripos($value, 'reonix') !== false) {
            return true;
        }

        return str_contains($value, '://');
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
        if (! self::needsRewrite($value, $key)) {
            return $value;
        }

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
