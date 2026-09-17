<?php

namespace Database\Seeders;

use App\Models\LookupItem;
use App\Models\PopularCity;
use App\Models\Property;
use App\Models\SiteStat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads database/data/reference-seed.json, which is generated from the reference
 * website by scripts/build-api-seed.py.
 *
 * The homepage statistics, featured portfolio and popular cities will be supplied by
 * Reonix later; until then the API serves these captured values (see
 * docs/TECHNICAL_DEBT.md). The seeder is idempotent: running it again updates the
 * existing rows instead of duplicating them.
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/reference-seed.json');

        if (! is_file($path)) {
            throw new RuntimeException("Reference seed data not found at {$path}.");
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            $this->seedStats($data['stats']);
            $this->seedProperties($data['featuredProperties']);
            $this->seedPopularCities($data['popularCities']);
            $this->seedLookups($data['lookups']);
        });
    }

    private function seedStats(array $stats): void
    {
        foreach ($stats as $row) {
            $stat = SiteStat::updateOrCreate(
                ['key' => $row['key']],
                [
                    'icon' => $row['icon'],
                    'value' => $row['value'],
                    'suffix' => $row['suffix'],
                    'position' => $row['position'],
                ],
            );

            foreach ($row['translations'] as $locale => $translation) {
                $stat->translations()->updateOrCreate(
                    ['locale' => $locale],
                    ['label' => $translation['label']],
                );
            }
        }
    }

    private function seedProperties(array $properties): void
    {
        foreach ($properties as $row) {
            $property = Property::updateOrCreate(
                ['external_id' => $row['externalId']],
                [
                    'image' => $row['image'],
                    'rooms' => $row['rooms'],
                    'area' => $row['area'],
                    'is_featured' => true,
                    'position' => $row['position'],
                ],
            );

            foreach ($row['translations'] as $locale => $translation) {
                $property->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'url_path' => $translation['urlPath'],
                        'process_type' => $translation['processType'],
                        'ad_sub_type' => $translation['adSubType'],
                        'ad_type' => $translation['adType'],
                        'price' => $translation['price'],
                        'title' => $translation['title'],
                        'location' => $translation['location'],
                        'detail_label' => $translation['detailLabel'],
                    ],
                );
            }
        }
    }

    private function seedPopularCities(array $cities): void
    {
        foreach ($cities as $row) {
            $city = PopularCity::updateOrCreate(
                ['city_code' => $row['cityCode']],
                [
                    'image' => $row['image'],
                    'position' => $row['position'],
                ],
            );

            foreach ($row['translations'] as $locale => $translation) {
                $city->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'name' => $translation['name'],
                        'url_path' => $translation['urlPath'],
                    ],
                );
            }
        }
    }

    private function seedLookups(array $lookups): void
    {
        foreach ($lookups as $row) {
            $item = LookupItem::updateOrCreate(
                [
                    'group' => $row['group'],
                    'external_id' => $row['externalId'],
                    'parent_external_id' => $row['parentExternalId'],
                ],
                ['position' => $row['position']],
            );

            foreach ($row['translations'] as $locale => $label) {
                $item->translations()->updateOrCreate(
                    ['locale' => $locale],
                    ['label' => $label],
                );
            }
        }
    }
}
