<?php

namespace Database\Seeders;

use App\Models\CmsListPage;
use App\Models\CmsListing;
use App\Models\LookupItem;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;

/**
 * Loads database/data/portfolio-seed.json produced by scripts/crawl-portfolio.py.
 *
 * Rows back the shared Portföylerimiz list/detail templates. Re-running updates
 * existing rows instead of duplicating.
 */
class PortfolioDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/portfolio-seed.json');

        if (! is_file($path)) {
            $this->command?->warn("Portfolio seed skipped; {$path} is not on disk.");

            return;
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        $this->seedLookups($data['lookups'] ?? []);
        $this->seedListings($data['listings'] ?? []);
        $this->seedListUi($data['listUi'] ?? []);
    }

    private function seedLookups(array $lookups): void
    {
        $groups = [
            'currencies' => 'currencies',
            'offices' => 'offices',
            'consultants' => 'consultants',
            'districts' => 'districts',
        ];

        foreach ($groups as $key => $group) {
            foreach ($lookups[$key] ?? [] as $position => $row) {
                $item = LookupItem::updateOrCreate(
                    [
                        'group' => $group,
                        'external_id' => (string) ($row['externalId'] ?? ''),
                        'parent_external_id' => $row['parentExternalId'] ?? null,
                    ],
                    ['position' => $row['position'] ?? $position],
                );

                foreach ($row['translations'] ?? [] as $locale => $label) {
                    $item->translations()->updateOrCreate(
                        ['locale' => $locale],
                        ['label' => (string) $label],
                    );
                }
            }
        }
    }

    private function seedListings(array $listings): void
    {
        foreach ($listings as $index => $row) {
            $listing = CmsListing::updateOrCreate(
                ['external_id' => $row['externalId']],
                [
                    'ad_type_id' => $this->nullableId($row['adTypeId'] ?? null),
                    'process_type_id' => $this->nullableId($row['processTypeId'] ?? null),
                    'currency_id' => $this->nullableId($row['currencyId'] ?? null),
                    'country_id' => $this->nullableId($row['countryId'] ?? null),
                    'city_id' => $this->nullableId($row['cityId'] ?? null),
                    'county_id' => $this->nullableId($row['countyId'] ?? null),
                    'district_id' => $this->nullableId($row['districtId'] ?? null),
                    'office_id' => $this->nullableId($row['officeId'] ?? null),
                    'consultant_id' => $this->nullableId($row['consultantId'] ?? null),
                    'office_slug' => $row['officeSlug'] ?? '',
                    'consultant_slug' => $row['consultantSlug'] ?? '',
                    'price_amount' => (int) ($row['priceAmount'] ?? 0),
                    'clean_area' => (int) ($row['cleanArea'] ?? 0),
                    'updated_on' => ($row['updatedOn'] ?? '') !== '' ? $row['updatedOn'] : null,
                    'latitude' => $row['latitude'] ?? '',
                    'longitude' => $row['longitude'] ?? '',
                    'list_rank' => $row['listRank'] ?? $index,
                    'published' => true,
                ],
            );

            foreach ($row['translations'] ?? [] as $locale => $translation) {
                $card = $this->rewriteDeep($translation['card'] ?? []);
                $detail = $this->detailPayload($translation);

                $listing->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $translation['urlPath'] ?? '',
                        'title' => $translation['title'] ?? ($card['title'] ?? ''),
                        'card' => $card,
                        'detail' => $detail,
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ],
                );
            }
        }

        $keep = array_values(array_filter(array_map(
            static fn (array $row) => (int) ($row['externalId'] ?? 0),
            $listings,
        )));
        if ($keep !== []) {
            CmsListing::query()->whereNotIn('external_id', $keep)->delete();
        }
    }

    private function seedListUi(array $ui): void
    {
        foreach ($ui as $locale => $page) {
            CmsListPage::updateOrCreate(
                ['type' => 'listing', 'locale' => $locale],
                [
                    'url_path' => $page['listPath'] ?? '',
                    'pager_base' => $page['formAction'] ?? ($page['listPath'] ?? ''),
                    'per_page' => 12,
                    'continue_label' => '',
                    'heading' => $page['breadcrumb']['heading'] ?? '',
                    'breadcrumb' => $this->rewriteDeep($page['breadcrumb'] ?? []),
                    'meta' => $this->rewriteDeep($page['meta'] ?? []),
                    'sidebar' => $this->rewriteDeep([
                        'filterHeading' => $page['filterHeading'] ?? '',
                        'mobileFilterOpen' => $page['mobileFilterOpen'] ?? '',
                        'submitLabel' => $page['submitLabel'] ?? '',
                        'foundTemplate' => $page['foundTemplate'] ?? '{count}',
                        'labels' => $page['labels'] ?? [],
                        'placeholders' => $page['placeholders'] ?? [],
                        'adTypes' => $page['adTypes'] ?? [],
                        'sortOptions' => $page['sortOptions'] ?? [],
                        'bindUrls' => $page['bindUrls'] ?? [],
                        'formAction' => $page['formAction'] ?? '',
                        'aliases' => $page['aliases'] ?? [],
                    ]),
                ],
            );
        }
    }

    /**
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    private function detailPayload(array $translation): array
    {
        $agent = $translation['agent'] ?? [];
        if (isset($agent['image'])) {
            $agent['image'] = $this->media($agent['image']);
        }
        if (isset($agent['imageWebp'])) {
            $agent['imageWebp'] = $this->media($agent['imageWebp']);
        }

        $eids = $translation['eids'] ?? null;
        if (is_array($eids) && isset($eids['image'])) {
            $eids['image'] = $this->media($eids['image']);
        }

        $gallery = [];
        foreach ($translation['gallery'] ?? [] as $slide) {
            $gallery[] = [
                'original' => $this->media($slide['original'] ?? ''),
                'image' => $this->media($slide['image'] ?? ''),
                'imageWebp' => $this->media($slide['imageWebp'] ?? ''),
                'thumb' => $this->media($slide['thumb'] ?? ''),
                'caption' => $slide['caption'] ?? '',
            ];
        }

        return $this->rewriteDeep([
            'price' => $translation['price'] ?? '',
            'gallery' => $gallery,
            'locationIds' => $translation['locationIds'] ?? [],
            'specs' => $translation['specs'] ?? [],
            'descriptionHeading' => $translation['descriptionHeading'] ?? '',
            'descriptionHtml' => $translation['descriptionHtml'] ?? '',
            'eids' => $eids,
            'featureGroups' => $translation['featureGroups'] ?? [],
            'map' => $translation['map'] ?? [],
            'agent' => $agent,
            'form' => $translation['form'] ?? [],
            'relatedHeading' => $translation['relatedHeading'] ?? '',
            'relatedIds' => $translation['relatedIds'] ?? [],
        ]);
    }

    private function nullableId(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    private function media(?string $url): string
    {
        if ($url === null || $url === '') {
            return '';
        }

        return ReferenceHtml::mediaUrl($url);
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
