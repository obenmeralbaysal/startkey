<?php

namespace Tests\Support;

use App\Models\CmsConsultant;
use App\Models\CmsListPage;
use App\Models\CmsOffice;
use App\Models\LookupItem;

trait SeedsOfficesFixtures
{
    protected function seedOfficesFixtures(): void
    {
        $this->office(16369, '1872', 0, '9', 'İzmir', [
            'tr' => ['name' => '1872', 'path' => '/tr/1872', 'short' => '/1872'],
            'en' => ['name' => '1872', 'path' => '/en/1872', 'short' => '/en/1872'],
            'de' => ['name' => '1872', 'path' => '/de/1872', 'short' => '/de/1872'],
        ]);
        $this->office(18824, 'zeta2', 1, '9', 'İzmir', [
            'tr' => ['name' => 'Zeta 2', 'path' => '/tr/ofisler/18824/zeta2', 'short' => '/zeta2'],
            'en' => ['name' => 'Zeta 2', 'path' => '/en/offices/18824/zeta2', 'short' => '/en/zeta2'],
            'de' => ['name' => 'Zeta 2', 'path' => '/de/anbieteren/18824/zeta2', 'short' => '/de/zeta2'],
        ]);

        $this->consultant(41507, 'arsin-yayman', '18824', 'Arşın', 'Yayman', true, 0, [
            'tr' => ['name' => 'Arşın Yayman', 'role' => 'Danışman', 'path' => '/tr/danismanlar/41507/arsin-yayman'],
            'en' => ['name' => 'Arşın Yayman', 'role' => 'Consultant', 'path' => '/en/agents/41507/arsin-yayman'],
            'de' => ['name' => 'Arşın Yayman', 'role' => 'Berater', 'path' => '/de/immobilienmakleren/41507/arsin-yayman'],
        ]);
        $this->consultant(32579, 'mujde-tarhan', '16369', 'Müjde', 'Tarhan', false, 1, [
            'tr' => ['name' => 'Müjde Tarhan', 'role' => 'Broker/Owner', 'path' => '/tr/danismanlar/32579/mujde-tarhan'],
            'en' => ['name' => 'Müjde Tarhan', 'role' => 'Broker/Owner', 'path' => '/en/agents/32579/mujde-tarhan'],
            'de' => ['name' => 'Müjde Tarhan', 'role' => 'Broker/Owner', 'path' => '/de/immobilienmakleren/32579/mujde-tarhan'],
        ]);

        foreach (['tr', 'en', 'de'] as $locale) {
            CmsListPage::query()->create([
                'type' => 'office',
                'locale' => $locale,
                'url_path' => ['tr' => '/tr/ofisler', 'en' => '/en/offices', 'de' => '/de/anbieteren'][$locale],
                'pager_base' => ['tr' => '/tr/ofislerimiz', 'en' => '/en/ofislerimiz', 'de' => '/de/ofislerimiz'][$locale],
                'per_page' => 18,
                'continue_label' => '',
                'heading' => 'Ofislerimiz',
                'breadcrumb' => ['heading' => 'Ofislerimiz', 'trail' => []],
                'meta' => ['title' => 'Ofislerimiz'],
                'sidebar' => [
                    'searchHeading' => 'Ofis Ara :',
                    'searchPlaceholder' => 'Ofis Adı',
                    'submitLabel' => 'Ara',
                    'foundTemplate' => '{count} Ofis Bulundu',
                    'bindUrls' => ['countries' => '/'.$locale.'/Lookup/EnteredOfficeCountries'],
                    'formAction' => ['tr' => '/tr/ofisler', 'en' => '/en/offices', 'de' => '/de/anbieteren'][$locale],
                ],
            ]);
            CmsListPage::query()->create([
                'type' => 'consultant',
                'locale' => $locale,
                'url_path' => ['tr' => '/tr/danismanlar', 'en' => '/en/agents', 'de' => '/de/immobilienmakleren'][$locale],
                'pager_base' => '/'.$locale.'/danisman-liste',
                'per_page' => 15,
                'continue_label' => '',
                'heading' => 'Danışmanlarımız',
                'breadcrumb' => ['heading' => 'Danışmanlarımız', 'trail' => []],
                'meta' => ['title' => 'Danışmanlarımız'],
                'sidebar' => [
                    'searchHeading' => 'Danışman Ara :',
                    'submitLabel' => 'Ara',
                    'foundTemplate' => '{count} Danışman Bulundu',
                    'placeholders' => ['firstName' => 'Ad', 'lastName' => 'Soyad'],
                    'bindUrls' => ['offices' => '/'.$locale.'/Lookup/GetAllOffices', 'cities' => '/'.$locale.'/Lookup/Cities'],
                    'formAction' => ['tr' => '/tr/danismanlar', 'en' => '/en/agents', 'de' => '/de/immobilienmakleren'][$locale],
                ],
            ]);
        }

        $city = LookupItem::query()->create([
            'group' => 'cities',
            'external_id' => '9',
            'parent_external_id' => null,
            'position' => 1,
        ]);
        $city->translations()->createMany([
            ['locale' => 'tr', 'label' => 'İzmir'],
            ['locale' => 'en', 'label' => 'Izmir'],
            ['locale' => 'de', 'label' => 'Izmir'],
        ]);
    }

    /**
     * @param  array<string, array{name: string, path: string, short: string}>  $translations
     */
    private function office(int $id, string $slug, int $rank, string $cityId, string $cityLabel, array $translations): void
    {
        $office = CmsOffice::query()->create([
            'external_id' => $id,
            'short_slug' => $slug,
            'country_id' => '212',
            'city_id' => $cityId,
            'city_label' => $cityLabel,
            'list_rank' => $rank,
            'published' => true,
        ]);

        foreach ($translations as $locale => $row) {
            $office->translations()->create([
                'locale' => $locale,
                'url_path' => $row['path'],
                'short_path' => $row['short'],
                'name' => $row['name'],
                'card' => [
                    'urlPath' => $row['short'],
                    'name' => $row['name'],
                    'image' => '/media/officelogo/'.$slug.'.png',
                    'location' => $cityLabel,
                ],
                'detail' => [
                    'image' => '/media/officelogo/'.$slug.'.png',
                    'email' => $slug.'@startkey.com.tr',
                    'address' => $cityLabel,
                    'portfoliosLabel' => $row['name'].' Tüm Portföyleri',
                    'tabs' => [
                        ['id' => 'tab_1', 'label' => 'Ekibimiz'],
                        ['id' => 'tab_2', 'label' => 'Ofisin Portföyleri'],
                        ['id' => 'tab_3', 'label' => 'Konum'],
                    ],
                    'teamGroups' => $id === 16369
                        ? [['heading' => 'BROKER/OWNER', 'consultantIds' => [32579]]]
                        : [['heading' => 'PROFESYONELLER', 'consultantIds' => [41507]]],
                    'listingIds' => [],
                    'map' => ['iframeSrc' => 'https://maps.google.com/?q=38,27'],
                ],
                'breadcrumb' => ['heading' => $row['name'], 'trail' => []],
                'meta' => ['title' => $row['name']],
            ]);
        }
    }

    /**
     * @param  array<string, array{name: string, role: string, path: string}>  $translations
     */
    private function consultant(int $id, string $slug, string $officeId, string $first, string $last, bool $full, int $rank, array $translations): void
    {
        $consultant = CmsConsultant::query()->create([
            'external_id' => $id,
            'slug' => $slug,
            'office_id' => $officeId,
            'city_id' => '9',
            'first_name' => $first,
            'last_name' => $last,
            'has_full_detail' => $full,
            'published' => true,
            'list_rank' => $rank,
        ]);

        foreach ($translations as $locale => $row) {
            $consultant->translations()->create([
                'locale' => $locale,
                'url_path' => $row['path'],
                'name' => $row['name'],
                'role' => $row['role'],
                'card' => [
                    'urlPath' => $row['path'],
                    'name' => $row['name'],
                    'role' => $row['role'],
                    'image' => '/media/user/'.$slug.'.jpg',
                ],
                'detail' => [
                    'image' => '/media/user/'.$slug.'.jpg',
                    'email' => $slug.'@startkey.com.tr',
                    'officeName' => $officeId === '18824' ? 'Zeta 2' : '1872',
                    'officeHref' => $officeId === '18824' ? '/tr/ofisler/18824/zeta2' : '/1872',
                    'tabs' => [
                        ['id' => 'tab_1', 'label' => 'Hakkımda'],
                        ['id' => 'tab_2', 'label' => 'Portföyler'],
                        ['id' => 'tab_3', 'label' => 'Yorumlar'],
                    ],
                    'bioHtml' => $full ? '<p>.</p>' : '',
                    'listingIds' => [],
                    'allListingsLabel' => 'Tüm Portföylerim',
                    'commentHeading' => $row['name'].' için Yorum Ekle',
                    'form' => [
                        'placeholders' => ['FirstName' => 'Ad', 'LastName' => 'Soyad', 'Email' => 'Email', 'Comment' => 'Yorum'],
                        'submitLabel' => 'Gönder',
                        'captchaError' => '',
                    ],
                ],
                'breadcrumb' => ['heading' => $row['name'], 'trail' => []],
                'meta' => ['title' => $row['name']],
            ]);
        }
    }
}
