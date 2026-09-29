<?php

namespace App\Support;

class ConsultantApplicationPage
{
    public function payload(string $locale, string $path): ?array
    {
        $paths = config('site.corporate.consultant_application.lists.'.$locale, []);
        if (! in_array($path, $paths, true)) {
            return null;
        }

        $copy = $this->copy($locale);

        return [
            'kind' => 'consultant-application',
            'key' => 'consultant-application',
            'heading' => $copy['heading'],
            'urlPath' => $path,
            'formHeading' => $copy['formHeading'],
            'placeholders' => $copy['placeholders'],
            'required' => $copy['required'],
            'positions' => $copy['positions'],
            'submitLabel' => $copy['submitLabel'],
            'captchaError' => $copy['captchaError'],
            'bodyHtml' => $copy['bodyHtml'],
            'breadcrumb' => [
                'heading' => $copy['heading'],
                'trail' => [
                    ['href' => '/'.$locale, 'label' => $copy['home']],
                    ['href' => null, 'label' => $copy['heading']],
                ],
            ],
            'meta' => ['title' => $copy['metaTitle']],
            'alternates' => [
                'tr' => '/tr/danisman-basvuru',
                'en' => '/en/consultant-form',
                'de' => '/de/consultant-form',
            ],
        ];
    }

    private function copy(string $locale): array
    {
        $sharedRequired = [
            'FirstName' => 'İsim zorunludur.',
            'LastName' => 'Soyisim zorunludur.',
            'Email' => 'E-posta zorunludur.',
            'Phone' => 'Telefon zorunludur.',
            'OfficeCityId' => 'Çalışmak istediğiniz il zorunludur.',
            'OfficeId' => 'Ofis zorunludur.',
            'AppealTypeId' => 'Çalışmak istediğiniz pozisyon zorunludur.',
        ];

        $pages = [
            'tr' => [
                'heading' => 'Danışman Başvuru Formu',
                'formHeading' => 'Danışman Başvurusu',
                'metaTitle' => 'Startkey Türkiye | Danışman Başvuru Formu',
                'home' => 'Anasayfa',
                'submitLabel' => 'Başvuruyu Gönder',
                'captchaError' => 'Doğrulama zorunludur.',
                'placeholders' => [
                    'FirstName' => 'Ad',
                    'LastName' => 'Soyad',
                    'Email' => 'Email',
                    'Notes' => 'İş Tecrübeniz',
                ],
                'positions' => [
                    ['value' => '2', 'label' => 'Gayrimenkul Danışmanı'],
                    ['value' => '4', 'label' => 'Ofis Yöneticisi'],
                    ['value' => '5', 'label' => 'Ofis Asistanı'],
                ],
                'bodyHtml' => '<section class="container pt-40 pb-40"><h3>Kendi Başarını Kendin İnşa Et</h3><p>Gayrimenkul sektöründe kendi kariyerini oluşturmak isteyen danışmanlar için Startkey, gelişim ve kazanç odaklı bir çalışma ortamı sunar.</p><h3>Neler Sunuyoruz?</h3><ul><li>Portföy ve müşteri geliştirme desteği</li><li>Kariyer gelişim fırsatları</li><li>Startkey Akademi</li></ul></section>',
            ],
            'en' => [
                'heading' => 'Consultant Application Form',
                'formHeading' => 'Consultant Application',
                'metaTitle' => 'Consultant Application Form',
                'home' => 'Home',
                'submitLabel' => 'Send Application',
                'captchaError' => 'Doğrulama zorunludur.',
                'placeholders' => [
                    'FirstName' => 'Name',
                    'LastName' => 'Surname',
                    'Email' => 'Email',
                    'Notes' => 'Work Experience',
                ],
                'positions' => [
                    ['value' => '2', 'label' => 'Real Estate Agent'],
                    ['value' => '4', 'label' => 'Office Manager'],
                    ['value' => '5', 'label' => 'Office Asistant'],
                ],
                'bodyHtml' => '',
            ],
            'de' => [
                'heading' => 'Beraterantragsformular',
                'formHeading' => 'Beraterbewerbung',
                'metaTitle' => 'Beraterantragsformular',
                'home' => 'Startseite',
                'submitLabel' => 'Senden Sie die Bewerbung',
                'captchaError' => 'Doğrulama zorunludur.',
                'placeholders' => [
                    'FirstName' => 'Name',
                    'LastName' => 'Familien-oder Nachname',
                    'Email' => 'Email',
                    'Notes' => 'Ihre Berufserfahrung',
                ],
                'positions' => [
                    ['value' => '2', 'label' => 'Immobilienmakler'],
                    ['value' => '4', 'label' => 'Büroleiter'],
                    ['value' => '5', 'label' => 'Büroassistent'],
                ],
                'bodyHtml' => '',
            ],
        ];

        $page = $pages[$locale] ?? $pages['tr'];
        $page['required'] = $sharedRequired;

        return $page;
    }
}
