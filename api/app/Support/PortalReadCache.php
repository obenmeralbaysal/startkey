<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

final class PortalReadCache
{
    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>|null
     */
    public static function get(string $sessionId, ?string $officeId, string $path, array $query): ?array
    {
        $key = self::key($sessionId, $officeId, $path, $query);
        if ($key === null) {
            return null;
        }
        $hit = Cache::get($key);
        if (! is_array($hit)) {
            return null;
        }

        return $hit;
    }

    /**
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>  $body
     */
    public static function put(string $sessionId, ?string $officeId, string $path, array $query, array $body): void
    {
        $key = self::key($sessionId, $officeId, $path, $query);
        $ttl = self::ttl($path);
        if ($key === null || $ttl === null) {
            return;
        }
        Cache::put($key, $body, now()->addSeconds($ttl));
    }

    public static function bump(string $sessionId): void
    {
        $key = self::generationKey($sessionId);
        Cache::put($key, ((int) Cache::get($key, 0)) + 1, now()->addHours(12));
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private static function key(string $sessionId, ?string $officeId, string $path, array $query): ?string
    {
        if (self::ttl($path) === null || $sessionId === '') {
            return null;
        }
        ksort($query);
        $encoded = md5((string) json_encode($query));
        if (self::shared($path)) {
            $scope = str_starts_with($path, 'locations/')
                ? $path.':'.$encoded
                : ($officeId ?? '0').':'.$path.':'.$encoded;

            return 'portal-read:shared:'.$scope;
        }

        return 'portal-read:'.$sessionId.':'.self::generation($sessionId).':'.($officeId ?? '0').':'.$path.':'.$encoded;
    }

    private static function ttl(string $path): ?int
    {
        return match (true) {
            $path === 'me' => 20,
            $path === 'categories' || str_starts_with($path, 'categories/') => 300,
            $path === 'locations/cities', $path === 'locations/districts', $path === 'locations/neighborhoods' => 600,
            $path === 'dashboard/stats',
            $path === 'dashboard/agent-stats',
            $path === 'dashboard/pending-approvals',
            $path === 'dashboard/my-revisions',
            str_starts_with($path, 'dashboard/visuals'),
            $path === 'duty-roster/today' => 15,
            default => null,
        };
    }

    private static function shared(string $path): bool
    {
        return str_starts_with($path, 'locations/')
            || $path === 'categories'
            || str_starts_with($path, 'categories/');
    }

    private static function generation(string $sessionId): int
    {
        return (int) Cache::get(self::generationKey($sessionId), 0);
    }

    private static function generationKey(string $sessionId): string
    {
        return 'portal-read-gen:'.$sessionId;
    }
}
