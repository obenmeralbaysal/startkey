<?php

namespace App\Support;

/**
 * Reonix marks Sahibinden imports with is_watermarked on each image and
 * has_watermarked_media on the portfolio. Missing values stay false.
 */
final class WatermarkFlags
{
    public static function flag(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (int) $value === 1;
        }
        if (is_string($value)) {
            return in_array(strtolower(trim($value)), ['1', 'true', 'yes'], true);
        }

        return false;
    }

    /**
     * Per-index flags from images, media, or photos. A missing item is false.
     *
     * @param  array<string, mixed>  $row
     * @return array<int, bool>
     */
    public static function imageFlags(array $row): array
    {
        $flags = [];
        foreach (['images', 'media', 'photos'] as $key) {
            $items = $row[$key] ?? null;
            if (! is_array($items)) {
                continue;
            }
            $position = 0;
            foreach ($items as $index => $item) {
                if (! is_array($item)) {
                    $position++;

                    continue;
                }
                $at = self::index($item, $index, $position);
                $flags[$at] = ($flags[$at] ?? false) || self::flag($item['is_watermarked'] ?? false);
                $position++;
            }
        }

        return $flags;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private static function index(array $item, mixed $index, int $position): int
    {
        foreach (['index', 'sort_order', 'position'] as $key) {
            if (isset($item[$key]) && is_numeric($item[$key])) {
                return (int) $item[$key];
            }
        }

        return is_int($index) ? $index : $position;
    }

    /**
     * Walk a portal payload. Portfolio rows gain has_watermarked_media.
     * Image rows under images, media, or photos gain is_watermarked.
     * $forceMedia stamps a top-level data list (portfolios/{id}/media).
     */
    public static function ensure(mixed $value, ?string $key = null, bool $forceMedia = false): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $list = array_is_list($value);
        $pass = $forceMedia && $key === null;
        $out = [];
        foreach ($value as $childKey => $child) {
            $name = is_string($childKey) ? $childKey : null;
            $out[$childKey] = self::ensure($child, $name, $pass && $name === 'data');
        }

        $stampMedia = in_array($key, ['images', 'media', 'photos'], true) || ($forceMedia && $list);
        if ($stampMedia) {
            foreach ($out as $index => $item) {
                if (! is_array($item) || array_is_list($item)) {
                    continue;
                }
                $item['is_watermarked'] = self::flag($item['is_watermarked'] ?? false);
                $out[$index] = $item;
            }
        }

        if (! $list && (array_key_exists('has_watermarked_media', $out) || self::looksLikePortfolio($out))) {
            $out['has_watermarked_media'] = self::flag($out['has_watermarked_media'] ?? false);
        }

        return $out;
    }

    /**
     * @param  array<mixed>  $row
     */
    private static function looksLikePortfolio(array $row): bool
    {
        if (! array_key_exists('title', $row) || ! array_key_exists('status', $row)) {
            return false;
        }

        foreach (['type', 'listing_type', 'portfolio_type', 'property_type', 'price', 'image_count'] as $key) {
            if (array_key_exists($key, $row)) {
                return true;
            }
        }

        return false;
    }
}
