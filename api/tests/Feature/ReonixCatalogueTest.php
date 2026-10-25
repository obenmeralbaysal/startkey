<?php

namespace Tests\Feature;

use App\Models\CmsListPage;
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
            ->assertJsonPath('data.items.0.urlPath', '/tr/ofisler/7/kadikoy')
            ->assertJsonPath('data.items.0.image', '/img/catalogue-mark.svg');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş portföy yok.');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Ayse Demir');
    }

    public function test_the_portal_office_list_keeps_the_reference_page_shell(): void
    {
        CmsListPage::query()->create([
            'type' => 'office',
            'locale' => 'tr',
            'url_path' => '/tr/ofisler',
            'pager_base' => '/tr/ofislerimiz',
            'per_page' => 18,
            'continue_label' => '',
            'heading' => 'Ofislerimiz',
            'breadcrumb' => ['heading' => 'Ofislerimiz', 'trail' => [
                ['href' => '/', 'label' => 'Anasayfa'],
                ['href' => null, 'label' => 'Ofislerimiz'],
            ]],
            'meta' => ['title' => 'Startkey Türkiye | Ofislerimiz'],
            'sidebar' => [
                'searchHeading' => 'Ofis Ara :',
                'searchPlaceholder' => 'Ofis Adı',
                'submitLabel' => 'Ara',
                'foundTemplate' => '{count} Ofis Bulundu',
                'formAction' => '/tr/ofisler',
            ],
        ]);
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                ['id' => 16369, 'name' => '1872', 'phone' => '+90 (232) 812-1872', 'address' => 'İzmir / Foça / Atatürk / Reha Midilli Cad. No:21'],
                ['id' => 8, 'name' => 'Moda', 'phone' => '', 'address' => 'Moda'],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.0.label', 'Anasayfa')
            ->assertJsonPath('data.meta.title', 'Startkey Türkiye | Ofislerimiz')
            ->assertJsonPath('data.foundLabel', '2 Ofis Bulundu')
            ->assertJsonPath('data.filter.action', '/tr/ofisler')
            ->assertJsonPath('data.items.0.location', 'İzmir / Foça')
            ->assertJsonPath('data.items.1.location', 'Moda');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&SearchText=yok')
            ->assertOk()
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.foundLabel', '0 Ofis Bulundu')
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş ofis yok.');
    }

    public function test_the_portal_office_list_uses_reference_texts_without_a_seeded_page(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                ['id' => 3, 'name' => 'Ege', 'phone' => '2323670535', 'address' => 'İzmir / Bornova'],
                ['id' => 2, 'name' => 'Çapa', 'phone' => '442081808616', 'address' => 'London / New Eltham'],
                ['id' => 1, 'name' => 'Corner', 'phone' => '+90 (232) 608-0035', 'address' => 'İzmir / Bornova'],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.0.label', 'Anasayfa')
            ->assertJsonPath('data.breadcrumb.trail.0.href', '/')
            ->assertJsonPath('data.meta.title', 'Startkey Türkiye | Ofislerimiz')
            ->assertJsonPath('data.foundLabel', '3 Ofis Bulundu')
            ->assertJsonPath('data.items.0.name', 'Corner')
            ->assertJsonPath('data.items.1.name', 'Çapa')
            ->assertJsonPath('data.items.2.name', 'Ege')
            ->assertJsonPath('data.items.0.phoneLabel', '+90 (232) 608-0035')
            ->assertJsonPath('data.items.1.phoneLabel', '+44 (208) 180-8616')
            ->assertJsonPath('data.items.2.phoneLabel', '+90 (232) 367-0535')
            ->assertJsonPath('data.items.2.phoneHref', 'tel:2323670535');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/offices')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.0.label', 'Home')
            ->assertJsonPath('data.filter.searchHeading', 'Search Office :')
            ->assertJsonPath('data.foundLabel', '3 Office Found');
    }

    public function test_portal_detail_pages_use_the_reference_labels(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/7' => Http::response(['data' => [
                'office' => ['id' => 7, 'name' => 'Akın', 'phone' => '2322023310', 'address' => 'İzmir / Karşıyaka / Fikri Altay'],
                'consultants' => [
                    ['id' => 1, 'name' => 'Meral Akın', 'role' => 'owner', 'phone' => '5010071971', 'email' => 'meral@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 2, 'name' => 'Berrin Coşkun', 'role' => 'agent', 'phone' => '', 'email' => 'berrin@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                ],
                'portfolios' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants/1' => Http::response(['data' => [
                'consultant' => ['id' => 1, 'name' => 'Meral Akın', 'role' => 'owner', 'phone' => '5010071971', 'email' => 'meral@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                'portfolios' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/7/akin')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.1.label', 'Ofislerimiz')
            ->assertJsonPath('data.breadcrumb.trail.2.label', 'Akın')
            ->assertJsonPath('data.meta.title', 'Startkey Türkiye | Akın')
            ->assertJsonPath('data.phoneLabel', '+90 (232) 202-3310')
            ->assertJsonPath('data.tabs.0.label', 'Ekibimiz')
            ->assertJsonPath('data.tabs.2.label', 'Konum')
            ->assertJsonPath('data.portfoliosLabel', 'Akın Tüm Portföyleri')
            ->assertJsonPath('data.teamGroups.0.heading', 'BROKER/OWNER')
            ->assertJsonPath('data.teamGroups.0.members.0.role', 'Broker/Owner')
            ->assertJsonPath('data.teamGroups.1.heading', 'PROFESYONELLER')
            ->assertJsonPath('data.teamGroups.1.members.0.role', 'Gayrimenkul Danışmanı')
            ->assertJsonPath('data.emptyListingsLabel', 'Henüz İlan Girilmemiş. Tüm İlanlarımızı Görmek İçin Butona Tıklayınız')
            ->assertJsonPath('data.pin', null)
            ->assertJsonPath('data.map', []);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar/1/meral-akin')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.1.label', 'Danışmanlarımız')
            ->assertJsonPath('data.tabs.1.label', 'Portföyler')
            ->assertJsonPath('data.contactLabels.office', 'Startkey:')
            ->assertJsonPath('data.role', 'Broker/Owner')
            ->assertJsonPath('data.commentHeading', 'Meral Akın için Yorum Ekle')
            ->assertJsonPath('data.form.submitLabel', 'Yorumu Gönder')
            ->assertJsonPath('data.mineListingsLabel', 'Tüm Portföylerim');
    }

    public function test_the_portal_office_detail_carries_a_map_pin_only_with_reonix_coordinates(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/7' => Http::response(['data' => [
                'office' => ['id' => 7, 'name' => 'Akın', 'phone' => '', 'address' => 'İzmir', 'latitude' => '38.4551', 'longitude' => '27.1123'],
                'consultants' => [],
                'portfolios' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/8' => Http::response(['data' => [
                'office' => ['id' => 8, 'name' => 'Ege', 'phone' => '', 'address' => 'İzmir', 'latitude' => null, 'longitude' => '27.1'],
                'consultants' => [],
                'portfolios' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/7/akin')
            ->assertOk()
            ->assertJsonPath('data.pin.id', 7)
            ->assertJsonPath('data.pin.name', 'Akın')
            ->assertJsonPath('data.pin.latitude', 38.4551)
            ->assertJsonPath('data.pin.longitude', 27.1123)
            ->assertJsonPath('data.map.query', '38.4551,27.1123')
            ->assertJsonMissingPath('data.map.iframeSrc');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/8/ege')
            ->assertOk()
            ->assertJsonPath('data.pin', null)
            ->assertJsonPath('data.map', []);
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

    public function test_a_catalogue_photo_is_served_from_this_site(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/media/offices/7/0' => Http::response('png', 200, ['Content-Type' => 'image/png']),
        ]);

        $this->get('/api/v1/catalogue/media/offices/7')
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }
}
