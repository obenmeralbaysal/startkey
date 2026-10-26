<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PopularCity;
use App\Models\PropertyTranslation;
use App\Models\SiteStat;
use App\Services\ReonixCatalogue;
use App\Support\Locale;
use App\Support\MediaPath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HomepageController extends Controller
{
    public function __construct(private readonly ReonixCatalogue $catalogue) {}

    /**
     * The homepage sections that are backed by data rather than page copy: the counter
     * strip, the featured portfolio carousel and the popular city cards.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $locale = Locale::fromRequest($request);
        $key = 'homepage:payload:'.$locale;
        $cached = Cache::get($key);
        if (is_array($cached)) {
            return response()->json(['data' => $cached]);
        }

        $portfolios = $this->catalogue->collection('portfolios');
        $data = [
            'stats' => $this->stats($locale),
            'featuredProperties' => is_array($portfolios)
                ? $this->featuredFromCatalogueRows($portfolios, $locale)
                : $this->featuredProperties($locale),
            'popularCities' => is_array($portfolios)
                ? $this->citiesFromPortfolios($portfolios, $locale)
                : $this->popularCities($locale),
            'offices' => $this->catalogue->mapOffices($locale),
        ];
        // Several sequential Reonix calls make a cold payload take seconds; keep a
        // good one for 5 minutes. Payloads without live map pins are not cached,
        // so a Reonix outage is not pinned for 5 minutes.
        if ($data['offices'] !== []) {
            Cache::put($key, $data, now()->addMinutes(5));
        }

        return response()->json(['data' => $data]);
    }

    /** Seeded counter keys that must show live Reonix numbers instead of static text. */
    private const LIVE_STATS = ['stat-1' => 'offices', 'stat-2' => 'portfolios', 'stat-3' => 'consultants'];

    private function stats(string $locale): array
    {
        $live = $this->liveCounts();

        return SiteStat::query()
            ->with(['translations' => fn ($query) => $query->where('locale', $locale)])
            ->orderBy('position')
            ->get()
            ->map(function (SiteStat $stat) use ($live) {
                $kind = self::LIVE_STATS[$stat->key] ?? null;
                if ($kind !== null && ! isset($live[$kind])) {
                    return null; // no live number: hide the counter rather than show a stale one
                }

                return [
                    'icon' => $stat->icon,
                    'value' => $kind !== null ? $live[$kind] : $stat->value,
                    'suffix' => $kind !== null ? '' : $stat->suffix,
                    'label' => $stat->translations->first()?->label ?? '',
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Live counts from the public Reonix catalogue (same rows the portal lists): active
     * offices, active portfolios, and consultants as people only (office cards that
     * Reonix may add to the consultant list carry type=office and are excluded).
     * Only successful, non-zero counts are cached (10 min); failures are not cached.
     *
     * @return array<string, int>
     */
    private function liveCounts(): array
    {
        $cached = Cache::get('homepage:live-counts');
        if (is_array($cached)) {
            return $cached;
        }
        $counts = [];
        foreach (array_unique(array_values(self::LIVE_STATS)) as $kind) {
            $rows = $this->catalogue->collection($kind);
            if (! is_array($rows)) {
                continue;
            }
            if ($kind === 'consultants') {
                $rows = array_filter($rows, fn (array $row) => ($row['type'] ?? '') !== 'office');
            }
            if (count($rows) > 0) {
                $counts[$kind] = count($rows);
            }
        }
        if (count($counts) === count(array_unique(array_values(self::LIVE_STATS)))) {
            Cache::put('homepage:live-counts', $counts, now()->addMinutes(10));
        }

        return $counts;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function featuredFromCatalogueRows(array $rows, string $locale): array
    {
        return array_map(
            fn (array $row) => $this->featuredFromCatalogue($row, $locale),
            array_slice($rows, 0, 12),
        );
    }

    private function featuredProperties(string $locale): array
    {
        return PropertyTranslation::query()
            ->where('locale', $locale)
            ->where('is_featured', true)
            ->with('property')
            ->orderBy('featured_position')
            ->get()
            ->map(function (PropertyTranslation $translation) {
                $property = $translation->property;

                return [
                    'externalId' => $property?->external_id,
                    'urlPath' => $translation->url_path,
                    'image' => MediaPath::absolute($property?->image ?? '', 'property'),
                    'processType' => $translation->process_type,
                    'adSubType' => $translation->ad_sub_type,
                    'adType' => $translation->ad_type,
                    'price' => $translation->price,
                    'title' => $translation->title,
                    'location' => $translation->location,
                    'rooms' => $property?->rooms ?? '',
                    'area' => $property?->area ?? '',
                    'detailLabel' => $translation->detail_label,
                ];
            })
            ->all();
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function featuredFromCatalogue(array $row, string $locale): array
    {
        $card = $this->catalogue->listingCard($row, $locale);
        $location = trim(implode(' / ', array_filter([
            trim((string) ($row['district'] ?? '')),
            trim((string) ($row['city'] ?? '')),
        ], fn (string $part) => $part !== '')));

        return [
            'externalId' => $card['externalId'],
            'urlPath' => $card['urlPath'],
            'image' => $card['image'],
            'processType' => match ((string) ($row['type'] ?? '')) {
                'sale' => match ($locale) {
                    'en' => 'For Sale',
                    'de' => 'Zum Verkauf',
                    default => 'Satılık',
                },
                'rent' => match ($locale) {
                    'en' => 'For Rent',
                    'de' => 'Vermietung',
                    default => 'Kiralık',
                },
                default => (string) ($row['type'] ?? ''),
            },
            'adSubType' => (string) ($row['category'] ?? ''),
            'adType' => (string) ($row['property_type'] ?? ''),
            'price' => $card['price'],
            'title' => $card['title'],
            'location' => $location !== '' ? $location : $card['location'],
            'rooms' => (string) ($row['rooms'] ?? ''),
            'area' => (string) ($row['area'] ?? ''),
            'detailLabel' => $locale === 'tr' ? 'Detay' : 'Detail',
            'has_watermarked_media' => $card['has_watermarked_media'],
        ];
    }

    /**
     * Cities that currently have a listed portfolio. A stored city photo is used when
     * its plate code matches; otherwise the first portfolio photo is used.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function citiesFromPortfolios(array $rows, string $locale): array
    {
        $cities = [];
        foreach ($rows as $row) {
            $id = (int) ($row['city_id'] ?? 0);
            $name = trim((string) ($row['city'] ?? ''));
            if ($id < 1 || $name === '') {
                continue;
            }
            if (! isset($cities[$id])) {
                $cities[$id] = [
                    'id' => $id,
                    'plate' => trim((string) ($row['plate_code'] ?? '')),
                    'name' => $name,
                    'count' => 0,
                    'image' => '',
                ];
            }
            $cities[$id]['count']++;
            if ($cities[$id]['image'] === '' && (int) ($row['image_count'] ?? 0) > 0 && (int) ($row['id'] ?? 0) > 0) {
                $cities[$id]['image'] = '/api/v1/catalogue/media/portfolios/'.(int) $row['id'];
            }
        }

        uasort($cities, function (array $left, array $right): int {
            return $right['count'] <=> $left['count'] ?: strcmp($left['name'], $right['name']);
        });

        $plates = array_values(array_filter(array_column($cities, 'plate'), fn ($plate) => $plate !== ''));
        $photos = $plates === []
            ? collect()
            : PopularCity::query()->whereIn('city_code', $plates)->get()->keyBy('city_code');
        $paths = config('site.corporate.listings.lists.'.$locale, []);
        $base = is_array($paths) && isset($paths[0]) && is_string($paths[0]) ? $paths[0] : '/'.$locale.'/portfoy';

        return array_map(function (array $city) use ($photos, $base) {
            $photo = $city['plate'] !== '' ? $photos->get($city['plate']) : null;
            $stored = is_string($photo?->image) ? $photo->image : '';
            $image = $stored !== '' ? MediaPath::absolute($stored, 'micrositecontent') : $city['image'];

            return [
                'cityCode' => (string) $city['id'],
                'image' => $image !== '' ? $image : '/img/catalogue-mark.svg',
                'name' => $city['name'],
                'urlPath' => $base.'?FilterDTO.CityId='.$city['id'],
            ];
        }, array_slice($cities, 0, 12));
    }

    private function popularCities(string $locale): array
    {
        return PopularCity::query()
            ->with(['translations' => fn ($query) => $query->where('locale', $locale)])
            ->orderBy('position')
            ->get()
            ->map(function (PopularCity $city) {
                $translation = $city->translations->first();

                return [
                    'cityCode' => $city->city_code,
                    'image' => MediaPath::absolute($city->image, 'micrositecontent'),
                    'name' => $translation?->name ?? '',
                    'urlPath' => $translation?->url_path ?? '',
                ];
            })
            ->all();
    }
}
