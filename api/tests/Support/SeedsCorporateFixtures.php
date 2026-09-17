<?php

namespace Tests\Support;

use App\Models\CmsArticle;
use App\Models\CmsChampionGroup;
use App\Models\CmsListPage;
use App\Models\CmsPage;
use App\Models\CmsPerson;

trait SeedsCorporateFixtures
{
    protected function seedCorporateFixtures(): void
    {
        $about = CmsPage::query()->create(['key' => 'about', 'published' => true, 'position' => 0]);
        $about->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/sayfa/hakkimizda',
                'heading' => 'Hakkımızda',
                'body_html' => '<section class="about-wrap style3 pt-100"><p>Startkey hakkında.</p></section>',
                'breadcrumb' => [
                    'heading' => 'Hakkımızda',
                    'trail' => [
                        ['href' => '/', 'label' => 'Anasayfa'],
                        ['href' => null, 'label' => 'Hakkımızda'],
                    ],
                ],
                'meta' => ['title' => 'Hakkımızda | Startkey'],
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/page/about-us',
                'heading' => 'About Us',
                'body_html' => '<section class="about-wrap style3 pt-100"><p>About Startkey.</p></section>',
                'breadcrumb' => ['heading' => 'About Us', 'trail' => []],
                'meta' => ['title' => 'About Us | Startkey'],
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/page/uber-uns',
                'heading' => 'Über uns',
                'body_html' => '<section class="about-wrap style3 pt-100"><p>Über Startkey.</p></section>',
                'breadcrumb' => ['heading' => 'Über uns', 'trail' => []],
                'meta' => ['title' => 'Über uns | Startkey'],
            ],
        ]);

        $this->article('news', 1779, 0, [
            'tr' => [
                'url_path' => '/tr/haberler/1779/begonvilla',
                'title' => 'Begonvilla Haberi',
                'date_label' => '26.7.2024',
                'category' => 'Basında Biz',
                'body_html' => '<p>Villakent Begonvilla.</p>',
                'share_label' => 'Paylaş:',
            ],
            'en' => [
                'url_path' => '/en/news/1779/begonvilla',
                'title' => 'Begonvilla News',
                'date_label' => '26.7.2024',
                'category' => 'News',
                'body_html' => '<p>Villakent Begonvilla.</p>',
                'share_label' => 'Share:',
            ],
            'de' => [
                'url_path' => '/de/nachricht/1779/begonvilla',
                'title' => 'Begonvilla Nachricht',
                'date_label' => '26.7.2024',
                'category' => 'Nachricht',
                'body_html' => '<p>Villakent Begonvilla.</p>',
                'share_label' => 'Teilen:',
            ],
        ]);

        $this->article('blog', 1245, 0, [
            'tr' => [
                'url_path' => '/tr/bloglar/1245/sayi-38',
                'title' => 'Bizden Bize 38',
                'date_label' => '1.9.2026',
                'category' => 'Genel',
                'body_html' => '<p>Otuz sekizinci sayı.</p>',
                'share_label' => 'Paylaş:',
            ],
            'en' => [
                'url_path' => '/en/blogs/1245/issue-38',
                'title' => 'From Us 38',
                'date_label' => '1.9.2026',
                'category' => 'General',
                'body_html' => '<p>Issue thirty eight.</p>',
                'share_label' => 'Share:',
            ],
            'de' => [
                'url_path' => '/de/blogs/1245/ausgabe-38',
                'title' => 'Von Uns 38',
                'date_label' => '1.9.2026',
                'category' => 'Allgemein',
                'body_html' => '<p>Ausgabe achtunddreissig.</p>',
                'share_label' => 'Teilen:',
            ],
        ]);

        $this->article('blog', 1242, 1, [
            'tr' => [
                'url_path' => '/tr/bloglar/1242/sayi-37',
                'title' => 'Bizden Bize 37',
                'date_label' => '1.8.2026',
                'category' => 'Genel',
                'body_html' => '<p>Otuz yedinci sayı.</p>',
                'share_label' => 'Paylaş:',
            ],
            'en' => [
                'url_path' => '/en/blogs/1242/issue-37',
                'title' => 'From Us 37',
                'date_label' => '1.8.2026',
                'category' => 'General',
                'body_html' => '<p>Issue thirty seven.</p>',
                'share_label' => 'Share:',
            ],
            'de' => [
                'url_path' => '/de/blogs/1242/ausgabe-37',
                'title' => 'Von Uns 37',
                'date_label' => '1.8.2026',
                'category' => 'Allgemein',
                'body_html' => '<p>Ausgabe siebenunddreissig.</p>',
                'share_label' => 'Teilen:',
            ],
        ]);

        $this->article('announcement', 1523, 0, [
            'tr' => [
                'url_path' => '/tr/duyuru-detay/1523/startkey-cozum',
                'title' => 'Startkey Çözüm',
                'date_label' => '1.9.2026',
                'category' => '',
                'body_html' => '<p>Çözüm duyurusu.</p>',
                'share_label' => 'Paylaş:',
            ],
            'en' => [
                'url_path' => '/en/announcements-detail/1523/startkey-solution',
                'title' => 'Startkey Solution',
                'date_label' => '1.9.2026',
                'category' => '',
                'body_html' => '<p>Solution announcement.</p>',
                'share_label' => 'Share:',
            ],
            'de' => [
                'url_path' => '/de/ankundigungen-detail/1523/startkey-loesung',
                'title' => 'Startkey Loesung',
                'date_label' => '1.9.2026',
                'category' => '',
                'body_html' => '<p>Loesung Ankuendigung.</p>',
                'share_label' => 'Teilen:',
            ],
        ]);

        $this->article('announcement', 1268, 1, [
            'tr' => [
                'url_path' => '/tr/duyuru-detay/1268/startkey-melis-gayrimenkul',
                'title' => 'Startkey Melis Gayrimenkul',
                'date_label' => '14.3.2024',
                'category' => '',
                'body_html' => '<p>Melis duyurusu.</p>',
                'share_label' => 'Paylaş:',
            ],
            'en' => [
                'url_path' => '/en/announcements-detail/1268/startkey-melis',
                'title' => 'Startkey Melis',
                'date_label' => '14.3.2024',
                'category' => '',
                'body_html' => '<p>Melis announcement.</p>',
                'share_label' => 'Share:',
            ],
            'de' => [
                'url_path' => '/de/ankundigungen-detail/1268/startkey-melis',
                'title' => 'Startkey Melis',
                'date_label' => '14.3.2024',
                'category' => '',
                'body_html' => '<p>Melis Ankuendigung.</p>',
                'share_label' => 'Teilen:',
            ],
        ]);

        $this->listPage('news', 'tr', '/tr/haberler', '/tr/haberler', 9, 'Devamını Oku', 'Basında Biz');
        $this->listPage('news', 'en', '/en/news', '/en/haberler', 9, 'Read More', 'News');
        $this->listPage('news', 'de', '/de/nachricht', '/de/haberler', 9, 'Weiterlesen', 'Nachricht');
        $this->listPage('announcement', 'tr', '/tr/duyurular', '/tr/duyurular', 9, 'Devamını Oku', 'Duyurular');
        $this->listPage('announcement', 'en', '/en/announcements', '/en/duyurular', 9, 'Read More', 'Announcements');
        $this->listPage('announcement', 'de', '/de/ankundigungen', '/de/duyurular', 9, 'Weiterlesen', 'Ankuendigungen');
        $this->listPage('blog', 'tr', '/tr/bloglar', '/tr/bloglar', 1, 'Devamını Oku', 'Blog', [
            'searchPlaceholder' => 'Ara',
            'popularHeading' => 'Popüler Bloglar',
            'popular' => [
                [
                    'urlPath' => '/tr/bloglar/1245/sayi-38',
                    'title' => 'Bizden Bize 38',
                    'dateLabel' => '1.9.2026',
                    'image' => '/media/content/article-85x85.jpg',
                    'imageWebp' => '/media/content/article-85x85.webp',
                ],
                [
                    'urlPath' => '/tr/bloglar/1242/sayi-37',
                    'title' => 'Bizden Bize 37',
                    'dateLabel' => '1.8.2026',
                    'image' => '/media/content/article-85x85.jpg',
                    'imageWebp' => '/media/content/article-85x85.webp',
                ],
            ],
        ]);
        $this->listPage('blog', 'en', '/en/blogs', '/en/bloglar', 1, 'Read More', 'Blog', [
            'searchPlaceholder' => 'Search',
            'popularHeading' => 'Popular Blogs',
        ]);
        $this->listPage('blog', 'de', '/de/blogs', '/de/bloglar', 1, 'Weiterlesen', 'Blog', [
            'searchPlaceholder' => 'Suchen',
            'popularHeading' => 'Beliebte Blogs',
        ]);

        $person = CmsPerson::query()->create([
            'external_id' => 144,
            'image' => '/media/content/person-414.jpg',
            'image_webp' => '/media/content/person-414.webp',
            'detail_image' => '/media/content/person-574.jpg',
            'detail_image_webp' => '/media/content/person-574.webp',
            'email' => 'halil.altunsu@startkey.com.tr',
            'phone_href' => 'tel:902323305330',
            'social' => [['href' => 'https://www.facebook.com/halil.altunsu', 'network' => 'facebook']],
            'published' => true,
            'position' => 0,
        ]);
        $person->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/kadro-detay/144/halil-altunsu',
                'name' => 'Halil Altunsu',
                'role' => 'Yönetim Kurulu Başkanı',
                'phone_label' => '+90 (232) 330-5330',
                'email_label' => 'Email:',
                'phone_field_label' => 'Telefon:',
                'bio_heading' => 'Biyografisi',
                'bio_html' => '<p>1966 İzmir doğumluyum.</p>',
                'breadcrumb' => ['heading' => 'Halil Altunsu', 'trail' => []],
                'meta' => ['title' => 'Halil Altunsu'],
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/people-detail/144/halil-altunsu',
                'name' => 'Halil Altunsu',
                'role' => 'Chairman of the Board',
                'phone_label' => '+90 (232) 330-5330',
                'email_label' => 'Email:',
                'phone_field_label' => 'Phone:',
                'bio_heading' => 'Biography',
                'bio_html' => '<p>I was born in Izmir in 1966.</p>',
                'breadcrumb' => ['heading' => 'Halil Altunsu', 'trail' => []],
                'meta' => ['title' => 'Halil Altunsu'],
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/people-detail/144/halil-altunsu',
                'name' => 'Halil Altunsu',
                'role' => 'Vorstandsvorsitzender',
                'phone_label' => '+90 (232) 330-5330',
                'email_label' => 'Email:',
                'phone_field_label' => 'Telefon:',
                'bio_heading' => 'Biografie',
                'bio_html' => '<p>Ich wurde 1966 in Izmir geboren.</p>',
                'breadcrumb' => ['heading' => 'Halil Altunsu', 'trail' => []],
                'meta' => ['title' => 'Halil Altunsu'],
            ],
        ]);
        $this->listPage('people', 'tr', '/tr/yonetim-kadrosu', '/tr/yonetim-kadrosu', 13, '', 'Yönetim');
        $this->listPage('people', 'en', '/en/people', '/en/people', 13, '', 'Management');
        $this->listPage('people', 'de', '/de/people', '/de/people', 13, '', 'Management');

        $group = CmsChampionGroup::query()->create(['published' => true, 'position' => 0]);
        $group->translations()->createMany([
            ['locale' => 'tr', 'kicker' => 'Startkey Türkiye', 'title' => 'Ağustos Ayı Şampiyonları'],
            ['locale' => 'en', 'kicker' => 'Startkey Turkiye', 'title' => 'August Champions'],
            ['locale' => 'de', 'kicker' => 'Startkey Turkiye', 'title' => 'August-Champions'],
        ]);
        $group->photos()->create(['image' => '/media/content/champion.jpg', 'position' => 0]);
        $this->listPage('champions', 'tr', '/tr/sampiyonlar', '/tr/sampiyonlar', 12, '', 'Şampiyonlarımız');
        $this->listPage('champions', 'en', '/en/champions', '/en/champions', 12, '', 'Our Champions');
        $this->listPage('champions', 'de', '/de/champions', '/de/champions', 12, '', 'Unsere Champions');
    }

    private function article(string $type, int $externalId, int $position, array $translations): void
    {
        $article = CmsArticle::query()->create([
            'type' => $type,
            'external_id' => $externalId,
            'published' => true,
            'position' => $position,
        ]);

        foreach ($translations as $locale => $translation) {
            $article->translations()->create([
                'locale' => $locale,
                'url_path' => $translation['url_path'],
                'title' => $translation['title'],
                'date_label' => $translation['date_label'],
                'category' => $translation['category'],
                'body_html' => $translation['body_html'],
                'image' => '/media/content/article.jpg',
                'image_webp' => '/media/content/article.webp',
                'list_image' => '/media/content/article-416x500.jpg',
                'list_image_webp' => '/media/content/article-416x500.webp',
                'list_width' => 416,
                'list_height' => 500,
                'share_label' => $translation['share_label'],
                'breadcrumb' => ['heading' => $translation['title'], 'trail' => []],
                'meta' => ['title' => $translation['title']],
            ]);
        }
    }

    private function listPage(
        string $type,
        string $locale,
        string $urlPath,
        string $pagerBase,
        int $perPage,
        string $continueLabel,
        string $heading,
        ?array $sidebar = null,
    ): void {
        CmsListPage::query()->create([
            'type' => $type,
            'locale' => $locale,
            'url_path' => $urlPath,
            'pager_base' => $pagerBase,
            'per_page' => $perPage,
            'continue_label' => $continueLabel,
            'heading' => $heading,
            'breadcrumb' => ['heading' => $heading, 'trail' => []],
            'meta' => ['title' => $heading],
            'sidebar' => $sidebar,
        ]);
    }
}
