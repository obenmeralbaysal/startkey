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
            'https://portal.test/api/v1/integrations/portal/catalogue/offices*' => Http::response(['data' => [
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

        Http::assertSent(fn ($request) => str_contains($request->url(), 'catalogue/offices') && str_contains($request->url(), 'q=yok'));
    }

    public function test_directory_search_folds_turkish_letters_and_forwards_q(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices*' => Http::response(['data' => [
                ['id' => 1, 'name' => 'Boğaz', 'address' => 'İstanbul / Şişli / X', 'city' => 'İstanbul', 'district' => 'Şişli'],
                ['id' => 2, 'name' => 'Gül', 'address' => 'Ankara / Çankaya', 'city' => 'Ankara', 'district' => 'Çankaya'],
                ['id' => 3, 'name' => 'Işık', 'address' => 'İzmir / Konak', 'city' => 'İzmir', 'district' => 'Konak'],
            ], 'places' => [
                ['city' => 'Ankara', 'districts' => ['Çankaya']],
                ['city' => 'İstanbul', 'districts' => ['Şişli']],
                ['city' => 'İzmir', 'districts' => ['Konak']],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants*' => Http::response(['data' => [
                ['id' => 9, 'name' => 'Gül Ak', 'office_name' => 'Işık', 'city' => 'İzmir', 'district' => 'Konak', 'office_id' => 3],
                ['id' => 8, 'name' => 'Ada Yılmaz', 'office_name' => 'Boğaz', 'city' => 'İstanbul', 'district' => 'Şişli', 'office_id' => 1],
            ]]),
        ]);

        foreach (['İstanbul', 'istanbul', 'ISTANBUL'] as $term) {
            $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&q='.rawurlencode($term))
                ->assertOk()
                ->assertJsonPath('data.pagination.total', 1)
                ->assertJsonPath('data.items.0.name', 'Boğaz');
        }
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&q=sisli')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Boğaz');
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&q=gul')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Gül');
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&q=isik')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Işık');
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&il='.rawurlencode('İstanbul').'&ilce='.rawurlencode('Şişli'))
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.name', 'Boğaz')
            ->assertJsonPath('data.filter.places.1.city', 'İstanbul');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&q=gul')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Gül Ak');
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&q=isik')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Gül Ak');
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&q=sisli')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'Ada Yılmaz');

        $names = collect($this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')->assertOk()->json('data.items'))->pluck('name')->all();
        $this->assertSame(['Boğaz', 'Gül', 'Işık'], $names);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'catalogue/offices') && str_contains(rawurldecode($request->url()), 'q=İstanbul'));
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
            ->assertJsonPath('data.teamGroups.0.members.0.role', 'owner')
            ->assertJsonPath('data.teamGroups.0.members.0.title', 'Broker/Owner')
            ->assertJsonPath('data.owners.0.externalId', 1)
            ->assertJsonPath('data.owner.externalId', 1)
            ->assertJsonPath('data.owner.name', 'Meral Akın')
            ->assertJsonPath('data.teamGroups.1.heading', 'PROFESYONELLER')
            ->assertJsonPath('data.teamGroups.1.members.0.role', 'agent')
            ->assertJsonPath('data.teamGroups.1.members.0.title', 'Gayrimenkul Danışmanı')
            ->assertJsonPath('data.emptyListingsLabel', 'Henüz İlan Girilmemiş. Tüm İlanlarımızı Görmek İçin Butona Tıklayınız')
            ->assertJsonPath('data.pin', null)
            ->assertJsonPath('data.map', []);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar/1/meral-akin')
            ->assertOk()
            ->assertJsonPath('data.breadcrumb.trail.1.label', 'Danışmanlarımız')
            ->assertJsonPath('data.tabs.1.label', 'Portföyler')
            ->assertJsonPath('data.contactLabels.office', 'Startkey:')
            ->assertJsonPath('data.role', 'owner')
            ->assertJsonPath('data.title', 'Broker/Owner')
            ->assertJsonPath('data.commentHeading', 'Meral Akın için Yorum Ekle')
            ->assertJsonPath('data.form.submitLabel', 'Yorumu Gönder')
            ->assertJsonPath('data.mineListingsLabel', 'Tüm Portföylerim');
    }

    public function test_an_office_lists_every_owner_and_keeps_a_managers_own_title(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/7' => Http::response(['data' => [
                'office' => [
                    'id' => 7,
                    'name' => 'Akın',
                    'phone' => '',
                    'address' => 'İzmir',
                    'owner_id' => 1,
                    'owners' => [
                        ['id' => 1, 'first_name' => 'Meral', 'last_name' => 'Akın', 'email' => 'meral@example.com'],
                        ['id' => 3, 'first_name' => 'Ali', 'last_name' => 'Akın', 'email' => 'ali@example.com'],
                    ],
                ],
                'consultants' => [
                    ['id' => 1, 'name' => 'Meral Akın', 'role' => 'owner', 'phone' => '', 'email' => 'meral@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 4, 'name' => 'Deniz Yönetici', 'role' => 'office_manager', 'title' => 'Broker Manager', 'phone' => '', 'email' => 'deniz@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 6, 'name' => 'Kerem Ortak', 'role' => 'manager', 'title' => 'Broker/Owner', 'phone' => '', 'email' => 'kerem@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 3, 'name' => 'Ali Akın', 'role' => 'owner', 'phone' => '', 'email' => 'ali@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 5, 'name' => 'Saha Yılmaz', 'role' => 'manager', 'title' => ['name' => 'Saha Yöneticisi'], 'phone' => '', 'email' => 'saha@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 2, 'name' => 'Berrin Coşkun', 'role' => 'agent', 'title_name' => 'Kıdemli Danışman', 'phone' => '', 'email' => 'berrin@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                    ['id' => 8, 'name' => 'Boş Ünvan', 'role' => 'office_manager', 'title' => '   ', 'phone' => '', 'email' => 'bos@example.com', 'office_id' => 7, 'office_name' => 'Akın'],
                ],
                'portfolios' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                [
                    'id' => 11,
                    'name' => 'Çift',
                    'phone' => '',
                    'address' => 'İzmir / Konak',
                    'owner_id' => 99,
                    'owner_first_name' => 'Eski',
                    'owner_last_name' => 'Kayıt',
                    'owners' => [
                        ['id' => 8, 'first_name' => 'Ada', 'last_name' => 'Bir', 'email' => 'ada@example.com'],
                        ['id' => 9, 'first_name' => 'Efe', 'last_name' => 'İki', 'email' => 'efe@example.com'],
                    ],
                ],
                [
                    'id' => 12,
                    'name' => 'Tek',
                    'phone' => '',
                    'address' => 'İzmir / Bornova',
                    'owner_id' => 4,
                    'owner_first_name' => 'Can',
                    'owner_last_name' => 'Tek',
                    'owner_email' => 'can@example.com',
                ],
            ]]),
        ]);

        $detail = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/7/akin')->assertOk()->json('data');
        $this->assertSame([1, 3], array_column($detail['owners'], 'externalId'));
        $this->assertSame($detail['owners'][0], $detail['owner']);
        $this->assertSame('Meral Akın', $detail['owner']['name']);
        $this->assertSame('owner', $detail['owner']['role']);
        $this->assertSame('Broker/Owner', $detail['owner']['title']);

        $this->assertSame('BROKER/OWNER', $detail['teamGroups'][0]['heading']);
        $this->assertSame(['Meral Akın', 'Kerem Ortak', 'Ali Akın'], array_column($detail['teamGroups'][0]['members'], 'name'));
        $this->assertSame(['owner', 'manager', 'owner'], array_column($detail['teamGroups'][0]['members'], 'role'));
        $this->assertSame('', $detail['teamGroups'][1]['heading']);
        $this->assertSame(['Deniz Yönetici', 'Saha Yılmaz', 'Boş Ünvan'], array_column($detail['teamGroups'][1]['members'], 'name'));
        $this->assertSame('PROFESYONELLER', $detail['teamGroups'][2]['heading']);

        $manager = $detail['teamGroups'][1]['members'][0];
        $this->assertSame('Broker Manager', $manager['title']);
        $this->assertSame('office_manager', $manager['role']);
        $this->assertNotContains(4, array_column($detail['owners'], 'externalId'));
        $this->assertSame('Saha Yöneticisi', $detail['teamGroups'][1]['members'][1]['title']);
        $this->assertSame('manager', $detail['teamGroups'][1]['members'][1]['role']);
        $this->assertSame('Broker/Owner', $detail['teamGroups'][1]['members'][2]['title']);
        $this->assertSame('office_manager', $detail['teamGroups'][1]['members'][2]['role']);
        $this->assertSame('Kıdemli Danışman', $detail['teamGroups'][2]['members'][0]['title']);
        $this->assertSame('agent', $detail['teamGroups'][2]['members'][0]['role']);

        $list = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')->assertOk()->json('data.items');
        $pair = collect($list)->firstWhere('externalId', 11);
        $single = collect($list)->firstWhere('externalId', 12);
        $this->assertSame(['Ada Bir', 'Efe İki'], array_column($pair['owners'], 'name'));
        $this->assertSame($pair['owners'][0], $pair['owner']);
        $this->assertSame('owner', $pair['owner']['role']);
        $this->assertSame('Broker/Owner', $pair['owner']['title']);
        $this->assertSame('Can Tek', $single['owner']['name']);
        $this->assertSame([$single['owner']], $single['owners']);
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

    public function test_the_portal_office_detail_carries_social_links(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/9' => Http::response(['data' => [
                'office' => ['id' => 9, 'name' => '1872', 'phone' => '', 'address' => 'İzmir', 'social' => [
                    ['network' => 'instagram', 'href' => 'https://www.instagram.com/startkey.1872/'],
                    ['network' => 'facebook', 'href' => 'javascript:alert(1)'],
                ]],
                'consultants' => [],
                'portfolios' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/9/1872')
            ->assertOk()
            ->assertJsonPath('data.instagram', 'https://www.instagram.com/startkey.1872/')
            ->assertJsonPath('data.social', [['network' => 'instagram', 'href' => 'https://www.instagram.com/startkey.1872/']]);
    }

    public function test_the_portal_consultant_list_is_in_turkish_alphabetical_order(): void
    {
        $rows = [];
        foreach (['Burak Kaya', 'Çağla Er', ' Ahmet Su', 'Zeki Ay', 'İrem Ok', 'Ilgın Ak', 'ayşe Tan', 'Can Bal'] as $i => $name) {
            $rows[] = ['id' => $i + 1, 'name' => $name, 'role' => 'agent', 'office_id' => 7, 'office_name' => 'Kadikoy'];
        }
        $rows[] = ['type' => 'office', 'id' => 'office-7', 'office_id' => 7, 'name' => 'Alfa'];
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => $rows]),
        ]);

        $names = collect($this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')->assertOk()->json('data.items'))
            ->pluck('name')->map(fn ($n) => trim((string) $n))->all();

        $this->assertSame(['Ahmet Su', 'Alfa', 'ayşe Tan', 'Burak Kaya', 'Can Bal', 'Çağla Er', 'Ilgın Ak', 'İrem Ok', 'Zeki Ay'], $names);
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

    public function test_a_bare_listing_filename_becomes_a_media_path(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => [[
                'id' => 9,
                'title' => 'Moda daire',
                'type' => 'sale',
                'image' => '0a161bef-78c7-4a9f-8659-180c1f7e0840.jpg',
                'image_count' => 0,
            ], [
                'id' => 10,
                'title' => 'Fotoğraflı',
                'type' => 'sale',
                'image' => 'ignored.jpg',
                'image_count' => 2,
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [[
                'id' => 174,
                'name' => 'A Plus',
                'logo' => 'a-plus.png',
                'has_image' => false,
            ]]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.items.0.image', '/media/property/0a161bef-78c7-4a9f-8659-180c1f7e0840.jpg')
            ->assertJsonPath('data.items.1.image', '/api/v1/catalogue/media/portfolios/10');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.items.0.image', '/media/officelogo/a-plus.png');
    }

    public function test_listing_detail_renders_description_specs_features_and_card_meta(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/9' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 9,
                    'title' => 'Moda daire',
                    'type' => 'sale',
                    'description' => "Birinci satır\nİkinci satır\n\n<script>alert(1)</script> & \"tırnak\"",
                    'rooms' => '2+1',
                    'area' => '84 m²',
                    'specs' => [
                        ['label' => 'Oda Sayısı', 'value' => '2+1'],
                        ['label' => 1, 'value' => 'bad'],
                        ['value' => 'missing'],
                        'not-a-pair',
                        ['label' => 'm² (Brüt)', 'value' => '84'],
                        ['label' => ' ', 'value' => 'x'],
                    ],
                    'feature_groups' => [
                        ['heading' => 'İç Özellikler', 'items' => ['Asansör', '', 12, 'Balkon']],
                        ['heading' => 'Boş', 'items' => []],
                        ['heading' => '', 'items' => ['x']],
                        ['items' => ['y']],
                    ],
                ],
                'office' => [],
                'agent' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/10' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 10,
                    'title' => 'Arsa',
                    'type' => 'sale',
                    'description' => '   ',
                    'rooms' => '',
                    'area' => '   ',
                ],
                'office' => [],
                'agent' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => [
                ['id' => 9, 'title' => 'Moda daire', 'type' => 'sale', 'rooms' => '2+1', 'area' => '84 m²'],
                ['id' => 10, 'title' => 'Arsa', 'type' => 'sale', 'rooms' => '', 'area' => '   '],
            ]]),
        ]);

        $html = '<p>Birinci satır<br />'."\n".'İkinci satır</p><p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;tırnak&quot;</p>';

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/9/satilik')
            ->assertOk()
            ->assertJsonPath('data.descriptionHeading', 'Açıklama')
            ->assertJsonPath('data.descriptionHtml', $html)
            ->assertJsonPath('data.specs', [
                ['label' => 'Oda Sayısı', 'value' => '2+1'],
                ['label' => 'm² (Brüt)', 'value' => '84'],
            ])
            ->assertJsonPath('data.featureGroups', [
                ['heading' => 'İç Özellikler', 'items' => ['Asansör', 'Balkon']],
            ]);

        $this->getJson('/api/v1/corporate?locale=en&path=/en/property/9/satilik')
            ->assertOk()
            ->assertJsonPath('data.descriptionHeading', 'Description')
            ->assertJsonPath('data.descriptionHtml', $html);

        $this->getJson('/api/v1/corporate?locale=de&path=/de/immobilien/9/satilik')
            ->assertOk()
            ->assertJsonPath('data.descriptionHeading', 'Beschreibung');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/10/satilik')
            ->assertOk()
            ->assertJsonPath('data.descriptionHeading', '')
            ->assertJsonPath('data.descriptionHtml', '')
            ->assertJsonPath('data.specs', [])
            ->assertJsonPath('data.featureGroups', []);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.items.0.features', [
                ['icon' => 'flaticon-double-bed', 'text' => '2+1'],
                ['icon' => 'flaticon-square', 'text' => '84 m²'],
            ])
            ->assertJsonPath('data.items.1.features', []);
    }

    public function test_a_listing_gallery_includes_every_photo_up_to_the_media_index(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/9' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 9,
                    'title' => 'Moda daire',
                    'type' => 'sale',
                    'image_count' => 80,
                ],
                'office' => [],
                'agent' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/10' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 10,
                    'title' => 'Az foto',
                    'type' => 'sale',
                    'image_count' => 3,
                ],
                'office' => [],
                'agent' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/media/portfolios/9/59' => Http::response('jpeg', 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $full = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/9/satilik')
            ->assertOk()
            ->json('data.gallery');
        $this->assertCount(60, $full);
        $this->assertSame('/api/v1/catalogue/media/portfolios/9/0', $full[0]['original']);
        $this->assertSame('/api/v1/catalogue/media/portfolios/9/59', $full[59]['original']);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/10/satilik')
            ->assertOk()
            ->assertJsonCount(3, 'data.gallery');

        $this->get('/api/v1/catalogue/media/portfolios/9/59')
            ->assertOk()
            ->assertHeader('content-type', 'image/jpeg');
        $this->get('/api/v1/catalogue/media/portfolios/9/60')->assertNotFound();
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

    public function test_the_consultant_list_is_one_card_per_person_and_labels_an_empty_result(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants*' => Http::response([
                'data' => [
                    ['type' => 'consultant', 'id' => '4-1', 'user_id' => 4, 'name' => 'Adnan Bulu', 'role' => 'agent', 'office_id' => 1, 'office_name' => 'A', 'is_default' => true],
                    ['type' => 'consultant', 'id' => '4-2', 'user_id' => 4, 'name' => 'Adnan Bulu', 'role' => 'agent', 'office_id' => 2, 'office_name' => 'B'],
                    ['type' => 'consultant', 'id' => '8-2', 'user_id' => 8, 'name' => 'Cevdet Kömürcüoğlu', 'role' => 'agent', 'office_id' => 2, 'office_name' => 'B'],
                    ['type' => 'office', 'id' => 'office-9', 'office_id' => 9, 'name' => 'Çapa', 'has_image' => true, 'address' => 'İstanbul / Fatih', 'badges' => [['title' => 'Ayın Ofisi', 'period' => '2026-09']]],
                ],
                'offices' => [
                    ['id' => '9', 'name' => 'Çapa'],
                    ['id' => '2', 'name' => 'Zirve'],
                ],
            ]),
        ]);

        $page = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&q='.rawurlencode('Cevdet Kömürcüoğlu'))
            ->assertOk();
        $items = $page->json('data.items');
        $this->assertCount(1, $items);
        $this->assertSame(1, $page->json('data.pagination.total'));
        $this->assertSame('Cevdet Kömürcüoğlu', $items[0]['name']);
        $this->assertSame('consultant', $items[0]['variant']);
        $this->assertSame('1 Danışman Bulundu', $page->json('data.foundLabel'));

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 3)
            ->assertJsonCount(3, 'data.items')
            ->assertJsonPath('data.foundLabel', '3 Danışman Bulundu')
            ->assertJsonPath('data.items.2.variant', 'office')
            ->assertJsonPath('data.items.2.name', 'Çapa')
            ->assertJsonPath('data.items.2.role', 'Gayrimenkul Danışmanı')
            ->assertJsonPath('data.items.2.image', '/api/v1/catalogue/media/offices/9')
            ->assertJsonPath('data.items.2.urlPath', '/tr/ofisler/9/capa')
            ->assertJsonPath('data.items.2.badges.0.title', 'Ayın Ofisi')
            ->assertJsonPath('data.filter.offices.0.name', 'Çapa');

        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants*' => Http::response(['data' => []]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&q=yok')
            ->assertOk()
            ->assertJsonPath('data.foundLabel', '0 Danışman Bulundu')
            ->assertJsonPath('data.pagination.total', 0)
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.hasResults', false);
    }

    public function test_office_cards_share_the_consultant_list_order_and_counter(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants*' => Http::response(['data' => [
                ['type' => 'consultant', 'id' => '1-1', 'user_id' => 1, 'name' => 'Zeki Ay', 'role' => 'agent', 'office_id' => 1, 'office_name' => 'A'],
                ['type' => 'office', 'id' => 'office-4', 'office_id' => 4, 'name' => 'Burak', 'has_image' => true],
                ['type' => 'consultant', 'id' => '2-1', 'user_id' => 2, 'name' => 'Ada Yılmaz', 'role' => 'agent', 'office_id' => 1, 'office_name' => 'A'],
                ['type' => 'office', 'id' => 'office-9', 'office_id' => 9, 'name' => 'Çapa', 'has_image' => true],
                ['type' => 'consultant', 'id' => '2-2', 'user_id' => 2, 'name' => 'Ada Yılmaz', 'role' => 'agent', 'office_id' => 4, 'office_name' => 'Burak'],
            ]]),
        ]);

        $page = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')->assertOk();
        $items = $page->json('data.items');
        $this->assertSame(['Ada Yılmaz', 'Burak', 'Çapa', 'Zeki Ay'], array_column($items, 'name'));
        $this->assertSame(['consultant', 'office', 'office', 'consultant'], array_column($items, 'variant'));
        $this->assertSame(4, $page->json('data.pagination.total'));
        $this->assertSame('4 Danışman Bulundu', $page->json('data.foundLabel'));
        $this->assertSame('Gayrimenkul Danışmanı', $items[1]['role']);
        $this->assertSame('/api/v1/catalogue/media/offices/4', $items[1]['image']);
        $this->assertSame('/tr/ofisler/4/burak', $items[1]['urlPath']);
        $this->assertSame('/tr/ofisler/9/capa', $items[2]['urlPath']);

        $this->getJson('/api/v1/corporate?locale=en&path=/en/agents')
            ->assertOk()
            ->assertJsonPath('data.foundLabel', '4 Consultant Found')
            ->assertJsonPath('data.items.1.role', 'Real Estate Consultant')
            ->assertJsonPath('data.items.1.urlPath', '/en/offices/4/burak')
            ->assertJsonPath('data.items.2.urlPath', '/en/offices/9/capa');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/immobilienmakleren')
            ->assertOk()
            ->assertJsonPath('data.foundLabel', '4 Berater gefunden')
            ->assertJsonPath('data.items.1.role', 'Immobilienberater')
            ->assertJsonPath('data.items.1.urlPath', '/de/anbieteren/4/burak');
    }

    public function test_watermark_flags_pass_through_listing_cards_and_gallery(): void
    {
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios' => Http::response(['data' => [[
                'id' => 9,
                'title' => 'Filigranlı',
                'type' => 'sale',
                'has_watermarked_media' => true,
                'image_count' => 1,
            ], [
                'id' => 10,
                'title' => 'Temiz',
                'type' => 'sale',
            ]]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/9' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 9,
                    'title' => 'Filigranlı',
                    'type' => 'sale',
                    'has_watermarked_media' => 1,
                    'image_count' => 2,
                    'images' => [
                        ['is_watermarked' => true],
                        ['is_watermarked' => 'false'],
                    ],
                    'media' => [
                        ['index' => 1, 'is_watermarked' => true],
                    ],
                ],
                'office' => [],
                'agent' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/portfolios/10' => Http::response(['data' => [
                'portfolio' => [
                    'id' => 10,
                    'title' => 'Temiz',
                    'type' => 'sale',
                    'image_count' => 1,
                ],
                'office' => [],
                'agent' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.items.0.has_watermarked_media', true)
            ->assertJsonPath('data.items.1.has_watermarked_media', false);

        $marked = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/9/satilik')
            ->assertOk()
            ->assertJsonPath('data.has_watermarked_media', true)
            ->json('data.gallery');
        $this->assertTrue($marked[0]['is_watermarked']);
        $this->assertTrue($marked[1]['is_watermarked']);

        $clean = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy/10/satilik')
            ->assertOk()
            ->assertJsonPath('data.has_watermarked_media', false)
            ->json('data.gallery');
        $this->assertFalse($clean[0]['is_watermarked']);
    }

    public function test_consultant_rank_badges_are_returned_on_the_list_and_the_detail(): void
    {
        $badges = [
            ['year' => 2024, 'category' => 'islem', 'label' => 'İşlem Birincisi', 'rank' => 1, 'imageUrl' => 'https://cdnc.re-os.com/club/old.png'],
            ['year' => 2025, 'category' => 'club', 'label' => 'Ticari Kulüp', 'rank' => 4, 'imageUrl' => 'https://cdnc.re-os.com/club/club.png'],
            ['year' => 2025, 'category' => 'ciro', 'label' => 'Ciro Yedincisi', 'rank' => 7, 'imageUrl' => 'https://cdnc.re-os.com/club/ciro.png'],
            ['year' => null, 'category' => 'nope', 'label' => 'Yok', 'rank' => 1, 'imageUrl' => 'https://cdnc.re-os.com/club/nope.png'],
            ['year' => 2025, 'category' => 'ciro', 'label' => '', 'rank' => 2, 'imageUrl' => 'https://cdnc.re-os.com/club/empty.png'],
        ];
        $consultant = [
            'id' => 9,
            'name' => 'Ada Yılmaz',
            'role' => 'agent',
            'phone' => '05550000001',
            'email' => 'ada@example.com',
            'office_id' => 7,
            'office_name' => 'A Plus',
            'rankBadges' => $badges,
        ];
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => [$consultant]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants/9' => Http::response(['data' => [
                'consultant' => $consultant,
                'portfolios' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.items.0.rankBadges.0.label', 'Ciro Yedincisi')
            ->assertJsonPath('data.items.0.rankBadges.0.year', 2025)
            ->assertJsonPath('data.items.0.rankBadges.0.category', 'ciro')
            ->assertJsonPath('data.items.0.rankBadges.1.category', 'club')
            ->assertJsonPath('data.items.0.rankBadges.1.rank', null)
            ->assertJsonPath('data.items.0.rankBadges.2.label', 'İşlem Birincisi')
            ->assertJsonPath('data.items.0.rankBadges.2.year', 2024)
            ->assertJsonCount(3, 'data.items.0.rankBadges');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar/9/ada-yilmaz')
            ->assertOk()
            ->assertJsonPath('data.rankBadges.0.imageUrl', 'https://cdnc.re-os.com/club/ciro.png')
            ->assertJsonPath('data.rankBadges.1.label', 'Ticari Kulüp')
            ->assertJsonCount(3, 'data.rankBadges');
    }

    public function test_consultant_list_keeps_rank_badges_across_office_memberships(): void
    {
        $badges = [
            ['year' => 2024, 'category' => 'islem', 'label' => 'İşlem Birincisi', 'rank' => 1, 'imageUrl' => 'https://cdnc.re-os.com/club/islem.png'],
            ['year' => 2025, 'category' => 'club', 'label' => 'Ticari Kulüp', 'rank' => 4, 'imageUrl' => 'https://cdnc.re-os.com/club/club.png'],
            ['year' => 2025, 'category' => 'ciro', 'label' => 'Ciro Yedincisi', 'rank' => 7, 'imageUrl' => 'https://cdnc.re-os.com/club/ciro.png'],
        ];
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants*' => Http::response(['data' => [
                [
                    'type' => 'consultant',
                    'id' => '4-1',
                    'user_id' => 4,
                    'name' => 'Ada Yılmaz',
                    'role' => 'agent',
                    'office_id' => 1,
                    'office_name' => 'A Plus',
                    'rankBadges' => [],
                ],
                [
                    'type' => 'consultant',
                    'id' => '4-2',
                    'user_id' => 4,
                    'name' => 'Ada Yılmaz',
                    'role' => 'agent',
                    'office_id' => 2,
                    'office_name' => 'Burak',
                    'is_default' => true,
                    'rankBadges' => $badges,
                ],
                [
                    'type' => 'consultant',
                    'id' => '8-2',
                    'user_id' => 8,
                    'name' => 'Cevdet Kömürcüoğlu',
                    'role' => 'agent',
                    'office_id' => 2,
                    'office_name' => 'Burak',
                ],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.name', 'Ada Yılmaz')
            ->assertJsonPath('data.items.0.variant', 'consultant')
            ->assertJsonPath('data.items.0.rankBadges.0.year', 2025)
            ->assertJsonPath('data.items.0.rankBadges.0.category', 'ciro')
            ->assertJsonPath('data.items.0.rankBadges.0.label', 'Ciro Yedincisi')
            ->assertJsonPath('data.items.0.rankBadges.0.rank', 7)
            ->assertJsonPath('data.items.0.rankBadges.0.imageUrl', 'https://cdnc.re-os.com/club/ciro.png')
            ->assertJsonPath('data.items.0.rankBadges.1.year', 2025)
            ->assertJsonPath('data.items.0.rankBadges.1.category', 'club')
            ->assertJsonPath('data.items.0.rankBadges.1.label', 'Ticari Kulüp')
            ->assertJsonPath('data.items.0.rankBadges.1.rank', null)
            ->assertJsonPath('data.items.0.rankBadges.1.imageUrl', 'https://cdnc.re-os.com/club/club.png')
            ->assertJsonPath('data.items.0.rankBadges.2.year', 2024)
            ->assertJsonPath('data.items.0.rankBadges.2.category', 'islem')
            ->assertJsonPath('data.items.0.rankBadges.2.label', 'İşlem Birincisi')
            ->assertJsonPath('data.items.0.rankBadges.2.rank', 1)
            ->assertJsonPath('data.items.0.rankBadges.2.imageUrl', 'https://cdnc.re-os.com/club/islem.png')
            ->assertJsonCount(3, 'data.items.0.rankBadges')
            ->assertJsonPath('data.items.1.name', 'Cevdet Kömürcüoğlu')
            ->assertJsonCount(0, 'data.items.1.rankBadges');
    }

    public function test_office_rank_badges_are_returned_on_the_list_and_the_detail(): void
    {
        $badges = [
            ['year' => 2025, 'category' => 'ciro', 'label' => 'Ciro 13', 'rank' => 13, 'imageUrl' => 'https://cdnc.re-os.com/club/office-ciro.png'],
            ['year' => 2024, 'category' => 'islem', 'label' => 'İşlem Birincisi', 'rank' => 1, 'imageUrl' => 'https://cdnc.re-os.com/club/office-islem.png'],
        ];
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                ['id' => 16559, 'name' => 'A Plus', 'phone' => '2325033500', 'address' => 'İzmir / Konak', 'rankBadges' => $badges],
                ['id' => 2, 'name' => 'Bos Ofis', 'phone' => '2320000000', 'address' => 'İzmir / Bornova'],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/16559' => Http::response(['data' => [
                'office' => ['id' => 16559, 'name' => 'A Plus', 'phone' => '2325033500', 'address' => 'İzmir / Konak', 'rankBadges' => $badges],
                'consultants' => [],
                'portfolios' => [],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/consultants' => Http::response(['data' => [
                ['type' => 'office', 'id' => 'office-16559', 'office_id' => 16559, 'name' => 'A Plus', 'has_image' => true, 'rankBadges' => $badges],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'A Plus')
            ->assertJsonPath('data.items.0.variant', 'office')
            ->assertJsonPath('data.items.0.rankBadges.0.label', 'Ciro 13')
            ->assertJsonPath('data.items.0.rankBadges.0.rank', 13)
            ->assertJsonPath('data.items.0.rankBadges.0.category', 'ciro')
            ->assertJsonPath('data.items.0.rankBadges.1.category', 'islem')
            ->assertJsonCount(2, 'data.items.0.rankBadges')
            ->assertJsonPath('data.items.1.name', 'Bos Ofis')
            ->assertJsonCount(0, 'data.items.1.rankBadges');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/16559/a-plus')
            ->assertOk()
            ->assertJsonPath('data.rankBadges.0.imageUrl', 'https://cdnc.re-os.com/club/office-ciro.png')
            ->assertJsonPath('data.rankBadges.0.label', 'Ciro 13')
            ->assertJsonCount(2, 'data.rankBadges');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.items.0.variant', 'office')
            ->assertJsonPath('data.items.0.rankBadges.0.rank', 13)
            ->assertJsonCount(2, 'data.items.0.rankBadges');
    }

    public function test_office_rank_badges_read_the_reonix_table_field(): void
    {
        $badges = [
            ['year' => 2025, 'category' => 'ciro', 'label' => 'Ciro 13', 'rank' => 13, 'image_url' => 'https://cdnc.re-os.com/club/office-ciro.png'],
        ];
        Http::fake([
            'https://portal.test/api/v1/integrations/portal/catalogue/offices' => Http::response(['data' => [
                ['id' => 16559, 'name' => 'A Plus', 'phone' => '2325033500', 'address' => 'İzmir / Konak', 'rankBadges' => [], 'office_rank_badges' => $badges],
            ]]),
            'https://portal.test/api/v1/integrations/portal/catalogue/offices/16559' => Http::response(['data' => [
                'office' => ['id' => 16559, 'name' => 'A Plus', 'phone' => '2325033500', 'address' => 'İzmir / Konak', 'rankBadges' => []],
                'office_rank_badges' => $badges,
                'consultants' => [],
                'portfolios' => [],
            ]]),
        ]);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.items.0.rankBadges.0.label', 'Ciro 13')
            ->assertJsonPath('data.items.0.rankBadges.0.imageUrl', 'https://cdnc.re-os.com/club/office-ciro.png')
            ->assertJsonPath('data.items.0.rankBadges.0.rank', 13);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/16559/a-plus')
            ->assertOk()
            ->assertJsonPath('data.rankBadges.0.label', 'Ciro 13')
            ->assertJsonCount(1, 'data.rankBadges');
    }
}
