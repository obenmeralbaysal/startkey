<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
