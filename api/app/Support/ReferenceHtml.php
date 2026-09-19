<?php

namespace App\Support;

/**
 * Rewrites captured reference HTML so it can be stored and served locally: CDN
 * image hosts become `/media`, the live origin is stripped, and the project's
 * brand substitutions (ReOS → Reonix, provider logo → Sinap) are applied.
 */
class ReferenceHtml
{
    public static function rewrite(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        $html = preg_replace('#https?://ik\.imagekit\.io/reoscom/*(?:tr:[^/]*/)?#', '/media/', $html) ?? $html;
        $html = preg_replace('#https?://cdnc\.re-os\.com/#', '/media/', $html) ?? $html;
        $html = preg_replace('#https?://reos-cdn-files\.s3-eu-west-1\.amazonaws\.com/#', '/media/', $html) ?? $html;
        $html = preg_replace('#https?://(?:www\.)?startkey\.com\.tr#', '', $html) ?? $html;
        $html = str_replace('/media//', '/media/', $html);
        $html = preg_replace('#\?width=[^"\'\s>]*#', '', $html) ?? $html;

        $html = str_replace(['REOS CRM', 'ReOS CRM', 'ReOS'], 'Reonix', $html);
        $html = preg_replace(
            '#<a href="https://re-os\.com"[^>]*>\s*<img[^>]*>\s*</a>#',
            '<span class="service-provider">Sinap</span>',
            $html,
        ) ?? $html;

        return $html;
    }

    /**
     * Turns a captured image URL into the local `/media/...` path, keeping the
     * cropped width×height suffix when the original request had one so the file
     * on disk matches `scripts/crawl-corporate.py`.
     */
    public static function mediaUrl(?string $url, ?int $width = null, ?int $height = null): string
    {
        if ($url === null || $url === '') {
            return '';
        }

        $isWebp = str_contains($url, 'tr:format') || str_ends_with(strtolower(parse_url($url, PHP_URL_PATH) ?? ''), '.webp');
        $width ??= self::queryInt($url, 'width');
        $height ??= self::queryInt($url, 'height');

        $path = self::rewrite($url);
        $path = explode('?', $path)[0];

        if (! str_starts_with($path, '/media/')) {
            return $path;
        }

        $relative = substr($path, strlen('/media/'));
        $dot = strrpos($relative, '.');
        if ($dot === false) {
            return $path;
        }

        $stem = substr($relative, 0, $dot);
        $ext = substr($relative, $dot + 1);
        $suffix = '';
        if ($width && $height) {
            $suffix = "-{$width}x{$height}";
        } elseif ($width) {
            $suffix = "-{$width}";
        }

        if ($isWebp) {
            $ext = 'webp';
        }

        return '/media/'.$stem.$suffix.'.'.$ext;
    }

    private static function queryInt(string $url, string $key): ?int
    {
        $query = parse_url($url, PHP_URL_QUERY);
        if (! is_string($query) || $query === '') {
            return null;
        }
        parse_str($query, $params);
        if (! isset($params[$key]) || ! is_numeric($params[$key])) {
            return null;
        }

        return (int) $params[$key];
    }
}
