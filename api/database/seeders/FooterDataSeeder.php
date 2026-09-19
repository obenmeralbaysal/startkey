<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads database/data/footer-seed.json produced by scripts/crawl-footer.py.
 *
 * Franchise is a form page; KVKK and Hizmet Sözleşmesi reuse the cms-page
 * template. Superadmin will later write the same cms_pages rows.
 */
class FooterDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/footer-seed.json');

        if (! is_file($path)) {
            throw new RuntimeException("Footer seed data not found at {$path}.");
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            foreach ($data['pages'] ?? [] as $index => $row) {
                $page = CmsPage::updateOrCreate(
                    ['key' => $row['key']],
                    ['published' => true, 'position' => 30 + $index],
                );

                foreach ($row['translations'] as $locale => $translation) {
                    $payload = $row['key'] === 'franchise'
                        ? $this->franchisePayload($translation)
                        : null;

                    $page->translations()->updateOrCreate(
                        ['locale' => $locale],
                        [
                            'url_path' => $translation['urlPath'],
                            'heading' => $translation['breadcrumb']['heading'] ?? '',
                            'body_html' => ReferenceHtml::rewrite($translation['bodyHtml'] ?? ''),
                            'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                            'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                            'payload' => $this->rewriteDeep($payload),
                        ],
                    );
                }
            }
        });
    }

    /**
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    private function franchisePayload(array $translation): array
    {
        return [
            'formHeading' => $translation['formHeading'] ?? '',
            'placeholders' => $translation['placeholders'] ?? [],
            'required' => $translation['required'] ?? [],
            'cities' => $translation['cities'] ?? [],
            'countyBindUrl' => $translation['countyBindUrl'] ?? '',
            'submitLabel' => $translation['submitLabel'] ?? '',
            'captchaError' => $translation['captchaError'] ?? '',
            'widgetCss' => $translation['widgetCss'] ?? '',
        ];
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
