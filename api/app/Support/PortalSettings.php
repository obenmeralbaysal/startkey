<?php

namespace App\Support;

final class PortalSettings
{
    public static function message(): string
    {
        return __('messages.portal.settings_forbidden');
    }

    /**
     * @param  array<string, mixed>  $user
     */
    public static function denies(string $method, string $path, array $user, ?string $officeId): bool
    {
        $need = self::need(strtoupper($method), $path);
        if ($need === null) {
            return false;
        }

        $member = self::member($user, $officeId);
        if ($member === null) {
            return true;
        }

        $role = self::role($member);
        $branch = $member['branch_id'] ?? null;
        $branched = is_numeric($branch) && (int) $branch > 0;
        $manager = in_array($role, ['owner', 'manager', 'office_manager'], true);
        $officeWide = in_array($role, ['owner', 'manager'], true)
            || ($role === 'office_manager' && ! $branched);

        return match ($need) {
            'owner' => $role !== 'owner',
            'manager' => ! $manager,
            'office-wide' => ! $officeWide,
            default => true,
        };
    }

    private static function need(string $method, string $path): ?string
    {
        $write = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true);

        if ($path === 'commission-policy' || str_starts_with($path, 'commission-policy/')) {
            return 'owner';
        }
        if ($path === 'earning-rates' || str_starts_with($path, 'earning-rates/')) {
            return 'owner';
        }
        if ($write && ($path === 'badges' || str_starts_with($path, 'badges/'))) {
            return 'owner';
        }
        if ($path === 'office/matchmaking-weights' || str_starts_with($path, 'office-settings/')) {
            return 'office-wide';
        }
        if ($write && ($path === 'settings' || str_starts_with($path, 'settings/'))) {
            return 'office-wide';
        }
        if ($path === 'settings' || str_starts_with($path, 'settings/')) {
            return 'manager';
        }
        if ($path === 'team' || str_starts_with($path, 'team/') || $path === 'roles' || str_starts_with($path, 'roles/')) {
            return 'manager';
        }
        if (str_starts_with($path, 'office/imap-settings') || str_starts_with($path, 'office/subscription')) {
            return 'manager';
        }
        if ($path === 'hq/office/billing' || str_starts_with($path, 'hq/office/billing/')) {
            return 'manager';
        }
        if (preg_match('#^offices/\d+/sahibinden-sellers(?:/|$)#', $path) === 1) {
            return 'manager';
        }
        if ($write && preg_match('#^offices/\d+$#', $path) === 1) {
            return 'office-wide';
        }
        if ($write && $path === 'duty-roster') {
            return 'manager';
        }
        if ($write && str_starts_with($path, 'whatsapp/')) {
            return 'manager';
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $user
     * @return array<string, mixed>|null
     */
    private static function member(array $user, ?string $officeId): ?array
    {
        if ($officeId === null || ! ctype_digit($officeId)) {
            return null;
        }
        $offices = $user['offices'] ?? null;
        if (! is_array($offices)) {
            return null;
        }
        $id = (int) $officeId;
        foreach ($offices as $office) {
            if (! is_array($office)) {
                continue;
            }
            $officeKey = $office['office_id'] ?? $office['id'] ?? null;
            if (is_numeric($officeKey) && (int) $officeKey === $id) {
                return $office;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $office
     */
    private static function role(array $office): string
    {
        foreach (['role_slug', 'role', 'role_name'] as $key) {
            if (is_string($office[$key]) && $office[$key] !== '') {
                return $office[$key];
            }
        }

        return 'agent';
    }
}
