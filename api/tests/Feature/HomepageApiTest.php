<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Support\SeedsHomepageFixtures;
use Tests\TestCase;

class HomepageApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsHomepageFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedHomepageFixtures();
    }

    public function test_it_returns_the_turkish_homepage_payload(): void
    {
        $response = $this->getJson('/api/v1/homepage?locale=tr');

        $response->assertOk()
            ->assertJsonPath('data.stats.0.label', 'Startkey Franchise')
            ->assertJsonPath('data.stats.0.value', 84)
            ->assertJsonPath('data.featuredProperties.0.externalId', 479134)
            ->assertJsonPath('data.featuredProperties.0.title', 'Soğucak Mahallesi')
            ->assertJsonPath('data.popularCities.0.name', 'İzmir');
    }

    public function test_it_returns_localised_labels_for_english_and_german(): void
    {
        $this->getJson('/api/v1/homepage?locale=en')
            ->assertOk()
            ->assertJsonPath('data.featuredProperties.0.detailLabel', 'Detail')
            ->assertJsonPath('data.popularCities.0.name', 'Izmir');

        $this->getJson('/api/v1/homepage?locale=de')
            ->assertOk()
            ->assertJsonPath('data.stats.0.label', 'Startkey-Franchise')
            ->assertJsonPath('data.featuredProperties.0.processType', 'Zum Verkauf');
    }

    public function test_it_defaults_to_turkish_when_locale_is_omitted(): void
    {
        $this->getJson('/api/v1/homepage')
            ->assertOk()
            ->assertJsonPath('data.featuredProperties.0.title', 'Soğucak Mahallesi');
    }

    public function test_it_rejects_an_unsupported_locale(): void
    {
        $this->getJson('/api/v1/homepage?locale=fr')
            ->assertStatus(400)
            ->assertJsonPath('message', 'Desteklenmeyen dil.');
    }

    public function test_featured_cards_and_search_lists_read_the_portal_catalogue(): void
    {
        config([
            'reonix.base_url' => 'https://portal.test',
            'reonix.portal_key' => 'test-key',
        ]);
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => [[
                'id' => 9,
                'title' => 'Moda daire',
                'price' => 2500000,
                'currency' => 'TRY',
                'type' => 'sale',
                'property_type' => 'Konut',
                'category' => 'Daire',
                'address' => 'Kadikoy',
                'city_id' => 100,
                'city' => 'İzmir',
                'plate_code' => '35',
                'district' => 'Konak',
                'rooms' => '3+1',
                'area' => '120 m²',
                'image_count' => 1,
            ], [
                'id' => 10,
                'title' => 'Manisa daire',
                'price' => 900000,
                'currency' => 'TRY',
                'type' => 'rent',
                'property_type' => 'Konut',
                'city_id' => 45,
                'city' => 'Manisa',
                'plate_code' => '45',
                'district' => 'Şehzadeler',
                'image_count' => 0,
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [[
                'id' => 7,
                'name' => 'Kadikoy',
                'latitude' => '41',
                'longitude' => '29',
            ], [
                'id' => 8,
                'name' => 'No coordinates',
            ], [
                'id' => 9,
                'name' => 'Baytu',
                'latitude' => '25.2',
                'longitude' => '55.3',
                'location_needs_review' => true,
            ], [
                'id' => 11,
                'name' => 'Pearl',
                'latitude' => '35,3302379',
                'longitude' => '33,3486544',
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => [[
                'id' => 3,
                'name' => 'Ayse Demir',
                'office_id' => 7,
            ]]]),
        ]);

        $this->getJson('/api/v1/homepage?locale=tr')
            ->assertOk()
            ->assertJsonPath('data.featuredProperties.0.externalId', 9)
            ->assertJsonPath('data.featuredProperties.0.title', 'Moda daire')
            ->assertJsonPath('data.featuredProperties.0.detailLabel', 'Detay')
            ->assertJsonPath('data.featuredProperties.0.image', '/api/v1/catalogue/media/portfolios/9')
            ->assertJsonPath('data.featuredProperties.0.rooms', '3+1')
            ->assertJsonPath('data.featuredProperties.0.area', '120 m²')
            ->assertJsonPath('data.featuredProperties.0.location', 'Konak / İzmir')
            ->assertJsonPath('data.featuredProperties.0.adSubType', 'Daire')
            ->assertJsonCount(3, 'data.offices')
            ->assertJsonPath('data.offices.2.name', 'Pearl')
            ->assertJsonPath('data.offices.2.latitude', 35.3302379)
            ->assertJsonPath('data.offices.2.longitude', 33.3486544)
            ->assertJsonPath('data.offices.0.name', 'Kadikoy')
            ->assertJsonPath('data.offices.0.latitude', 41)
            ->assertJsonPath('data.offices.0.locationNeedsReview', false)
            ->assertJsonPath('data.offices.1.name', 'Baytu')
            ->assertJsonPath('data.offices.1.locationNeedsReview', true)
            ->assertJsonCount(2, 'data.popularCities')
            ->assertJsonFragment([
                'cityCode' => '100',
                'name' => 'İzmir',
                'image' => '/media/micrositecontent/izmir.jpg',
                'urlPath' => '/tr/portfoy?FilterDTO.CityId=100',
            ])
            ->assertJsonFragment([
                'cityCode' => '45',
                'name' => 'Manisa',
                'image' => '/img/catalogue-mark.svg',
                'urlPath' => '/tr/portfoy?FilterDTO.CityId=45',
            ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&FilterDTO.CityId=45')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.externalId', 10);

        $this->getJson('/api/v1/lookups/GetAllOffices?locale=tr')
            ->assertOk()
            ->assertJsonPath('items.1.text', 'Kadikoy');

        $this->getJson('/api/v1/lookups/users?locale=tr&officeId=7')
            ->assertOk()
            ->assertJsonPath('items.1.text', 'Ayse Demir');

        config([
            'reonix.base_url' => '',
            'reonix.portal_key' => '',
        ]);
    }

    public function test_it_returns_only_the_featured_set_for_each_locale(): void
    {
        $this->getJson('/api/v1/homepage?locale=tr')
            ->assertOk()
            ->assertJsonCount(1, 'data.featuredProperties')
            ->assertJsonPath('data.featuredProperties.0.externalId', 479134);

        $this->getJson('/api/v1/homepage?locale=en')
            ->assertOk()
            ->assertJsonCount(2, 'data.featuredProperties')
            ->assertJsonPath('data.featuredProperties.1.externalId', 463056);
    }
}
