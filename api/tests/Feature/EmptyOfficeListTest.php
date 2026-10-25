<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmptyOfficeListTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_known_office_list_without_offices_is_a_page(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/ofisler')
            ->assertOk()
            ->assertJsonPath('data.kind', 'office-list')
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş ofis yok.')
            ->assertJsonPath('data.items', []);

        $this->getJson('/api/v1/corporate?locale=en&path=/en/offices')
            ->assertOk()
            ->assertJsonPath('data.emptyLabel', 'No offices have been added yet.');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.kind', 'listing-list')
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş portföy yok.');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danismanlar')
            ->assertOk()
            ->assertJsonPath('data.kind', 'consultant-list')
            ->assertJsonPath('data.hasResults', false)
            ->assertJsonPath('data.emptyLabel', 'Henüz eklenmiş danışman yok.');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/boyle-bir-sayfa-yok')
            ->assertNotFound();
    }

    public function test_an_empty_portfolio_list_keeps_the_reference_titles(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/portfoy')
            ->assertOk()
            ->assertJsonPath('data.heading', 'Portföylerimiz')
            ->assertJsonPath('data.meta.title', 'Startkey Türkiye | Portföylerimiz');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/property')
            ->assertOk()
            ->assertJsonPath('data.heading', 'Our Properties')
            ->assertJsonPath('data.meta.title', '| Our Properties');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/immobilien')
            ->assertOk()
            ->assertJsonPath('data.meta.title', '| Unsere Portfolios');
    }

    public function test_the_consultant_form_keeps_the_reference_titles(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/consultant-form')
            ->assertOk()
            ->assertJsonPath('data.meta.title', '| Consultant Application Form');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/consultant-form')
            ->assertOk()
            ->assertJsonPath('data.meta.title', '| Beraterantragsformular');
    }
}
