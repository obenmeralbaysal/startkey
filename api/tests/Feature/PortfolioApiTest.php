<?php

namespace Tests\Feature;

use App\Models\ListingInquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsPortfolioFixtures;
use Tests\TestCase;

class PortfolioApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsPortfolioFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->seedPortfolioFixtures();
    }

    public function test_it_lists_listings_in_captured_rank_order(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-list')
            ->assertJsonPath('data.items.0.externalId', 482754)
            ->assertJsonPath('data.items.1.externalId', 482720)
            ->assertJsonPath('data.filter.action', '/tr/portfoy')
            ->assertJsonPath('data.foundLabel', '3 İlan Bulundu')
            ->assertJsonPath('data.alternates.en', '/en/property');
    }

    public function test_it_resolves_english_and_german_list_aliases(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/portfoy')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-list')
            ->assertJsonPath('data.filter.action', '/en/portfoy');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/portfoy')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-list');
    }

    public function test_it_filters_by_city_keyword_and_price(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&FilterDTO.CityId=9')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.items.0.externalId', 482754);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&FilterDTO.Keyword=482720')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 482720);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&FilterDTO.MinPrice=10000000&FilterDTO.MaxPrice=20000000')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 479134);
    }

    public function test_it_sorts_by_price_and_date(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&SortingType=1')
            ->assertOk()
            ->assertJsonPath('data.items.0.externalId', 482720)
            ->assertJsonPath('data.items.2.externalId', 482754);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&SortingType=2')
            ->assertOk()
            ->assertJsonPath('data.items.0.externalId', 482754);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&SortingType=3')
            ->assertOk()
            ->assertJsonPath('data.items.0.externalId', 479134);
    }

    public function test_it_returns_a_detail_template_and_resolves_by_id_prefix(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/482754/satilik/bahce/aydin/soke/listing-482754')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-detail')
            ->assertJsonPath('data.title', 'Yamaçköy üretim')
            ->assertJsonPath('data.agent.href', '/tr/danismanlar/39942/mustafapulat')
            ->assertJsonPath('data.agent.officeHref', '/tr/ofisler/18453/laya')
            ->assertJsonPath('data.related.0.externalId', 482754);

        $this->getJson('/api/v1/corporate?locale=en&path=/en/property/482754/for-sale/garden/aydin/soke/other-slug')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-detail')
            ->assertJsonPath('data.agent.href', '/en/agents/39942/mustafapulat')
            ->assertJsonPath('data.agent.officeHref', '/en/offices/18453/laya');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/immobilien/482754/zu-verkaufen/park/aydin/soke/other-slug')
            ->assertOk()
            ->assertJsonPath('data.agent.href', '/de/immobilienmakleren/39942/mustafapulat')
            ->assertJsonPath('data.agent.officeHref', '/de/anbieteren/18453/laya');
    }

    public function test_it_hides_the_results_column_when_filters_match_nothing(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy&FilterDTO.Keyword=zzzz-none')
            ->assertOk()
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.pagination.total', 0)
            ->assertJsonCount(0, 'data.items');
    }

    public function test_it_stores_a_listing_inquiry(): void
    {
        $this->postJson('/api/v1/listings/482754/inquiries', [
            'subject' => 'Bilgi',
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])->assertCreated();

        $this->assertSame(1, ListingInquiry::query()->count());
        $this->assertSame(482754, ListingInquiry::query()->first()?->listing?->external_id);

        $this->postJson('/api/v1/listings/1/inquiries', [
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])->assertNotFound();
    }

    public function test_office_lookup_is_available_for_the_filter(): void
    {
        $this->getJson('/api/v1/lookups/GetAllOffices?locale=tr')
            ->assertOk()
            ->assertJsonPath('items.1.id', '18453')
            ->assertJsonPath('items.1.text', 'Laya');
    }
}
