<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsCorporateFixtures;
use Tests\TestCase;

class CorporateApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsCorporateFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCorporateFixtures();
    }

    public function test_it_returns_a_cms_page_for_the_about_path(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/sayfa/hakkimizda')
            ->assertOk()
            ->assertJsonPath('data.kind', 'cms-page')
            ->assertJsonPath('data.key', 'about')
            ->assertJsonPath('data.heading', 'Hakkımızda')
            ->assertJsonPath('data.alternates.en', '/en/page/about-us');
    }

    public function test_it_lists_news_and_resolves_english_pager_alias(): void
    {
        $this->getJson('/api/v1/corporate?locale=en&path=/en/haberler')
            ->assertOk()
            ->assertJsonPath('data.kind', 'article-list')
            ->assertJsonPath('data.type', 'news')
            ->assertJsonPath('data.items.0.externalId', 1779)
            ->assertJsonPath('data.items.0.title', 'Begonvilla News');
    }

    public function test_it_returns_every_field_of_an_article_detail(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/haberler/1779/begonvilla')
            ->assertOk()
            ->assertJsonPath('data.kind', 'article-detail')
            ->assertJsonPath('data.layout', 'wide')
            ->assertJsonPath('data.title', 'Begonvilla Haberi')
            ->assertJsonPath('data.bodyHtml', '<p>Villakent Begonvilla.</p>');
    }

    public function test_it_lists_articles_in_seed_position_not_external_id_order(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/duyurular')
            ->assertOk()
            ->assertJsonPath('data.kind', 'article-list')
            ->assertJsonPath('data.type', 'announcement')
            ->assertJsonPath('data.items.0.externalId', 1523)
            ->assertJsonPath('data.items.0.title', 'Startkey Çözüm')
            ->assertJsonPath('data.items.1.externalId', 1268)
            ->assertJsonPath('data.items.1.title', 'Startkey Melis Gayrimenkul');

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/bloglar')
            ->assertOk()
            ->assertJsonPath('data.items.0.externalId', 1245)
            ->assertJsonPath('data.sidebar.popularHeading', 'Popüler Bloglar')
            ->assertJsonPath('data.sidebar.popular.0.title', 'Bizden Bize 38')
            ->assertJsonPath('data.sidebar.popular.0.image', '/media/content/article-85x85.jpg')
            ->assertJsonCount(2, 'data.sidebar.popular');
    }

    public function test_it_paginates_blogs_and_filters_search(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/bloglar&pageIndex=2')
            ->assertOk()
            ->assertJsonPath('data.kind', 'article-list')
            ->assertJsonPath('data.layout', 'two-col-sidebar')
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.pagination.totalPages', 2)
            ->assertJsonPath('data.items.0.externalId', 1242);

        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/bloglar&searchText=Otuz%20sekizinci')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.externalId', 1245);
    }

    public function test_it_returns_people_cards_and_a_person_detail(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/yonetim-kadrosu')
            ->assertOk()
            ->assertJsonPath('data.kind', 'people-list')
            ->assertJsonPath('data.people.0.name', 'Halil Altunsu')
            ->assertJsonPath('data.people.0.role', 'Yönetim Kurulu Başkanı');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/people-detail/144/halil-altunsu')
            ->assertOk()
            ->assertJsonPath('data.kind', 'people-detail')
            ->assertJsonPath('data.bioHeading', 'Biography')
            ->assertJsonPath('data.alternates.tr', '/tr/kadro-detay/144/halil-altunsu');
    }

    public function test_it_returns_champion_groups_for_a_new_entry_template(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/sampiyonlar')
            ->assertOk()
            ->assertJsonPath('data.kind', 'champions')
            ->assertJsonPath('data.groups.0.title', 'Ağustos Ayı Şampiyonları')
            ->assertJsonPath('data.groups.0.photos.0', '/media/content/champion.jpg');
    }

    public function test_it_returns_the_equivalent_url_for_a_language_switch(): void
    {
        $this->getJson('/api/v1/corporate/alternate?locale=en&path=/tr/haberler/1779/begonvilla')
            ->assertOk()
            ->assertJsonPath('data.urlPath', '/en/news/1779/begonvilla');
    }

    public function test_it_returns_not_found_for_an_unknown_path(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/olmayan-sayfa')
            ->assertStatus(404);
    }

    public function test_it_rejects_an_unsupported_locale(): void
    {
        $this->getJson('/api/v1/corporate?locale=fr&path=/tr/haberler')
            ->assertStatus(400);
    }
}
