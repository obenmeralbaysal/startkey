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

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/boyle-bir-sayfa-yok')
            ->assertNotFound();
    }
}
