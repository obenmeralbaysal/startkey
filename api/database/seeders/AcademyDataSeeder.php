<?php

namespace Database\Seeders;

use App\Models\CmsListPage;
use App\Models\CmsPage;
use App\Models\CmsTraining;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads database/data/academy-seed.json produced by scripts/crawl-academy.py.
 *
 * Rows back the shared Akademi and İletişim templates. Re-running updates existing
 * rows instead of duplicating.
 */
class AcademyDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/academy-seed.json');

        if (! is_file($path)) {
            throw new RuntimeException("Academy seed data not found at {$path}.");
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            $this->seedTrainings($data['trainings'] ?? [], $data['listUi'] ?? []);
            $this->seedContact($data['contact'] ?? []);
        });
    }

    private function seedTrainings(array $trainings, array $ui): void
    {
        foreach ($trainings as $index => $row) {
            $training = CmsTraining::updateOrCreate(
                ['external_id' => $row['externalId']],
                [
                    'group' => $row['group'] ?? 'completed',
                    'published' => true,
                    'position' => $index,
                ],
            );

            foreach ($row['translations'] as $locale => $translation) {
                $form = [
                    'placeholders' => $translation['placeholders'] ?? [],
                    'required' => $translation['required'] ?? [],
                    'genders' => $translation['genders'] ?? [],
                    'submitLabel' => $translation['submitLabel'] ?? '',
                    'captchaError' => $translation['captchaError'] ?? '',
                    'paymentHtml' => $translation['paymentHtml'] ?? '',
                ];
                $hasForm = ($row['group'] ?? '') === 'ongoing' && trim((string) ($form['submitLabel'] ?? '')) !== '';

                $training->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $translation['urlPath'],
                        'card_url_path' => $translation['cardUrlPath'] ?? $translation['urlPath'],
                        'title' => $translation['title'] ?? $translation['listTitle'] ?? '',
                        'list_image' => $this->media($translation['listImage'] ?? ''),
                        'info_lines' => $this->rewriteDeep($translation['infoLines'] ?? []),
                        'detail_label' => $translation['detailLabel'] ?? '',
                        'date_prefix' => $translation['datePrefix'] ?? '',
                        'date_value' => $translation['dateValue'] ?? '',
                        'time_prefix' => $translation['timePrefix'] ?? '',
                        'time_value' => $translation['timeValue'] ?? '',
                        'price_prefix' => $translation['pricePrefix'] ?? '',
                        'price_value' => $translation['priceValue'] ?? '',
                        'image' => $this->media($translation['image'] ?? ''),
                        'location_heading' => $translation['locationHeading'] ?? '',
                        'location_value' => $translation['locationValue'] ?? '',
                        'description_heading' => $translation['descriptionHeading'] ?? '',
                        'description_html' => ReferenceHtml::rewrite($translation['descriptionHtml'] ?? ''),
                        'form_heading' => $hasForm ? ($translation['formHeading'] ?? '') : '',
                        'form' => $this->rewriteDeep($hasForm ? $form : [
                            'placeholders' => [],
                            'required' => [],
                            'genders' => [],
                            'submitLabel' => '',
                            'captchaError' => '',
                            'paymentHtml' => '',
                        ]),
                        'related_heading' => $translation['relatedHeading'] ?? '',
                        'related' => $this->related($translation['related'] ?? []),
                        'page_heading' => $translation['pageHeading'] ?? '',
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ],
                );
            }
        }

        // The reference list only shows the current trainings; older ones keep a live detail page.
        $listed = array_column($trainings, 'externalId');
        if ($listed !== []) {
            CmsTraining::query()
                ->whereNotIn('external_id', $listed)
                ->where('group', '!=', 'archived')
                ->update(['group' => 'archived']);
        }

        foreach ($ui as $locale => $page) {
            CmsListPage::updateOrCreate(
                ['type' => 'training', 'locale' => $locale],
                [
                    'url_path' => $page['listPath'] ?? '',
                    'pager_base' => $page['listPath'] ?? '',
                    'per_page' => 100,
                    'continue_label' => $page['detailLabel'] ?? '',
                    'heading' => $page['breadcrumb']['heading'] ?? '',
                    'breadcrumb' => $this->rewriteDeep($page['breadcrumb'] ?? []),
                    'meta' => $this->rewriteDeep($page['meta'] ?? []),
                    'sidebar' => $this->rewriteDeep([
                        'sections' => $page['sections'] ?? [],
                    ]),
                ],
            );
        }
    }

    private function seedContact(array $contact): void
    {
        $page = CmsPage::updateOrCreate(
            ['key' => 'contact'],
            ['published' => true, 'position' => 20],
        );

        foreach ($contact as $locale => $translation) {
            $payload = $this->rewriteDeep([
                'items' => $translation['items'] ?? [],
                'kicker' => $translation['kicker'] ?? '',
                'heading' => $translation['heading'] ?? '',
                'intro' => $translation['intro'] ?? '',
                'hoursHeading' => $translation['hoursHeading'] ?? '',
                'hours' => $translation['hours'] ?? [],
                'social' => $translation['social'] ?? [],
                'formTitle' => $translation['formTitle'] ?? '',
                'placeholders' => $translation['placeholders'] ?? [],
                'required' => $translation['required'] ?? [],
                'submitLabel' => $translation['submitLabel'] ?? '',
                'captchaError' => $translation['captchaError'] ?? '',
                'mapHref' => html_entity_decode($translation['mapHref'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'mapSrc' => html_entity_decode($translation['mapSrc'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'mapTitle' => $translation['mapTitle'] ?? '',
            ]);

            $page->translations()->updateOrCreate(
                ['locale' => $locale],
                [
                    'url_path' => $translation['urlPath'],
                    'heading' => $translation['breadcrumb']['heading'] ?? '',
                    'body_html' => '',
                    'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                    'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    'payload' => $payload,
                ],
            );
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function related(array $items): array
    {
        return array_map(function (array $item) {
            return [
                'externalId' => $item['externalId'] ?? null,
                'urlPath' => $item['urlPath'] ?? '',
                'title' => $item['title'] ?? '',
                'image' => $this->media($item['image'] ?? ''),
            ];
        }, $items);
    }

    private function media(?string $url, ?int $width = null, ?int $height = null): string
    {
        if ($url === null || $url === '') {
            return '';
        }

        return ReferenceHtml::mediaUrl($url, $width, $height);
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
