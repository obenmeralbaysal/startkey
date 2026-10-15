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

        return response()->json([
            'data' => [
                'stats' => $this->stats($locale),
                'featuredProperties' => $this->featuredProperties($locale),
                'popularCities' => $this->popularCities($locale),
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

    private function featuredProperties(string $locale): array
    {
        $remote = $this->catalogue->collection('portfolios');
        if (is_array($remote)) {
            return array_map(
                fn (array $row) => $this->featuredFromCatalogue($row, $locale),
                array_slice($remote, 0, 12),
            );
        }

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
            'adSubType' => '',
            'adType' => (string) ($row['property_type'] ?? ''),
            'price' => $card['price'],
            'title' => $card['title'],
            'location' => $card['location'],
            'rooms' => '',
            'area' => '',
            'detailLabel' => $locale === 'tr' ? 'Detay' : 'Detail',
        ];
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
