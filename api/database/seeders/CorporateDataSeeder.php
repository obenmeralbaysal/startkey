<?php

namespace Database\Seeders;

use App\Models\CmsListPage;
use App\Models\CmsPage;
use App\Models\CmsPerson;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads pages and people from database/data/corporate-seed.json.
 *
 * News, announcements, blog posts and champion groups are served from Reonix.
 */
class CorporateDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/corporate-seed.json');

        if (! is_file($path)) {
            throw new RuntimeException("Corporate seed data not found at {$path}.");
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            $this->seedPages($data['pages'] ?? []);
            $this->seedPeople($data['people'] ?? [], $data['peopleUi'] ?? []);
        });
    }

    private function seedPages(array $pages): void
    {
        foreach ($pages as $index => $row) {
            $page = CmsPage::updateOrCreate(
                ['key' => $row['key']],
                ['published' => true, 'position' => $index],
            );

            foreach ($row['translations'] as $locale => $translation) {
                $page->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $translation['urlPath'],
                        'heading' => $translation['breadcrumb']['heading'] ?? '',
                        'body_html' => ReferenceHtml::rewrite($translation['bodyHtml'] ?? ''),
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ],
                );
            }
        }
    }

    private function seedPeople(array $people, array $ui): void
    {
        foreach ($people as $index => $row) {
            $first = $row['translations']['tr'] ?? reset($row['translations']);
            $person = CmsPerson::updateOrCreate(
                ['external_id' => $row['externalId']],
                [
                    'image' => $this->media($first['listImage'] ?? $first['image'] ?? '', 414, 414),
                    'image_webp' => $this->media($first['listImageWebp'] ?? $first['imageWebp'] ?? '', 414, 414, true),
                    'detail_image' => $this->media($first['image'] ?? '', 574, 574),
                    'detail_image_webp' => $this->media($first['imageWebp'] ?? '', 574, 574, true),
                    'email' => $first['email'] ?? '',
                    'phone_href' => $first['phoneHref'] ?? '',
                    'social' => $first['social'] ?? [],
                    'published' => true,
                    'position' => $index,
                ],
            );

            foreach ($row['translations'] as $locale => $translation) {
                [$emailLabel, $phoneFieldLabel, $bioHeading, $bioHtml] = $this->personCopy($translation);

                $person->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $translation['urlPath'],
                        'name' => $translation['name'] ?? '',
                        'role' => $translation['role'] ?? '',
                        'phone_label' => $translation['phoneLabel'] ?? '',
                        'email_label' => $emailLabel,
                        'phone_field_label' => $phoneFieldLabel,
                        'bio_heading' => $bioHeading,
                        'bio_html' => ReferenceHtml::rewrite($bioHtml),
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ],
                );
            }
        }

        foreach ($ui as $locale => $page) {
            $this->upsertListPage('people', $locale, $page, 13, '');
        }
    }

    private function upsertListPage(
        string $type,
        string $locale,
        array $page,
        int $perPage,
        string $continueLabel,
        mixed $sidebar = null,
    ): void {
        CmsListPage::updateOrCreate(
            ['type' => $type, 'locale' => $locale],
            [
                'url_path' => $page['listPath'] ?? '',
                'pager_base' => $page['pagerBase'] ?? ($page['listPath'] ?? ''),
                'per_page' => $page['perPage'] ?? $perPage,
                'continue_label' => $continueLabel,
                'heading' => $page['breadcrumb']['heading'] ?? '',
                'breadcrumb' => $this->rewriteDeep($page['breadcrumb'] ?? []),
                'meta' => $this->rewriteDeep($page['meta'] ?? []),
                'sidebar' => $sidebar,
            ],
        );
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private function personCopy(array $translation): array
    {
        $source = ($translation['bodyHtml'] ?? '').' '.($translation['bioHtml'] ?? '');
        $emailLabel = $translation['emailLabel'] ?? '';
        $phoneFieldLabel = $translation['phoneFieldLabel'] ?? '';
        $bioHeading = $translation['bioHeading'] ?? '';
        $bioHtml = $translation['bioHtml'] ?? '';

        if ($emailLabel === '' && preg_match('/<b>([^<]+)<\/b>\s*<a href="mailto:/i', $source, $match)) {
            $emailLabel = trim($match[1]);
        }
        if ($phoneFieldLabel === '' && preg_match('/<b>([^<]+)<\/b>\s*<a href="tel:/i', $source, $match)) {
            $phoneFieldLabel = trim($match[1]);
        }
        if (preg_match('/<h4>(.*?)<\/h4>/is', $bioHtml, $match)) {
            $bioHeading = trim(html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $bioHtml = preg_replace('/<h4>.*?<\/h4>/is', '', $bioHtml, 1) ?? $bioHtml;
        } elseif ($bioHeading === '' && preg_match('/<h4>(.*?)<\/h4>/is', $source, $match)) {
            $bioHeading = trim(html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        return [$emailLabel, $phoneFieldLabel, $bioHeading, $bioHtml];
    }

    private function media(?string $url, ?int $width = null, ?int $height = null, bool $webp = false): string
    {
        if ($url === null || $url === '') {
            return '';
        }

        $path = ReferenceHtml::rewrite($url);
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
        $ext = $webp ? 'webp' : substr($relative, $dot + 1);
        $suffix = '';
        if ($width && $height) {
            $suffix = "-{$width}x{$height}";
        } elseif ($width) {
            $suffix = "-{$width}";
        }

        if ($suffix !== '' && ! str_ends_with($stem, $suffix)) {
            $stem .= $suffix;
        }

        return '/media/'.$stem.'.'.$ext;
    }

    private function rewriteDeep(mixed $value): mixed
    {
        if (is_string($value)) {
            return ReferenceHtml::rewrite($value);
        }
        if (is_array($value)) {
            return array_map(fn ($item) => $this->rewriteDeep($item), $value);
        }

        return $value;
    }
}
