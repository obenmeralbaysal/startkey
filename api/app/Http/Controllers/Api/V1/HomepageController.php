<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PopularCity;
use App\Models\Property;
use App\Models\SiteStat;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomepageController extends Controller
{
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
        return Property::query()
            ->featured()
            ->with(['translations' => fn ($query) => $query->where('locale', $locale)])
            ->orderBy('position')
            ->get()
            ->map(function (Property $property) {
                $translation = $property->translations->first();

                return [
                    'externalId' => $property->external_id,
                    'urlPath' => $translation?->url_path ?? '',
                    'image' => $property->image,
                    'processType' => $translation?->process_type ?? '',
                    'adSubType' => $translation?->ad_sub_type ?? '',
                    'adType' => $translation?->ad_type ?? '',
                    'price' => $translation?->price ?? '',
                    'title' => $translation?->title ?? '',
                    'location' => $translation?->location ?? '',
                    'rooms' => $property->rooms,
                    'area' => $property->area,
                    'detailLabel' => $translation?->detail_label ?? '',
                ];
            })
            ->all();
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
