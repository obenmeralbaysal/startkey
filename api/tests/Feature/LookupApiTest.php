<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsHomepageFixtures;
use Tests\TestCase;

class LookupApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsHomepageFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedHomepageFixtures();
    }

    public function test_it_returns_the_placeholder_and_options(): void
    {
        $response = $this->getJson('/api/v1/lookups/Adtypes?locale=tr');

        $response->assertOk()
            ->assertJsonPath('items.0.id', '')
            ->assertJsonPath('items.0.text', 'Seçiniz')
            ->assertJsonPath('items.1.id', '1')
            ->assertJsonPath('items.1.text', 'Konut');
    }

    public function test_it_is_case_insensitive_on_the_endpoint_name(): void
    {
        $this->getJson('/api/v1/lookups/adtypes?locale=en')
            ->assertOk()
            ->assertJsonPath('items.0.text', 'Select')
            ->assertJsonPath('items.1.text', 'Residential');
    }

    public function test_dependent_dropdowns_filter_by_parent(): void
    {
        $this->getJson('/api/v1/lookups/ProcessTypes?locale=tr&adType=1')
            ->assertOk()
            ->assertJsonPath('items.1.text', 'Satılık');

        $this->getJson('/api/v1/lookups/ProcessTypes?locale=tr&adType=999')
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.id', '');
    }

    public function test_city_lookups_fall_back_to_turkiye_when_the_parent_is_missing(): void
    {
        $this->getJson('/api/v1/lookups/EnteredCitiesByCountryId?locale=tr')
            ->assertOk()
            ->assertJsonPath('items.1.text', 'İstanbul');
    }

    public function test_county_lookups_return_no_options_without_a_city(): void
    {
        $this->getJson('/api/v1/lookups/Counties?locale=tr')
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.text', 'Seçiniz');
    }

    public function test_search_uses_turkish_casing_rules(): void
    {
        $this->getJson('/api/v1/lookups/EnteredCitiesByCountryId?locale=tr&countryId=212&q=ist')
            ->assertOk()
            ->assertJsonPath('items.0.text', 'İstanbul')
            ->assertJsonMissing(['text' => 'Seçiniz']);

        $this->getJson('/api/v1/lookups/EnteredCitiesByCountryId?locale=tr&countryId=212&q=IST')
            ->assertOk()
            ->assertJsonCount(0, 'items');
    }

    public function test_unknown_endpoints_are_rejected(): void
    {
        $this->getJson('/api/v1/lookups/UnknownThing?locale=tr')
            ->assertNotFound()
            ->assertJsonPath('message', 'Bilinmeyen lookup uç noktası.');
    }
}
