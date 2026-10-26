<?php

namespace App\Support;

final class PortalPath
{
    /** @var list<string> */
    private const DENIED = [
        'admin',
        'hq/applications',
        'hq/awards',
        'hq/cms',
        'hq/crm',
        'hq/finance/ledgers',
        'hq/finance/summary',
        'hq/kpis',
    ];

    /** @var list<string> */
    private const ALLOWED = [
        'activity-types',
        'addon',
        'agreements',
        'appointments',
        'auth/resend-verification',
        'auth/switch-office',
        'badges',
        'billing-profiles',
        'branches',
        'calendar',
        'categories',
        'closings',
        'collaboration-requests',
        'commission-policy',
        'compliance-items',
        'complexes',
        'contacts',
        'crm/lease-radar',
        'dashboard',
        'data-export-requests',
        'demands',
        'devices',
        'duty-roster',
        'earning-rates',
        'earnings',
        'extra-packages',
        'global-search',
        'hq/finance/invoices',
        'hq/invoices',
        'hq/office',
        'leaderboard',
        'locations',
        'logout',
        'magic-links',
        'matchmaking-weights',
        'matches',
        'me',
        'neighborhoods',
        'network/announcements',
        'notifications',
        'office',
        'office-addons',
        'office-settings',
        'offices',
        'portfolio-attributes',
        'portfolio-definitions',
        'portfolios',
        'profile',
        'reports',
        'roles',
        'settings',
        'team',
        'visits',
        'whatsapp',
    ];

    public static function office(string $path): ?string
    {
        $path = self::clean($path);
        if ($path === null) {
            return null;
        }
        foreach (self::DENIED as $denied) {
            if ($path === $denied || str_starts_with($path, $denied.'/')) {
                return null;
            }
        }
        foreach (self::ALLOWED as $allowed) {
            if ($path === $allowed || str_starts_with($path, $allowed.'/')) {
                return $path;
            }
        }

        return null;
    }

    public static function customer(string $path): ?string
    {
        $path = self::clean($path);
        if ($path === null) {
            return null;
        }
        $ok = preg_match('#^magic-links/[A-Za-z0-9_-]+$#', $path) === 1
            || preg_match('#^magic-links/[A-Za-z0-9_-]+/(interest|enrich-contact)$#', $path) === 1
            || preg_match('#^intake/[A-Za-z0-9_-]+(/[A-Za-z0-9_./-]+)?$#', $path) === 1
            || preg_match('#^showcase/[A-Za-z0-9_-]+(/appointments)?$#', $path) === 1;

        return $ok ? 'public/'.$path : null;
    }

    public static function media(string $path): ?string
    {
        $path = self::clean($path);
        if ($path === null || ! str_starts_with($path, 'storage/')) {
            return null;
        }

        return $path;
    }

    private static function clean(string $path): ?string
    {
        $path = trim($path, '/');
        if ($path === '' || str_contains($path, '..') || str_contains($path, '\\') || str_contains($path, "\0")) {
            return null;
        }
        if (preg_match('#^[A-Za-z0-9_./-]+$#', $path) !== 1) {
            return null;
        }

        return $path;
    }
}
