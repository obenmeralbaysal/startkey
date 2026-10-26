<?php

namespace App\Support;

final class PortalNetworkAccess
{
    /** @var list<string> */
    public const ROLES = ['franchise_admin', 'franchise_staff'];

    /**
     * @param  array<string, mixed>  $user
     */
    public static function role(array $user): ?string
    {
        $role = $user['role'] ?? null;

        return is_string($role) && in_array($role, self::ROLES, true) ? $role : null;
    }

    /**
     * @param  array<string, mixed>  $user
     */
    public static function isReader(array $user): bool
    {
        return self::role($user) !== null || ($user['context'] ?? null) === 'network';
    }
}
