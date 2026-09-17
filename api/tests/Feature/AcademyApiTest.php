<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsAcademyFixtures;
use Tests\TestCase;

class AcademyApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsAcademyFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedAcademyFixtures();
    }

    public function test_it_lists_trainings_in_ongoing_then_completed_sections(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/egitimlerimiz')
            ->assertOk()
            ->assertJsonPath('data.kind', 'training-list')
            ->assertJsonPath('data.sections.0.heading', 'Devam Eden Eğitimler')
            ->assertJsonPath('data.sections.0.items.0.externalId', 385)
            ->assertJsonPath('data.sections.0.items.0.title', 'Unutuyoruz, Neden?')
            ->assertJsonPath('data.sections.1.heading', 'Tamamlanan Eğitimler')
            ->assertJsonPath('data.sections.1.items.0.externalId', 380)
            ->assertJsonPath('data.sections.1.sectionStyle', 'padding-top:0px;');
    }

    public function test_it_resolves_english_and_german_list_aliases(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/egitimlerimiz')
            ->assertOk()
            ->assertJsonPath('data.kind', 'training-list')
            ->assertJsonPath('data.heading', 'Our Educations');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/egitimlerimiz')
            ->assertOk()
            ->assertJsonPath('data.kind', 'training-list')
            ->assertJsonPath('data.heading', 'Unsere Schulungen');
    }

    public function test_english_completed_cards_keep_the_turkish_detail_href(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/our-educations')
            ->assertOk()
            ->assertJsonPath('data.sections.1.items.0.urlPath', '/tr/egitim-detay/380/pikselden-portfoye');
    }

    public function test_it_returns_a_training_detail_with_form_and_related(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/egitim-detay/385/unutuyoruz-neden')
            ->assertOk()
            ->assertJsonPath('data.kind', 'training-detail')
            ->assertJsonPath('data.title', 'Unutuyoruz, Neden?')
            ->assertJsonPath('data.locationValue', 'Startkey Akademi')
            ->assertJsonPath('data.form.submitLabel', 'Başvuruyu Gönder')
            ->assertJsonPath('data.hasApplicationForm', true)
            ->assertJsonPath('data.related.0.externalId', 385)
            ->assertJsonPath('data.alternates.en', '/en/egitim-detay/385/unutuyoruz-neden');
    }

    public function test_completed_trainings_do_not_include_an_application_form(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/egitim-detay/380/pikselden-portfoye')
            ->assertOk()
            ->assertJsonPath('data.kind', 'training-detail')
            ->assertJsonPath('data.group', 'completed')
            ->assertJsonPath('data.hasApplicationForm', false)
            ->assertJsonPath('data.form.submitLabel', '')
            ->assertJsonPath('data.relatedHeading', 'Diğer Aktif Seminerler');
    }

    public function test_it_returns_contact_and_the_turkish_alias_in_english(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/iletisim')
            ->assertOk()
            ->assertJsonPath('data.kind', 'contact')
            ->assertJsonPath('data.formTitle', 'İletişim')
            ->assertJsonPath('data.items.0.heading', 'Adres')
            ->assertJsonPath('data.hours.1.value', 'Kapalı')
            ->assertJsonPath('data.mapSrc', "https://www.google.com/maps/embed?pb=test'nin")
            ->assertJsonPath('data.alternates.en', '/en/contact');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/iletisim')
            ->assertOk()
            ->assertJsonPath('data.kind', 'contact')
            ->assertJsonPath('data.heading', 'Contact');
    }

    public function test_language_switch_from_a_training_goes_to_the_same_record(): void
    {
        $this->getJson('/api/v1/corporate/alternate?locale=en&path=/tr/egitim-detay/385/unutuyoruz-neden')
            ->assertOk()
            ->assertJsonPath('data.urlPath', '/en/egitim-detay/385/unutuyoruz-neden');
    }
}
