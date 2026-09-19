<?php

namespace Database\Seeders;

use App\Models\CmsConsultant;
use App\Models\CmsConsultantTranslation;
use App\Models\CmsListPage;
use App\Models\CmsOffice;
use App\Models\CmsOfficeTranslation;
use App\Models\LookupItem;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Loads database/data/offices-seed.json produced by scripts/crawl-offices.py.
 *
 * Offices and consultants are the full public sets crawled from the live lists.
 */
class OfficesDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/offices-seed.json');
        if (! is_file($path)) {
            throw new RuntimeException("Office seed data not found at {$path}.");
        }

        $payload = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        $this->seedLookups($payload['lookups'] ?? []);
        $this->seedOffices($payload['offices'] ?? []);
        $this->seedConsultants($payload['consultants'] ?? []);
        $this->backfillConsultantOffices($payload['offices'] ?? []);
        $this->seedOfficeLookups($payload['offices'] ?? []);
        $this->seedListUi('office', $payload['officeUi'] ?? []);
        $this->seedListUi('consultant', $payload['consultantUi'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $lookups
     */
    private function seedLookups(array $lookups): void
    {
        foreach ($lookups['cities'] ?? [] as $position => $row) {
            $item = LookupItem::query()->updateOrCreate(
                [
                    'group' => 'cities',
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

    /**
     * @param  list<array<string, mixed>>  $offices
     */
    private function seedOffices(array $offices): void
    {
        $cityMap = $this->lookupLabelMap(['cities', 'office_cities', 'property_cities']);
        $countyMap = $this->lookupLabelMap(['counties']);

        foreach ($offices as $rank => $row) {
            $externalId = (int) ($row['externalId'] ?? 0);
            if ($externalId < 1) {
                continue;
            }

            $cityLabel = (string) ($row['cityLabel'] ?? '');
            $countyLabel = (string) ($row['countyLabel'] ?? '');

            $office = CmsOffice::query()->updateOrCreate(
                ['external_id' => $externalId],
                [
                    'short_slug' => (string) ($row['shortSlug'] ?? ''),
                    'country_id' => $this->nullableId($row['countryId'] ?? '212'),
                    'city_id' => $this->matchLabel($cityLabel, $cityMap),
                    'county_id' => $this->matchLabel($countyLabel, $countyMap),
                    'city_label' => $cityLabel,
                    'county_label' => $countyLabel,
                    'latitude' => (string) ($row['latitude'] ?? ''),
                    'longitude' => (string) ($row['longitude'] ?? ''),
                    'list_rank' => $row['listRank'] ?? $rank,
                    'published' => true,
                ]
            );

            foreach ($row['translations'] ?? [] as $locale => $translation) {
                $shortSlug = (string) ($row['shortSlug'] ?? $translation['shortSlug'] ?? '');
                $shortPath = $locale === 'tr' ? '/'.$shortSlug : '/'.$locale.'/'.$shortSlug;
                $urlPath = (string) ($translation['urlPath'] ?? '');
                if ($urlPath === '' || $urlPath === '/'.$shortSlug) {
                    $urlPath = $shortPath;
                }
                $urlPath = $this->uniqueOfficePath($urlPath, $locale, $office->id, $shortPath);

                $office->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $urlPath,
                        'short_path' => $shortPath,
                        'name' => (string) ($translation['name'] ?? ''),
                        'card' => $this->rewriteDeep($translation['card'] ?? []),
                        'detail' => $this->officeDetail($translation),
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ]
                );
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $consultants
     */
    private function seedConsultants(array $consultants): void
    {
        $offices = CmsOffice::query()->get()->keyBy('external_id');

        foreach ($consultants as $rank => $row) {
            $externalId = (int) ($row['externalId'] ?? 0);
            if ($externalId < 1) {
                continue;
            }

            $officeId = $this->nullableId($row['officeId'] ?? null);
            $cityId = null;
            if ($officeId !== null && isset($offices[(int) $officeId])) {
                $cityId = $offices[(int) $officeId]->city_id;
            }

            $consultant = CmsConsultant::query()->updateOrCreate(
                ['external_id' => $externalId],
                [
                    'slug' => (string) ($row['slug'] ?? ''),
                    'office_id' => $officeId,
                    'city_id' => $cityId,
                    'first_name' => (string) ($row['firstName'] ?? ''),
                    'last_name' => (string) ($row['lastName'] ?? ''),
                    'has_full_detail' => (bool) ($row['hasFullDetail'] ?? true),
                    'published' => true,
                    'list_rank' => $rank,
                ]
            );

            foreach ($row['translations'] ?? [] as $locale => $translation) {
                $urlPath = (string) ($translation['urlPath'] ?? '');
                if ($urlPath === '') {
                    $urlPath = $this->consultantPath($locale, $externalId, (string) ($row['slug'] ?? $externalId));
                }
                $urlPath = $this->uniqueConsultantPath($urlPath, $locale, $consultant->id);

                $consultant->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $urlPath,
                        'name' => (string) ($translation['name'] ?? ''),
                        'role' => (string) ($translation['role'] ?? ''),
                        'card' => $this->rewriteDeep($translation['card'] ?? []),
                        'detail' => $this->consultantDetail($translation),
                        'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                        'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    ]
                );
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $offices
     */
    private function backfillConsultantOffices(array $offices): void
    {
        $cityByOffice = CmsOffice::query()->get()->keyBy('external_id');

        foreach ($offices as $row) {
            $officeId = (string) ($row['externalId'] ?? '');
            if ($officeId === '') {
                continue;
            }
            $ids = [];
            foreach ($row['translations'] ?? [] as $translation) {
                foreach (($translation['teamGroups'] ?? []) as $group) {
                    foreach ($group['consultantIds'] ?? [] as $consultantId) {
                        $ids[] = (int) $consultantId;
                    }
                }
            }
            $ids = array_values(array_unique(array_filter($ids)));
            if ($ids === []) {
                continue;
            }

            $cityId = $cityByOffice[(int) $officeId]->city_id ?? null;
            CmsConsultant::query()
                ->whereIn('external_id', $ids)
                ->where(function ($query) {
                    $query->whereNull('office_id')->orWhere('office_id', '');
                })
                ->update(array_filter([
                    'office_id' => $officeId,
                    'city_id' => $cityId,
                ], static fn ($value) => $value !== null && $value !== ''));
        }
    }

    /**
     * @param  list<array<string, mixed>>  $offices
     */
    private function seedOfficeLookups(array $offices): void
    {
        foreach ($offices as $position => $row) {
            $externalId = (string) ($row['externalId'] ?? '');
            if ($externalId === '') {
                continue;
            }
            $item = LookupItem::query()->updateOrCreate(
                [
                    'group' => 'offices',
                    'external_id' => $externalId,
                    'parent_external_id' => null,
                ],
                ['position' => $row['listRank'] ?? $position],
            );
            foreach ($row['translations'] ?? [] as $locale => $translation) {
                $item->translations()->updateOrCreate(
                    ['locale' => $locale],
                    ['label' => (string) ($translation['name'] ?? $row['shortSlug'] ?? $externalId)],
                );
            }
        }
    }

    /**
     * @param  array<string, mixed>  $ui
     */
    private function seedListUi(string $type, array $ui): void
    {
        foreach ($ui as $locale => $page) {
            CmsListPage::query()->updateOrCreate(
                ['type' => $type, 'locale' => $locale],
                [
                    'url_path' => $page['listPath'] ?? '',
                    'pager_base' => $page['pagerBase'] ?? ($page['listPath'] ?? ''),
                    'per_page' => (int) ($page['perPage'] ?? ($type === 'office' ? 18 : 15)),
                    'continue_label' => '',
                    'heading' => $page['breadcrumb']['heading'] ?? '',
                    'breadcrumb' => $this->rewriteDeep($page['breadcrumb'] ?? []),
                    'meta' => $this->rewriteDeep($page['meta'] ?? []),
                    'sidebar' => $this->rewriteDeep([
                        'searchHeading' => $page['searchHeading'] ?? '',
                        'searchPlaceholder' => $page['searchPlaceholder'] ?? '',
                        'submitLabel' => $page['submitLabel'] ?? '',
                        'foundTemplate' => $page['foundTemplate'] ?? '{count}',
                        'placeholders' => $page['placeholders'] ?? [],
                        'bindUrls' => $page['bindUrls'] ?? [],
                        'formAction' => $page['formAction'] ?? '',
                        'aliases' => $page['aliases'] ?? [],
                    ]),
                ]
            );
        }
    }

    /**
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    private function officeDetail(array $translation): array
    {
        $groups = [];
        foreach ($translation['teamGroups'] ?? [] as $group) {
            $groups[] = [
                'heading' => $group['heading'] ?? '',
                'consultantIds' => $group['consultantIds'] ?? [],
            ];
        }

        return $this->rewriteDeep([
            'image' => $this->media($translation['image'] ?? ''),
            'imageWebp' => $this->media($translation['imageWebp'] ?? ''),
            'phoneHref' => $translation['phoneHref'] ?? '',
            'phoneLabel' => $translation['phoneLabel'] ?? '',
            'email' => $translation['email'] ?? '',
            'address' => $translation['address'] ?? '',
            'instagram' => $translation['instagram'] ?? '',
            'portfoliosLabel' => $translation['portfoliosLabel'] ?? '',
            'tabs' => $translation['tabs'] ?? [],
            'teamGroups' => $groups,
            'listingIds' => $translation['listingIds'] ?? [],
            'map' => $translation['map'] ?? [],
        ]);
    }

    /**
     * @param  array<string, mixed>  $translation
     * @return array<string, mixed>
     */
    private function consultantDetail(array $translation): array
    {
        return $this->rewriteDeep([
            'image' => $this->media($translation['image'] ?? ''),
            'imageWebp' => $this->media($translation['imageWebp'] ?? ''),
            'email' => $translation['email'] ?? '',
            'phoneHref' => $translation['phoneHref'] ?? '',
            'phoneLabel' => $translation['phoneLabel'] ?? '',
            'officeHref' => $translation['officeHref'] ?? '',
            'officeName' => $translation['officeName'] ?? '',
            'tabs' => $translation['tabs'] ?? [],
            'bioHtml' => $translation['bioHtml'] ?? '',
            'listingIds' => $translation['listingIds'] ?? [],
            'allListingsLabel' => $translation['allListingsLabel'] ?? '',
            'commentHeading' => $translation['commentHeading'] ?? '',
            'form' => $translation['form'] ?? [],
        ]);
    }

    /**
     * @param  list<string>  $groups
     * @return array<string, string>
     */
    private function lookupLabelMap(array $groups): array
    {
        $map = [];
        $items = LookupItem::query()->whereIn('group', $groups)->with('translations')->get();
        foreach ($items as $item) {
            foreach ($item->translations as $translation) {
                $key = Str::lower(trim((string) $translation->label));
                if ($key !== '') {
                    $map[$key] = (string) $item->external_id;
                }
            }
        }

        return $map;
    }

    /**
     * @param  array<string, string>  $map
     */
    private function matchLabel(string $label, array $map): ?string
    {
        $key = Str::lower(trim($label));

        return $key !== '' ? ($map[$key] ?? null) : null;
    }

    private function uniqueOfficePath(string $path, string $locale, int $officeId, string $fallback): string
    {
        if ($path !== '' && $path !== '/' && ! CmsOfficeTranslation::query()->where('url_path', $path)->where('cms_office_id', '!=', $officeId)->exists()) {
            return $path;
        }
        if ($fallback !== '' && ! CmsOfficeTranslation::query()->where('url_path', $fallback)->where('cms_office_id', '!=', $officeId)->exists()) {
            return $fallback;
        }

        return '/'.$locale.'/office-'.$officeId;
    }

    private function uniqueConsultantPath(string $path, string $locale, int $consultantId): string
    {
        if ($path !== '' && $path !== '/' && ! CmsConsultantTranslation::query()->where('url_path', $path)->where('cms_consultant_id', '!=', $consultantId)->exists()) {
            return $path;
        }

        return '/'.$locale.'/consultant-'.$consultantId;
    }

    private function consultantPath(string $locale, int $id, string $slug): string
    {
        $template = (string) config('site.corporate.consultants.detail.'.$locale);

        return str_replace(['{id}', '{slug}'], [(string) $id, $slug !== '' ? $slug : (string) $id], $template);
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
