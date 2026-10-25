<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PopularCity;
use App\Models\PropertyTranslation;
use App\Models\SiteStat;
use App\Services\ReonixCatalogue;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $portfolios = $this->catalogue->collection('portfolios');

        return response()->json([
            'data' => [
                'stats' => $this->stats($locale),
                'featuredProperties' => is_array($portfolios)
                    ? $this->featuredFromCatalogueRows($portfolios, $locale)
                    : $this->featuredProperties($locale),
                'popularCities' => is_array($portfolios)
                    ? $this->citiesFromPortfolios($portfolios, $locale)
                    : $this->popularCities($locale),
                'offices' => $this->catalogue->mapOffices($locale),
            ],
        ]);
    }

    private function stats(string $locale): array
    {
        return SiteStat::query()
            ->with(['translations' => fn ($query) => $query->where('locale', $locale)])
            ->orderBy('position')
            ->get()
            ->map(fn (SiteStat $stat) => [
                'icon' => $stat->icon,
                'value' => $stat->value,
                'suffix' => $stat->suffix,
                'label' => $stat->translations->first()?->label ?? '',
            ])
            ->all();
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
                    'image' => $property?->image ?? '',
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
            $image = is_string($photo?->image) && $photo->image !== '' ? $photo->image : $city['image'];

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
                    'image' => $city->image,
                    'name' => $translation?->name ?? '',
                    'urlPath' => $translation?->url_path ?? '',
                ];
            })
            ->all();
    }
}
