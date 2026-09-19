<?php

namespace Tests\Support;

use App\Models\CmsListPage;
use App\Models\CmsListing;
use App\Models\LookupItem;

trait SeedsPortfolioFixtures
{
    protected function seedPortfolioFixtures(): void
    {
        $this->listing(
            482754,
            0,
            [
                'ad_type_id' => '1',
                'process_type_id' => '84',
                'currency_id' => '1',
                'country_id' => '212',
                'city_id' => '9',
                'county_id' => '1637',
                'district_id' => '66531',
                'office_id' => '18453',
                'consultant_id' => '39942',
                'office_slug' => 'laya',
                'consultant_slug' => 'mustafapulat',
                'price_amount' => 29450000,
                'clean_area' => 15505,
                'updated_on' => '2026-09-17',
            ],
            'Yamaçköy üretim',
            '₺ 29.450.000',
        );

        $this->listing(
            482720,
            1,
            [
                'ad_type_id' => '2',
                'process_type_id' => '87',
                'currency_id' => '1',
                'country_id' => '212',
                'city_id' => '9',
                'county_id' => '1231',
                'district_id' => '1',
                'office_id' => '18453',
                'consultant_id' => '37740',
                'office_slug' => 'laya',
                'consultant_slug' => 'sabriye-tursun-kargin',
                'price_amount' => 45000,
                'clean_area' => 120,
                'updated_on' => '2026-08-01',
            ],
            'Ege Mahallesi kiralık',
            '₺ 45.000',
        );

        $this->listing(
            479134,
            2,
            [
                'ad_type_id' => '2',
                'process_type_id' => '86',
                'currency_id' => '1',
                'country_id' => '212',
                'city_id' => '35',
                'county_id' => '2',
                'office_id' => '100',
                'consultant_id' => '40764',
                'office_slug' => 'other',
                'consultant_slug' => 'adilduran',
                'price_amount' => 10500000,
                'clean_area' => 162,
                'updated_on' => '2026-07-01',
            ],
            'Soğucak dubleks',
            '₺ 10.500.000',
        );

        foreach (['tr', 'en', 'de'] as $locale) {
            $paths = [
                'tr' => '/tr/portfoy',
                'en' => '/en/property',
                'de' => '/de/immobilien',
            ];
            $actions = [
                'tr' => '/tr/portfoy',
                'en' => '/en/portfoy',
                'de' => '/de/portfoy',
            ];
            $headings = ['tr' => 'Portföylerimiz', 'en' => 'Our Properties', 'de' => 'Unsere Portfolios'];
            CmsListPage::query()->create([
                'type' => 'listing',
                'locale' => $locale,
                'url_path' => $paths[$locale],
                'pager_base' => $actions[$locale],
                'per_page' => 12,
                'continue_label' => 'Detay',
                'heading' => $headings[$locale],
                'breadcrumb' => ['heading' => $headings[$locale], 'trail' => []],
                'meta' => ['title' => $headings[$locale]],
                'sidebar' => [
                    'filterHeading' => 'Portföy Ara',
                    'mobileFilterOpen' => 'Portföy Filtresini Aç',
                    'submitLabel' => 'Sizin İçin Bulalım',
                    'foundTemplate' => '{count} İlan Bulundu',
                    'labels' => ['FilterDTO_AdTypeId' => 'Portföy Tipi'],
                    'placeholders' => ['keyword' => 'Portföy Adı Veya İd Giriniz'],
                    'adTypes' => [
                        ['value' => '', 'label' => 'Seçiniz'],
                        ['value' => '1', 'label' => 'Arsa'],
                        ['value' => '2', 'label' => 'Konut'],
                    ],
                    'sortOptions' => [
                        ['value' => '', 'label' => 'Seçiniz'],
                        ['value' => '1', 'label' => 'Fiyat Artan'],
                        ['value' => '2', 'label' => 'Fiyat Azalan'],
                    ],
                    'bindUrls' => [
                        'processTypes' => '/'.$locale.'/lookup/ProcessTypes',
                        'currencies' => '/'.$locale.'/lookup/Currencies',
                        'offices' => '/'.$locale.'/Lookup/GetAllOffices',
                    ],
                    'formAction' => $actions[$locale],
                    'aliases' => [$paths[$locale], $actions[$locale]],
                ],
            ]);
        }

        $office = LookupItem::query()->create([
            'group' => 'offices',
            'external_id' => '18453',
            'parent_external_id' => null,
            'position' => 1,
        ]);
        $office->translations()->createMany([
            ['locale' => 'tr', 'label' => 'Laya'],
            ['locale' => 'en', 'label' => 'Laya'],
            ['locale' => 'de', 'label' => 'Laya'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    private function listing(int $externalId, int $rank, array $fields, string $title, string $price): void
    {
        $listing = CmsListing::query()->create(array_merge($fields, [
            'external_id' => $externalId,
            'list_rank' => $rank,
            'published' => true,
            'latitude' => '37.79',
            'longitude' => '27.42',
        ]));

        foreach (['tr', 'en', 'de'] as $locale) {
            $prefix = [
                'tr' => '/tr/portfoy',
                'en' => '/en/property',
                'de' => '/de/immobilien',
            ][$locale];
            $listing->translations()->create([
                'locale' => $locale,
                'url_path' => $prefix.'/'.$externalId.'/satilik/bahce/aydin/soke/listing-'.$externalId,
                'title' => $title,
                'card' => [
                    'urlPath' => $prefix.'/'.$externalId.'/satilik/bahce/aydin/soke/listing-'.$externalId,
                    'image' => '/media/property/card.jpg',
                    'imageWebp' => '/media/property/card.webp',
                    'processType' => 'Satılık',
                    'adSubType' => 'Bahçe',
                    'adTypeIcon' => 'ri-landscape-line',
                    'adType' => 'Arsa',
                    'badgeImage' => '',
                    'price' => $price,
                    'title' => $title,
                    'location' => 'Aydın , Söke',
                    'updatedLabel' => 'Güncelleme Tarihi : 17.09.2026',
                    'features' => [['icon' => 'flaticon-square', 'text' => 'Brüt: 15505 m²']],
                    'detailLabel' => 'Detay',
                ],
                'detail' => [
                    'price' => $price,
                    'gallery' => [
                        [
                            'original' => '/media/property/full.jpg',
                            'image' => '/media/property/full-600x400.jpg',
                            'imageWebp' => '/media/property/full-600x400.webp',
                            'thumb' => '/media/property/full-100x100.jpg',
                            'caption' => '0',
                        ],
                    ],
                    'locationIds' => [
                        'cityId' => $fields['city_id'] ?? '',
                        'cityLabel' => 'Aydın',
                        'countyId' => $fields['county_id'] ?? '',
                        'countyLabel' => 'Söke',
                        'districtId' => $fields['district_id'] ?? '',
                        'districtLabel' => 'Yamaç',
                    ],
                    'specs' => [['label' => 'Portföy Id', 'value' => (string) $externalId]],
                    'descriptionHeading' => 'Açıklama',
                    'descriptionHtml' => '<p>Açıklama metni.</p>',
                    'eids' => ['heading' => 'EİDS Durumu', 'image' => '/media/property/eids.png', 'text' => 'Doğrulanmıştır.'],
                    'featureGroups' => [['heading' => 'Altyapı', 'items' => ['Elektrik']]],
                    'map' => [
                        'heading' => 'Konum',
                        'latitude' => '37.79',
                        'longitude' => '27.42',
                        'iframeSrc' => 'https://maps.google.com/maps?q=37.79,27.42&output=embed',
                        'directionsLabel' => 'Yol Tarifi',
                        'streetViewLabel' => 'Sokak Görünümü',
                    ],
                    'agent' => [
                        'name' => 'Mustafa Pulat',
                        'image' => '/media/user/agent.jpg',
                        'imageWebp' => '/media/user/agent.webp',
                        'officeName' => 'Laya',
                        'phones' => [['href' => 'tel:905469771933', 'label' => '+90 (546) 977-1933', 'icon' => 'ri-phone-line']],
                        'emailHref' => 'mailto:mustafa.pulat@startkey.com.tr',
                        'emailLabel' => 'mustafa.pulat@startkey.com.tr',
                    ],
                    'form' => [
                        'heading' => 'İletişim',
                        'placeholders' => ['Subject' => 'Konu', 'FullName' => 'Ad Soyad', 'Email' => 'Email', 'Phone' => '', 'Message' => 'Mesaj'],
                        'submitLabel' => 'Mesajı Gönder',
                        'captchaError' => 'Captcha boş bırakılamaz!',
                    ],
                    'relatedHeading' => 'Danışmana Ait Diğer Portföyler',
                    'relatedIds' => [482754, 482720],
                ],
                'breadcrumb' => ['heading' => 'Portföylerimiz', 'trail' => []],
                'meta' => ['title' => $title],
            ]);
        }
    }
}
