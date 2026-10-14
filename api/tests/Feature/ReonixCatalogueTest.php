<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReonixCatalogueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'reonix.base_url' => 'https://portal.test',
            'reonix.portal_key' => 'test-key',
        ]);
    }

    protected function tearDown(): void
    {
        config([
            'reonix.base_url' => '',
            'reonix.portal_key' => '',
        ]);
        parent::tearDown();
    }

    public function test_public_lists_read_the_portal_catalogue(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [[
                'id' => 7,
                'name' => 'Kadikoy',
                'phone' => '02120000000',
                'email' => 'ofis@example.com',
                'address' => 'Moda',
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => []]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => [[
                'id' => 3,
                'name' => 'Ayse Demir',
                'role' => 'agent',
                'phone' => '05550000000',
                'email' => 'ayse@example.com',
                'office_id' => 7,
                'office_name' => 'Kadikoy',
            ]]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.hasResults', true)
            ->assertJsonPath('data.items.0.name', 'Kadikoy')
            ->assertJsonPath('data.items.0.urlPath', '/tr/ofisler/7/kadikoy');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş portföy yok.');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Ayse Demir');
    }

    public function test_a_listing_inquiry_is_sent_to_the_portal(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/9/inquiries' => Http::response(['data' => ['id' => 44]], 201),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/1/inquiries' => Http::response(['error' => 'not_found'], 404),
        ]);

        $this->postJson('/api/v1/listings/9/inquiries', [
            'subject' => 'Bilgi',
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])->assertCreated()->assertJsonPath('data.id', 44);

        $this->postJson('/api/v1/listings/1/inquiries', [
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])->assertNotFound();

        $this->assertDatabaseCount('listing_inquiries', 0);
    }
}
