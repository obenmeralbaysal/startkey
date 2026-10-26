<?php

namespace App\Support;

/**
 * Turns a stored image reference into a site path. Absolute and remote URLs stay
 * as they are. A bare filename is placed under `/media/{directory}/`, which is how
 * office, consultant and portfolio photos are already served.
 */
class MediaPath
{
    public static function absolute(string $value, string $directory): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }
        if (str_starts_with($value, '/') || preg_match('#^[a-z][a-z0-9+.-]*://#i', $value) === 1) {
            return $value;
        }

        $value = ltrim($value, '/');
        if (str_contains($value, '/')) {
            return '/media/'.$value;
        }

        return '/media/'.$directory.'/'.$value;
    }
}
