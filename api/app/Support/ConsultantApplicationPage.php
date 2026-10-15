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
                'bodyHtml' => $this->body('tr'),
            ],
            'en' => [
                'heading' => 'Consultant Application Form',
                'formHeading' => 'Consultant Application',
                'metaTitle' => 'Consultant Application Form',
                'home' => 'Home',
                'submitLabel' => 'Send Application',
                'captchaError' => 'Verification is required.',
                'placeholders' => [
                    'FirstName' => 'Name',
                    'LastName' => 'Surname',
                    'Email' => 'Email',
                    'Notes' => 'Work Experience',
                ],
                'positions' => [
                    ['value' => '2', 'label' => 'Real Estate Agent'],
                    ['value' => '4', 'label' => 'Office Manager'],
                    ['value' => '5', 'label' => 'Office Assistant'],
                ],
                'bodyHtml' => $this->body('en'),
            ],
            'de' => [
                'heading' => 'Beraterantragsformular',
                'formHeading' => 'Beraterbewerbung',
                'metaTitle' => 'Beraterantragsformular',
                'home' => 'Startseite',
                'submitLabel' => 'Senden Sie die Bewerbung',
                'captchaError' => 'Verifizierung ist erforderlich.',
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
                'bodyHtml' => $this->body('de'),
            ],
        ];

        $page = $pages[$locale] ?? $pages['tr'];
        $page['required'] = $sharedRequired;

        return $page;
    }

    private function body(string $locale): string
    {
        $path = database_path('data/consultant-bodies/'.$locale.'.html');

        return is_file($path) ? (string) file_get_contents($path) : '';
    }
}
