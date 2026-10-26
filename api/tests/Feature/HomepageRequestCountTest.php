<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Support\SeedsHomepageFixtures;
use Tests\TestCase;

class HomepageRequestCountTest extends TestCase
{
    use RefreshDatabase;
    use SeedsHomepageFixtures;

    public function test_homepage_fetches_each_catalogue_once_and_caches_the_payload(): void
    {
        $this->seedHomepageFixtures();
        config(['reonix.base_url' => 'https://portal.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                ['id' => 7, 'name' => 'Kadikoy', 'city' => 'İstanbul', 'district' => 'Kadıköy', 'latitude' => '41', 'longitude' => '29'],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => []]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => [['id' => 3, 'name' => 'Ayse Demir', 'office_id' => 7]]]),
        ]);

        $this->getJson('/api/v1/homepage?locale=tr')->assertOk();
        $first = count(Http::recorded());
        $this->assertSame(3, $first, 'portfolios, offices and consultants are each fetched once');

        $this->getJson('/api/v1/homepage?locale=tr')->assertOk();
        $this->assertSame($first, count(Http::recorded()), 'second request must be served from cache');
    }
}
