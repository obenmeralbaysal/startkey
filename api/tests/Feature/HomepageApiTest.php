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
                'address' => 'Kadikoy',
                'image_count' => 1,
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [[
                'id' => 7,
                'name' => 'Kadikoy',
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
            ->assertJsonPath('data.featuredProperties.0.image', '/api/v1/catalogue/media/portfolios/9');

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
