<?php

namespace Tests\Feature;

use App\Models\ConsultantComment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsOfficesFixtures;
use Tests\TestCase;

class OfficesApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsOfficesFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->seedOfficesFixtures();
    }

    public function test_it_lists_offices_and_resolves_pager_alias(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-list')
            ->assertJsonPath('data.items.0.externalId', 16369)
            ->assertJsonPath('data.items.0.urlPath', '/1872')
            ->assertJsonPath('data.foundLabel', '2 Ofis Bulundu')
            ->assertJsonPath('data.alternates.en', '/en/offices');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofislerimiz&pageIndex=1')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-list');
    }

    public function test_it_filters_offices_by_name_and_city(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&SearchText=Zeta')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 18824);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler&SearchText=zzzz-none')
            ->assertOk()
            ->assertJsonPath('data.hasResults', false);
    }

    public function test_it_resolves_office_short_slug_and_id_prefix(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/1872')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-detail')
            ->assertJsonPath('data.externalId', 16369)
            ->assertJsonPath('data.teamGroups.0.members.0.externalId', 32579);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler/18824/other-slug')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-detail')
            ->assertJsonPath('data.name', 'Zeta 2');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/1872')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-detail')
            ->assertJsonPath('data.alternates.de', '/de/1872');
    }

    public function test_it_lists_and_filters_consultants(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.kind', 'consultant-list')
            ->assertJsonPath('data.items.0.externalId', 41507)
            ->assertJsonPath('data.foundLabel', '2 Danışman Bulundu');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danisman-liste')
            ->assertOk()
            ->assertJsonPath('data.kind', 'consultant-list');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&FilterDTO.Firstname=Arşın')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 41507);

        $officeFilter = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&FilterDTO.OfficeId=16369')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 32579)
            ->json('data.filter');
        $this->assertSame('16369', $officeFilter['values']['FilterDTO.OfficeId'] ?? null);
        $this->assertSame('1872', $officeFilter['selectedLabels']['FilterDTO.OfficeId'] ?? null);

        $cityFilter = $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar&FilterDTO.CityId=9')
            ->assertOk()
            ->json('data.filter');
        $this->assertSame('9', $cityFilter['values']['FilterDTO.CityId'] ?? null);
        $this->assertSame('İzmir', $cityFilter['selectedLabels']['FilterDTO.CityId'] ?? null);
    }

    public function test_it_returns_consultant_detail_and_stores_a_comment(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar/41507/other-slug')
            ->assertOk()
            ->assertJsonPath('data.kind', 'consultant-detail')
            ->assertJsonPath('data.name', 'Arşın Yayman')
            ->assertJsonPath('data.officeName', 'Zeta 2')
            ->assertJsonPath('data.ratingLabel', 'Yıldız');

        $this->postJson('/api/v1/consultants/41507/comments', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'rating' => 5,
            'comment' => 'Merhaba',
            'locale' => 'tr',
        ])->assertCreated();

        $this->assertSame(1, ConsultantComment::query()->count());
        $this->assertSame(41507, ConsultantComment::query()->first()?->consultant?->external_id);

        $this->postJson('/api/v1/consultants/1/comments', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'phone' => '5551112233',
            'comment' => 'Merhaba',
            'locale' => 'tr',
        ])->assertNotFound();
    }

    public function test_cities_lookup_is_available(): void
    {
        $this->getJson('/api/v1/lookups/Cities?locale=tr')
            ->assertOk()
            ->assertJsonPath('items.1.id', '9')
            ->assertJsonPath('items.1.text', 'İzmir');
    }
}
