<?php

namespace Tests\Support;

use App\Models\CmsPage;

trait SeedsFooterFixtures
{
    protected function seedFooterFixtures(): void
    {
        $franchise = CmsPage::query()->create(['key' => 'franchise', 'published' => true, 'position' => 30]);
        $franchise->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/franchise-basvuru',
                'heading' => 'Franchise',
                'body_html' => '<section class="hw-wrap pt-100"><h2>Franchise Fırsatı</h2></section>',
                'breadcrumb' => [
                    'heading' => 'Franchise',
                    'trail' => [
                        ['href' => '/', 'label' => 'Anasayfa'],
                        ['href' => null, 'label' => 'Franchise'],
                    ],
                ],
                'meta' => ['title' => 'Startkey Türkiye | Franchise'],
                'payload' => [
                    'formHeading' => 'Franchise Başvurusu',
                    'placeholders' => ['FirstName' => 'Ad', 'LastName' => 'Soyad', 'Email' => 'Email', 'Notes' => 'Tecrübe'],
                    'required' => [
                        'FirstName' => 'İsim zorunludur.',
                        'LastName' => 'Soyisim zorunludur.',
                        'Email' => 'E-posta zorunludur.',
                        'Phone' => 'Telefon zorunludur.',
                        'OpenOfficeCityId' => 'Şehir zorunludur.',
                    ],
                    'cities' => [
                        ['value' => '', 'label' => 'Seçiniz'],
                        ['value' => '35', 'label' => 'İzmir'],
                    ],
                    'countyBindUrl' => '/tr/Lookup/Counties',
                    'submitLabel' => 'Başvuruyu Gönder',
                    'captchaError' => 'Captcha boş bırakılamaz!',
                    'widgetCss' => '.widget-item { display: flex; }',
                ],
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/franchise-form',
                'heading' => 'Franchise',
                'body_html' => '<section class="hw-wrap pt-100"><h2>Franchise Opportunity</h2></section>',
                'breadcrumb' => ['heading' => 'Franchise', 'trail' => []],
                'meta' => ['title' => '| Franchise'],
                'payload' => [
                    'formHeading' => 'Franchise Application',
                    'placeholders' => ['FirstName' => 'Name', 'LastName' => 'Surname', 'Email' => 'Email', 'Notes' => 'Experience'],
                    'required' => ['FirstName' => 'İsim zorunludur.'],
                    'cities' => [['value' => '', 'label' => 'Select'], ['value' => '35', 'label' => 'İzmir']],
                    'countyBindUrl' => '/en/Lookup/Counties',
                    'submitLabel' => 'Send Application',
                    'captchaError' => 'Captcha boş bırakılamaz!',
                    'widgetCss' => '.widget-item { display: flex; }',
                ],
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/franchise-form',
                'heading' => 'Franchise',
                'body_html' => '<section class="hw-wrap pt-100"><h2>Franchise-Chance</h2></section>',
                'breadcrumb' => ['heading' => 'Franchise', 'trail' => []],
                'meta' => ['title' => '| Franchise'],
                'payload' => [
                    'formHeading' => 'Franchise-Antrag',
                    'placeholders' => ['FirstName' => 'Name'],
                    'required' => ['FirstName' => 'İsim zorunludur.'],
                    'cities' => [['value' => '', 'label' => 'Wählen']],
                    'countyBindUrl' => '/de/Lookup/Counties',
                    'submitLabel' => 'Senden Sie die Bewerbung',
                    'captchaError' => 'Captcha boş bırakılamaz!',
                    'widgetCss' => '.widget-item { display: flex; }',
                ],
            ],
        ]);

        $kvkk = CmsPage::query()->create(['key' => 'kvkk', 'published' => true, 'position' => 31]);
        $kvkk->translations()->create([
            'locale' => 'tr',
            'url_path' => '/tr/sayfa/kvkk',
            'heading' => 'KVKK',
            'body_html' => '<div class="blog-details-wrap"><p>KVKK ve Gizlilik Sözleşmesi</p></div>',
            'breadcrumb' => ['heading' => 'KVKK', 'trail' => [['href' => '/', 'label' => 'Anasayfa']]],
            'meta' => ['title' => 'Startkey Türkiye | KVKK'],
        ]);

        $terms = CmsPage::query()->create(['key' => 'terms', 'published' => true, 'position' => 32]);
        $terms->translations()->createMany([
            [
                'locale' => 'tr',
                'url_path' => '/tr/sayfa/hizmet-sozlesmesi',
                'heading' => 'Hizmet Sözleşmesi',
                'body_html' => '<div class="blog-details-wrap"><p>STARTKEY HİZMET VE KULLANIM SÖZLEŞMESİ</p></div>',
                'breadcrumb' => ['heading' => 'Hizmet Sözleşmesi', 'trail' => []],
                'meta' => ['title' => 'Startkey Türkiye | Hizmet Sözleşmesi'],
            ],
            [
                'locale' => 'en',
                'url_path' => '/en/page/hizmet-sozlesmesi',
                'heading' => 'Terms Of Service',
                'body_html' => '<div class="blog-details-wrap"><p>STARTKEY TERMS OF SERVICE</p></div>',
                'breadcrumb' => ['heading' => 'Terms Of Service', 'trail' => []],
                'meta' => ['title' => '| Terms Of Service'],
            ],
            [
                'locale' => 'de',
                'url_path' => '/de/page/hizmet-sozlesmesi',
                'heading' => 'Dienstleistungs',
                'body_html' => '<div class="blog-details-wrap"><p>STARTKEY DIENSTLEISTUNG</p></div>',
                'breadcrumb' => ['heading' => 'Dienstleistungs', 'trail' => []],
                'meta' => ['title' => '| Dienstleistungs'],
            ],
        ]);
    }
}
