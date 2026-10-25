<?php

namespace Tests\Support;

use App\Models\CmsPage;

trait SeedsAcademyFixtures
{
    protected function seedAcademyFixtures(): void
    {
        FakePortalContent::reset();
        FakePortalContent::install();

        FakePortalContent::addTraining(385, 'ongoing', 0, [
            $this->trainingTranslation('tr', '/tr/egitim-detay/385/unutuyoruz-neden', 'Unutuyoruz, Neden?', 'Devam'),
            $this->trainingTranslation('en', '/en/education-detail/385/unutuyoruz-neden', 'Unutuyoruz, Neden?', 'Continuing'),
            $this->trainingTranslation('de', '/de/education-detail/385/unutuyoruz-neden', 'Unutuyoruz, Neden?', 'Fortlaufend'),
        ]);

        FakePortalContent::addTraining(380, 'completed', 1, [
            $this->trainingTranslation(
                'tr',
                '/tr/egitim-detay/380/pikselden-portfoye',
                "Piksel'den Portföy'e",
                '',
                [['icon' => 'flaticon-time', 'text' => 'Eğitim Tarihi 26.8.2026']],
                '/tr/egitim-detay/380/pikselden-portfoye',
                false,
            ),
            $this->trainingTranslation(
                'en',
                '/en/education-detail/380/pikselden-portfoye',
                "Piksel'den Portföy'e",
                '',
                [['icon' => 'flaticon-time', 'text' => 'Training Date 26.8.2026']],
                '/tr/egitim-detay/380/pikselden-portfoye',
                false,
            ),
            $this->trainingTranslation(
                'de',
                '/de/education-detail/380/pikselden-portfoye',
                "Piksel'den Portföy'e",
                '',
                [['icon' => 'flaticon-time', 'text' => 'Schulungsdatum 26.8.2026']],
                '/tr/egitim-detay/380/pikselden-portfoye',
                false,
            ),
        ]);

        foreach (['tr', 'en', 'de'] as $locale) {
            $paths = [
                'tr' => '/tr/egitimlerimiz',
                'en' => '/en/our-educations',
                'de' => '/de/our-educations',
            ];
            $headings = ['tr' => 'Eğitimlerimiz', 'en' => 'Our Educations', 'de' => 'Unsere Schulungen'];
            $ongoingHeadings = ['tr' => 'Devam Eden Eğitimler', 'en' => 'Continuing Trainings', 'de' => 'Fortlaufende Schulungen'];
            $completedHeadings = ['tr' => 'Tamamlanan Eğitimler', 'en' => 'Completed Trainings', 'de' => 'Abgeschlossene Schulungen'];
            FakePortalContent::addList(
                'training',
                $locale,
                $paths[$locale],
                $paths[$locale],
                100,
                'Detay',
                $headings[$locale],
                null,
                [
                    ['group' => 'ongoing', 'heading' => $ongoingHeadings[$locale], 'headingStyle' => 'margin-bottom:20px;', 'sectionStyle' => ''],
                    ['group' => 'completed', 'heading' => $completedHeadings[$locale], 'headingStyle' => 'margin-bottom:30px;', 'sectionStyle' => 'padding-top:0px;'],
                ],
            );
        }

        $contact = CmsPage::query()->create(['key' => 'contact', 'published' => true, 'position' => 20]);
        $contact->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/iletisim',
                'heading' => 'İletişim',
                'body_html' => '',
                'breadcrumb' => ['heading' => 'İletişim', 'trail' => [['href' => '/', 'label' => 'Anasayfa']]],
                'meta' => ['title' => 'İletişim | Startkey'],
                'payload' => [
                    'items' => [
                        ['icon' => 'flaticon-map', 'heading' => 'Adres', 'html' => '<p>Çiğli/İzmir</p>', 'itemStyle' => '', 'infoStyle' => 'min-height: 136px;align-content: center;'],
                    ],
                    'kicker' => 'Bize Ulaşın',
                    'heading' => 'Startkey Türkiye',
                    'intro' => 'Startkey Türkiye Ailesi ile İlgili Tüm Merak Ettikleriniz İçin Bize Ulaşın',
                    'hoursHeading' => 'Çalışma Saatleri',
                    'hours' => [
                        ['labelHtml' => '<b>Pazartesi - Cumartesi</b>', 'value' => '9:00 - 18:00'],
                        ['labelHtml' => '<b>Pazar</b>', 'value' => 'Kapalı'],
                    ],
                    'social' => [['href' => 'https://www.facebook.com/StartkeyEmlak/', 'icon' => 'ri-facebook-fill']],
                    'formTitle' => 'İletişim',
                    'placeholders' => ['Name' => 'Ad', 'Surname' => 'Soyad', 'Email' => 'Email', 'Phone' => '', 'Subject' => 'Konu', 'Message' => 'Mesaj'],
                    'required' => ['Name' => 'Adı Gereklidir.', 'Surname' => 'Soyadı Gereklidir.', 'Email' => 'İş e-postası Gereklidir.', 'Message' => 'Yorumlar Gereklidir.'],
                    'submitLabel' => 'Bize Ulaşın',
                    'captchaError' => 'Captcha boş bırakılamaz!',
                    'mapHref' => 'https://maps.app.goo.gl/9idmLMGy95nsj4WK8',
                    'mapSrc' => "https://www.google.com/maps/embed?pb=test&#39;nin",
                    'mapTitle' => '',
                ],
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/contact',
                'heading' => 'Contact',
                'body_html' => '',
                'breadcrumb' => ['heading' => 'Contact', 'trail' => []],
                'meta' => ['title' => 'Contact | Startkey'],
                'payload' => [
                    'items' => [],
                    'kicker' => 'Get In Touch',
                    'heading' => 'Startkey Turkiye',
                    'intro' => 'Contact us',
                    'hoursHeading' => 'Working Hours',
                    'hours' => [],
                    'social' => [],
                    'formTitle' => 'Contact',
                    'placeholders' => ['Name' => 'Name', 'Surname' => 'Surname', 'Email' => 'Email', 'Phone' => '', 'Subject' => 'Subject', 'Message' => 'Message'],
                    'required' => [],
                    'submitLabel' => 'Get In Touch',
                    'captchaError' => 'Captcha cannot be left blank!',
                    'mapHref' => 'https://maps.app.goo.gl/9idmLMGy95nsj4WK8',
                    'mapSrc' => 'https://www.google.com/maps/embed?pb=test',
                    'mapTitle' => '',
                ],
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/kontakt',
                'heading' => 'Kontakt',
                'body_html' => '',
                'breadcrumb' => ['heading' => 'Kontakt', 'trail' => []],
                'meta' => ['title' => 'Kontakt | Startkey'],
                'payload' => [
                    'items' => [],
                    'kicker' => 'Kontakt',
                    'heading' => 'Startkey Turkiye',
                    'intro' => 'Kontaktieren Sie uns',
                    'hoursHeading' => 'Arbeitszeiten',
                    'hours' => [],
                    'social' => [],
                    'formTitle' => 'Kontakt',
                    'placeholders' => ['Name' => 'Name', 'Surname' => 'Nachname', 'Email' => 'Email', 'Phone' => '', 'Subject' => 'Betreff', 'Message' => 'Nachricht'],
                    'required' => [],
                    'submitLabel' => 'Kontakt',
                    'captchaError' => 'Captcha darf nicht leer bleiben!',
                    'mapHref' => 'https://maps.app.goo.gl/9idmLMGy95nsj4WK8',
                    'mapSrc' => 'https://www.google.com/maps/embed?pb=test',
                    'mapTitle' => '',
                ],
            ],
        ]);
    }

    /**
     * @param  list<array{icon: string, text: string}>  $infoLines
     * @return array<string, mixed>
     */
    private function trainingTranslation(
        string $locale,
        string $urlPath,
        string $title,
        string $formHeading,
        array $infoLines = [],
        ?string $cardUrlPath = null,
        bool $withForm = true,
    ): array {
        if ($infoLines === []) {
            $infoLines = [
                ['icon' => 'flaticon-calendar', 'text' => 'Eğitim Tarihi : 23.9.2026'],
                ['icon' => 'flaticon-time', 'text' => 'Eğitim Saati : 11:00 - 13:00'],
                ['icon' => 'flaticon-price-tag', 'text' => 'Ücretsiz'],
            ];
        }

        return [
            'locale' => $locale,
            'url_path' => $urlPath,
            'card_url_path' => $cardUrlPath ?? $urlPath,
            'title' => $title,
            'list_image' => '/media/content/training.jpg',
            'info_lines' => $infoLines,
            'detail_label' => 'Detay',
            'date_prefix' => 'Eğitim Tarihi :',
            'date_value' => '23.9.2026',
            'time_prefix' => 'Eğitim Saati :',
            'time_value' => '11:00 - 13:00',
            'price_prefix' => 'Fiyat :',
            'price_value' => 'Ücretsiz',
            'image' => '/media/content/training.jpg',
            'location_heading' => 'Konum',
            'location_value' => 'Startkey Akademi',
            'description_heading' => 'Eğitim Açıklaması',
            'description_html' => '<p><p>Seminer açıklaması.</p></p>',
            'form_heading' => $withForm ? 'Ön Başvuru Formu' : '',
            'form' => [
                'placeholders' => $withForm ? ['firstName' => 'Ad', 'lastName' => 'Soyad', 'email' => 'Email'] : [],
                'required' => $withForm ? ['Email' => 'The Email field is required.', 'PhoneNew' => 'The Phone field is required.', 'GenderId' => 'The GenderId field is required.'] : [],
                'genders' => $withForm ? [['value' => 1, 'label' => 'Erkek'], ['value' => 2, 'label' => 'Kadın']] : [],
                'submitLabel' => $withForm ? 'Başvuruyu Gönder' : '',
                'captchaError' => $withForm ? 'Captcha boş bırakılamaz!' : '',
            ],
            'related_heading' => 'Diğer Aktif Seminerler',
            'related' => [
                [
                    'externalId' => 385,
                    'urlPath' => $urlPath,
                    'title' => $title,
                    'image' => '/media/content/training-80x80.jpg',
                ],
            ],
            'page_heading' => 'Eğitim Detay',
            'breadcrumb' => ['heading' => 'Eğitim Detay', 'trail' => []],
            'meta' => ['title' => $title.' | Startkey'],
        ];
    }
}
