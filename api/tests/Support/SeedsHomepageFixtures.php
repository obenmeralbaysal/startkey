<?php

namespace Tests\Support;

use App\Models\LookupItem;
use App\Models\PopularCity;
use App\Models\Property;
use App\Models\SiteStat;

trait SeedsHomepageFixtures
{
    /**
     * A small, deterministic slice of the homepage data used by the API tests.
     * Production still loads the full reference snapshot through ReferenceDataSeeder.
     */
    protected function seedHomepageFixtures(): void
    {
        $stat = SiteStat::query()->create([
            'key' => 'stat-1',
            'icon' => '/themes/fela/img/counter-1.png',
            'value' => 84,
            'suffix' => '+',
            'position' => 1,
        ]);
        $stat->translations()->createMany([
            ['locale' => 'tr', 'label' => 'Startkey Franchise'],
            ['locale' => 'en', 'label' => 'Startkey Franchise'],
            ['locale' => 'de', 'label' => 'Startkey-Franchise'],
        ]);

        $property = Property::query()->create([
            'external_id' => 479134,
            'image' => 'property-1.jpg',
            'rooms' => '3+1',
            'area' => '162 m²',
            'is_featured' => true,
            'position' => 1,
        ]);
        $property->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/portfoy/479134',
                'process_type' => 'Satılık',
                'ad_sub_type' => 'Daire',
                'ad_type' => 'Konut',
                'price' => '₺ 10.500.000',
                'title' => 'Soğucak Mahallesi',
                'location' => 'Aydın , Kuşadası',
                'detail_label' => 'Detay',
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/portfoy/479134',
                'process_type' => 'For Sale',
                'ad_sub_type' => 'Apartment',
                'ad_type' => 'Residential',
                'price' => '₺ 10.500.000',
                'title' => 'Sogucak District',
                'location' => 'Aydin , Kusadasi',
                'detail_label' => 'Detail',
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/portfoy/479134',
                'process_type' => 'Zum Verkauf',
                'ad_sub_type' => 'Wohnung',
                'ad_type' => 'Wohnen',
                'price' => '₺ 10.500.000',
                'title' => 'Sogucak Viertel',
                'location' => 'Aydin , Kusadasi',
                'detail_label' => 'Detail',
            ],
        ]);

        $city = PopularCity::query()->create([
            'city_code' => '35',
            'image' => 'izmir.jpg',
            'position' => 1,
        ]);
        $city->translations()->createMany([
            ['locale' => 'tr', 'name' => 'İzmir', 'url_path' => '/tr/portfoy?FilterDTO.CityId=35'],
            ['locale' => 'en', 'name' => 'Izmir', 'url_path' => '/en/portfoy?FilterDTO.CityId=35'],
            ['locale' => 'de', 'name' => 'Izmir', 'url_path' => '/de/portfoy?FilterDTO.CityId=35'],
        ]);

        $this->lookup('ad_types', '1', null, 1, ['tr' => 'Konut', 'en' => 'Residential', 'de' => 'Wohnen']);
        $this->lookup('process_types', '10', '1', 1, ['tr' => 'Satılık', 'en' => 'For Sale', 'de' => 'Zum Verkauf']);
        $this->lookup('property_countries', '212', null, 1, ['tr' => 'Türkiye', 'en' => 'Türkiye', 'de' => 'Türkei']);
        $this->lookup('property_cities', '34', '212', 1, ['tr' => 'İstanbul', 'en' => 'Istanbul', 'de' => 'Istanbul']);
        $this->lookup('property_cities', '35', '212', 2, ['tr' => 'İzmir', 'en' => 'Izmir', 'de' => 'Izmir']);
        $this->lookup('counties', '1', '35', 1, ['tr' => 'Konak', 'en' => 'Konak', 'de' => 'Konak']);
    }

    private function lookup(string $group, string $externalId, ?string $parent, int $position, array $labels): void
    {
        $item = LookupItem::query()->create([
            'group' => $group,
            'external_id' => $externalId,
            'parent_external_id' => $parent,
            'position' => $position,
        ]);

        foreach ($labels as $locale => $label) {
            $item->translations()->create(['locale' => $locale, 'label' => $label]);
        }
    }
}
