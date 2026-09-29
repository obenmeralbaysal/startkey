<?php

namespace Tests\Feature;

use App\Models\FranchiseApplication;
use App\Models\LookupItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Support\SeedsFooterFixtures;
use Tests\TestCase;

class FooterApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsFooterFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->seedFooterFixtures();
    }

    public function test_it_returns_the_franchise_form_page(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/franchise-basvuru')
            ->assertOk()
            ->assertJsonPath('data.kind', 'franchise')
            ->assertJsonPath('data.formHeading', 'Franchise Başvurusu')
            ->assertJsonPath('data.submitLabel', 'Başvuruyu Gönder')
            ->assertJsonPath('data.countyBindUrl', '/tr/Lookup/Counties')
            ->assertJsonPath('data.alternates.en', '/en/franchise-form');
    }

    public function test_it_resolves_english_and_german_franchise_aliases(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/franchise-basvuru')
            ->assertOk()
            ->assertJsonPath('data.kind', 'franchise')
            ->assertJsonPath('data.formHeading', 'Franchise Application');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/franchise-basvuru')
            ->assertOk()
            ->assertJsonPath('data.kind', 'franchise')
            ->assertJsonPath('data.formHeading', 'Franchise-Antrag');
    }

    public function test_it_returns_turkish_kvkk_and_not_english(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/sayfa/kvkk')
            ->assertOk()
            ->assertJsonPath('data.kind', 'cms-page')
            ->assertJsonPath('data.key', 'kvkk')
            ->assertJsonPath('data.heading', 'KVKK');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/page/kvkk')
            ->assertNotFound();
    }

    public function test_it_returns_terms_in_three_languages_and_the_sayfa_alias(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/sayfa/hizmet-sozlesmesi')
            ->assertOk()
            ->assertJsonPath('data.kind', 'cms-page')
            ->assertJsonPath('data.key', 'terms')
            ->assertJsonPath('data.heading', 'Hizmet Sözleşmesi');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/page/hizmet-sozlesmesi')
            ->assertOk()
            ->assertJsonPath('data.heading', 'Terms Of Service');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/sayfa/hizmet-sozlesmesi')
            ->assertOk()
            ->assertJsonPath('data.heading', 'Terms Of Service');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/page/hizmet-sozlesmesi')
            ->assertOk()
            ->assertJsonPath('data.heading', 'Dienstleistungs');
    }

    public function test_language_switch_from_kvkk_falls_back_to_the_homepage(): void
    {
        $this->getJson('/api/v1/corporate/alternate?locale=en&path=/tr/sayfa/kvkk')
            ->assertOk()
            ->assertJsonPath('data.urlPath', '/en');
    }

    public function test_it_stores_a_franchise_application(): void
    {
        $this->fakeReonix();
        $this->postJson('/api/v1/franchise/applications', [
            'first_name' => 'Ayşe',
            'last_name' => 'Yılmaz',
            'email' => 'ayse@example.com',
            'phone' => '+90 232 330 5330',
            'city_id' => 35,
            'county_id' => 1,
            'notes' => 'Deneyim',
            'locale' => 'tr',
        ])
            ->assertCreated()
            ->assertJsonPath('data.id', 1);

        $this->assertDatabaseHas('franchise_applications', [
            'email' => 'ayse@example.com',
            'city_id' => 35,
            'county_id' => 1,
            'external_id' => 9,
        ]);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/integrations/portal/applications')
            && $request['district'] === 'Konak');
    }

    public function test_franchise_rejects_invalid_input_in_the_requested_locale(): void
    {
        $this->postJson('/api/v1/franchise/applications', [
            'first_name' => '',
            'last_name' => '',
            'email' => 'not-an-email',
            'phone' => '',
            'city_id' => '',
            'county_id' => '',
            'locale' => 'tr',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'phone', 'city_id', 'county_id'])
            ->assertJsonPath('errors.first_name.0', 'Ad alanı zorunludur.');
    }

    public function test_franchise_throttles_repeated_submissions_from_the_same_client(): void
    {
        $this->fakeReonix();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/franchise/applications', [
                'first_name' => 'Ayşe',
                'last_name' => 'Yılmaz',
                'email' => "user{$i}@example.com",
                'phone' => '+90 232 330 5330',
                'city_id' => 35,
                'county_id' => 1,
                'locale' => 'tr',
            ])->assertCreated();
        }

        $this->postJson('/api/v1/franchise/applications', [
            'first_name' => 'Ayşe',
            'last_name' => 'Yılmaz',
            'email' => 'user5@example.com',
            'phone' => '+90 232 330 5330',
            'city_id' => 35,
            'locale' => 'tr',
        ])->assertStatus(429);

        $this->assertSame(5, FranchiseApplication::query()->count());
    }

    private function fakeReonix(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        $city = LookupItem::query()->create(['group' => 'cities', 'external_id' => '35', 'position' => 1]);
        $city->translations()->create(['locale' => 'tr', 'label' => 'İzmir']);
        $county = LookupItem::query()->create(['group' => 'counties', 'external_id' => '1', 'position' => 1]);
        $county->translations()->create(['locale' => 'tr', 'label' => 'Konak']);
        Http::fake([
            'http://reonix.test/*' => Http::response(['data' => ['id' => 9]], 201),
        ]);
    }
}
