<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ReonixCatalogue
{
    public function __construct(private readonly ReonixClient $reonix) {}

    public function configured(): bool
    {
        return (string) config('reonix.base_url') !== '' && (string) config('reonix.portal_key') !== '';
    }

    /** @return list<array<string, mixed>>|null */
    public function collection(string $kind): ?array
    {
        if (! $this->configured()) {
            return null;
        }

        try {
            $body = $this->reonix->get('catalogue/'.$kind);
        } catch (ReonixException $e) {
            Log::warning('Portal catalogue list failed.', ['kind' => $kind, 'status' => $e->status]);

            return [];
        }

        $rows = $body['data'] ?? [];

        return is_array($rows) ? array_values(array_filter($rows, 'is_array')) : [];
    }

    /** @return array<string, mixed>|null */
    public function officeDetail(string $locale, int $id): ?array
    {
        $body = $this->one('catalogue/offices/'.$id);
        if ($body === null) {
            return null;
        }
        $office = is_array($body['office'] ?? null) ? $body['office'] : null;
        if ($office === null) {
            return null;
        }

        $consultants = is_array($body['consultants'] ?? null) ? $body['consultants'] : [];
        $portfolios = is_array($body['portfolios'] ?? null) ? $body['portfolios'] : [];
        $card = $this->officeCard($office, $locale);
        $name = $card['name'];
        $address = (string) ($office['address'] ?? '');
        $latitude = trim((string) ($office['latitude'] ?? ''));
        $longitude = trim((string) ($office['longitude'] ?? ''));
        $mapQuery = ($latitude !== '' && $longitude !== '') ? $latitude.','.$longitude : $address;

        return [
            'kind' => 'office-detail',
            'externalId' => (int) $office['id'],
            'urlPath' => $card['urlPath'],
            'shortPath' => $card['urlPath'],
            'name' => $name,
            'image' => $card['image'],
            'imageWebp' => '',
            'phoneHref' => $card['phoneHref'],
            'phoneLabel' => $card['phoneLabel'],
            'email' => $card['email'],
            'address' => $address,
            'instagram' => '',
            'portfoliosHref' => $this->listPath('listings', $locale).'?FilterDTO.OfficeId='.(int) $office['id'],
            'portfoliosLabel' => $name.' '.match ($locale) {
                'en' => 'All Portfolios',
                'de' => 'Alle Portfolios',
                default => 'Tüm Portföyleri',
            },
            'tabs' => [
                ['id' => 'tab_1', 'label' => match ($locale) {
                    'en' => 'Our team',
                    'de' => 'Unser Team',
                    default => 'Ekibimiz',
                }],
                ['id' => 'tab_2', 'label' => match ($locale) {
                    'en' => 'Portfolios of the Office',
                    'de' => 'Portfolios des Amtes',
                    default => 'Ofisin Portföyleri',
                }],
                ['id' => 'tab_3', 'label' => match ($locale) {
                    'en' => 'Location',
                    'de' => 'Ort',
                    default => 'Konum',
                }],
            ],
            'teamGroups' => $this->teamGroups($consultants, $locale),
            'listings' => array_values(array_map(fn ($row) => $this->listingCard($row, $locale), array_filter($portfolios, 'is_array'))),
            'emptyListingsLabel' => $this->emptyListingsLabel($locale),
            'seeAllHref' => $this->listPath('listings', $locale),
            'seeAllLabel' => $this->seeAllLabel($locale),
            'map' => $mapQuery === '' ? [] : [
                'query' => $mapQuery,
                'iframeSrc' => 'https://maps.google.com/maps?q='.rawurlencode($mapQuery).'&output=embed',
                'directionsLabel' => match ($locale) {
                    'en' => 'Directions',
                    'de' => 'Wegbeschreibung',
                    default => 'Yol Tarifi',
                },
                'streetViewLabel' => match ($locale) {
                    'en' => 'Street View',
                    'de' => 'Straßenansicht',
                    default => 'Sokak Görünümü',
                },
            ],
            'breadcrumb' => [
                'heading' => $name,
                'trail' => [
                    ['href' => $this->homePath($locale), 'label' => $this->homeLabel($locale)],
                    ['href' => $this->listPath('offices', $locale), 'label' => $this->officeListLabel($locale)],
                    ['href' => null, 'label' => $name],
                ],
            ],
            'meta' => ['title' => 'Startkey Türkiye | '.$name],
            'alternates' => $this->alternates('offices', (int) $office['id'], (string) $office['name']),
        ];
    }

    /** @return array<string, mixed>|null */
    public function consultantDetail(string $locale, int $id): ?array
    {
        $body = $this->one('catalogue/consultants/'.$id);
        if ($body === null || ! is_array($body['consultant'] ?? null)) {
            return null;
        }
        $row = $body['consultant'];
        $card = $this->consultantCard($row, $locale);
        $officeId = (int) ($row['office_id'] ?? 0);
        $name = $card['name'];
        $portfolios = is_array($body['portfolios'] ?? null) ? $body['portfolios'] : [];
        $listPath = $this->listPath('listings', $locale);

        return [
            'kind' => 'consultant-detail',
            'externalId' => (int) $row['id'],
            'urlPath' => $card['urlPath'],
            'name' => $name,
            'role' => $card['role'],
            'image' => $card['image'],
            'imageWebp' => '',
            'email' => $card['email'],
            'phoneHref' => $card['phoneHref'],
            'phoneLabel' => $card['phoneLabel'],
            'officeHref' => $officeId > 0 ? $this->detailPath('offices', $locale, $officeId, (string) ($row['office_name'] ?? '')) : '',
            'officeName' => (string) ($row['office_name'] ?? ''),
            'contactLabels' => [
                'email' => 'Email:',
                'phone' => match ($locale) {
                    'en' => 'Phone:',
                    'de' => 'Telefon:',
                    default => 'Telefon:',
                },
                'office' => 'Startkey:',
            ],
            'tabs' => [
                ['id' => 'tab_1', 'label' => match ($locale) {
                    'en' => 'About me',
                    'de' => 'Über mich',
                    default => 'Hakkımda',
                }],
                ['id' => 'tab_2', 'label' => 'Portföyler'],
                ['id' => 'tab_3', 'label' => match ($locale) {
                    'en' => 'Comments',
                    'de' => 'Kommentare',
                    default => 'Yorumlar',
                }],
            ],
            'bioHtml' => '',
            'listings' => array_values(array_map(fn ($item) => $this->listingCard($item, $locale), array_filter($portfolios, 'is_array'))),
            'allListingsHref' => $listPath,
            'allListingsLabel' => $this->seeAllLabel($locale),
            'mineListingsHref' => $listPath.'?FilterDTO.OfficeId='.$officeId.'&FilterDTO.UserId='.(int) $row['id'],
            'mineListingsLabel' => match ($locale) {
                'en' => 'All My Portfolios',
                'de' => 'Alle meine Portfolios',
                default => 'Tüm Portföylerim',
            },
            'emptyListingsLabel' => $this->emptyListingsLabel($locale),
            'commentHeading' => match ($locale) {
                'en' => 'Add Comment For '.$name,
                'de' => 'Fügen Sie Kommentare für '.$name.' hinzu',
                default => $name.' için Yorum Ekle',
            },
            'comments' => array_values(array_map(fn ($review) => [
                'firstName' => (string) ($review['firstName'] ?? ''),
                'lastName' => (string) ($review['lastName'] ?? ''),
                'date' => (string) ($review['date'] ?? ''),
                'text' => (string) ($review['text'] ?? ''),
                'rating' => $review['rating'] ?? null,
            ], array_filter(is_array($row['reviews'] ?? null) ? $row['reviews'] : [], 'is_array'))),
            'form' => [
                'placeholders' => match ($locale) {
                    'en' => ['FirstName' => 'Name', 'LastName' => 'Surname', 'Email' => 'Email', 'Comment' => 'Comment'],
                    'de' => ['FirstName' => 'Name', 'LastName' => 'Familien-oder Nachname', 'Email' => 'Email', 'Comment' => 'Kommentar'],
                    default => ['FirstName' => 'Ad', 'LastName' => 'Soyad', 'Email' => 'Email', 'Comment' => 'Yorum'],
                },
                'submitLabel' => match ($locale) {
                    'en' => 'Send Comment',
                    'de' => 'Senden Sie den Kommentar',
                    default => 'Yorumu Gönder',
                },
                'captchaError' => 'Captcha boş bırakılamaz!',
            ],
            'ratingLabel' => 'Yıldız',
            'breadcrumb' => [
                'heading' => $name,
                'trail' => [
                    ['href' => $this->homePath($locale), 'label' => $this->homeLabel($locale)],
                    ['href' => $this->listPath('consultants', $locale), 'label' => match ($locale) {
                        'en' => 'Our Consultants',
                        'de' => 'Unsere Berater',
                        default => 'Danışmanlarımız',
                    }],
                    ['href' => null, 'label' => $name],
                ],
            ],
            'meta' => ['title' => 'Startkey Türkiye | '.$name],
            'alternates' => $this->alternates('consultants', (int) $row['id'], (string) $row['name']),
        ];
    }

    /** @return array<string, mixed>|null */
    public function listingDetail(string $locale, int $id): ?array
    {
        $body = $this->one('catalogue/portfolios/'.$id);
        if ($body === null || ! is_array($body['portfolio'] ?? null)) {
            return null;
        }
        $row = $body['portfolio'];
        $card = $this->listingCard($row, $locale);
        $office = is_array($body['office'] ?? null) ? $body['office'] : [];
        $agent = is_array($body['agent'] ?? null) ? $body['agent'] : [];
        $officeId = (int) ($office['id'] ?? 0);
        $agentId = (int) ($agent['id'] ?? 0);
        $description = trim((string) ($row['description'] ?? ''));

        return [
            'kind' => 'listing-detail',
            'externalId' => (int) $row['id'],
            'urlPath' => $card['urlPath'],
            'title' => $card['title'],
            'price' => $card['price'],
            'gallery' => $this->gallery($row),
            'locationLinks' => $card['location'] !== '' ? [['href' => null, 'label' => $card['location']]] : [],
            'specs' => [],
            'descriptionHeading' => '',
            'descriptionHtml' => $description === '' ? '' : '<p>'.e($description).'</p>',
            'eids' => null,
            'featureGroups' => [],
            'map' => [
                'heading' => '',
                'latitude' => (string) ($row['latitude'] ?? ''),
                'longitude' => (string) ($row['longitude'] ?? ''),
                'iframeSrc' => '',
                'directionsLabel' => '',
                'streetViewLabel' => '',
            ],
            'agent' => [
                'name' => (string) ($agent['name'] ?? ''),
                'href' => $agentId > 0 ? $this->detailPath('consultants', $locale, $agentId, (string) ($agent['name'] ?? '')) : '',
            'image' => $this->catalogueImage('consultants', $agent),
            'imageWebp' => '',
            'officeName' => (string) ($office['name'] ?? ''),
                'officeHref' => $officeId > 0 ? $this->detailPath('offices', $locale, $officeId, (string) ($office['name'] ?? '')) : '',
                'phones' => isset($agent['phone']) && $agent['phone'] !== '' ? [[
                    'href' => 'tel:'.preg_replace('/\D+/', '', (string) $agent['phone']),
                    'label' => (string) $agent['phone'],
                    'icon' => 'ri-phone-line',
                ]] : [],
                'emailHref' => isset($agent['email']) && $agent['email'] !== '' ? 'mailto:'.$agent['email'] : '',
                'emailLabel' => (string) ($agent['email'] ?? ''),
            ],
            'form' => [
                'heading' => '',
                'placeholders' => $this->formPlaceholders($locale),
                'submitLabel' => match ($locale) {
                    'en' => 'Send Message',
                    'de' => 'Kontaktiere uns',
                    default => 'Mesajı Gönder',
                },
                'captchaError' => 'Captcha boş bırakılamaz!',
            ],
            'relatedHeading' => '',
            'related' => [],
            'breadcrumb' => ['heading' => $card['title'], 'trail' => []],
            'meta' => ['title' => $card['title']],
            'alternates' => [],
        ];
    }

    /** @param  array<string, mixed>  $row */
    public function officeCard(array $row, string $locale): array
    {
        $id = (int) ($row['id'] ?? 0);
        $name = (string) ($row['name'] ?? '');
        $phone = (string) ($row['phone'] ?? '');

        return [
            'externalId' => $id,
            'urlPath' => $this->detailPath('offices', $locale, $id, $name),
            'name' => $name,
            'image' => $this->catalogueImage('offices', $row),
            'imageWebp' => '',
            'phoneHref' => $phone !== '' ? 'tel:'.preg_replace('/\D+/', '', $phone) : '',
            'phoneLabel' => $this->phoneLabel($phone),
            'email' => (string) ($row['email'] ?? ''),
            'location' => $this->cardLocation((string) ($row['address'] ?? '')),
            'variant' => 'office',
        ];
    }

    /** Formats bare digits like the reference ("+90 (232) 812-1872"); ten digits are a Turkish number. */
    private function phoneLabel(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (! str_starts_with(trim($phone), '+') && str_starts_with($digits, '0') && strlen($digits) === 11) {
            $digits = substr($digits, 1);
        }
        $length = strlen($digits);
        if ($length < 10 || $length > 13) {
            return $phone;
        }
        $country = $length === 10 ? '90' : substr($digits, 0, $length - 10);
        $local = substr($digits, -10);

        return '+'.$country.' ('.substr($local, 0, 3).') '.substr($local, 3, 3).'-'.substr($local, 6);
    }

    /** Office cards show "City / District" like the reference list; detail pages keep the full address. */
    private function cardLocation(string $address): string
    {
        $parts = array_values(array_filter(array_map('trim', explode('/', $address)), fn ($part) => $part !== ''));

        return implode(' / ', array_slice($parts, 0, 2));
    }

    /** @param  array<string, mixed>  $row */
    public function consultantCard(array $row, string $locale): array
    {
        $id = (int) ($row['id'] ?? 0);
        $name = (string) ($row['name'] ?? '');
        $phone = (string) ($row['phone'] ?? '');

        return [
            'externalId' => $id,
            'urlPath' => $this->detailPath('consultants', $locale, $id, $name),
            'name' => $name,
            'role' => $this->roleLabel((string) ($row['role'] ?? '')),
            'image' => $this->catalogueImage('consultants', $row),
            'imageWebp' => '',
            'phoneHref' => $phone !== '' ? 'tel:'.preg_replace('/\D+/', '', $phone) : '',
            'phoneLabel' => $phone,
            'email' => (string) ($row['email'] ?? ''),
            'location' => (string) ($row['office_name'] ?? ''),
            'variant' => 'consultant',
        ];
    }

    /** @param  array<string, mixed>  $row */
    public function listingCard(array $row, string $locale): array
    {
        $id = (int) ($row['id'] ?? 0);
        $title = (string) ($row['title'] ?? '');
        $prefixes = config('site.corporate.listings.detail_prefixes.'.$locale, []);
        $prefix = is_array($prefixes) && isset($prefixes[0]) ? (string) $prefixes[0] : '/'.$locale.'/portfoy';
        $slug = Str::slug($title) ?: 'kayit';

        return [
            'externalId' => $id,
            'urlPath' => $prefix.'/'.$id.'/'.$slug,
            'image' => $this->catalogueImage('portfolios', $row),
            'imageWebp' => '',
            'processType' => $this->processLabel((string) ($row['type'] ?? ''), $locale),
            'adSubType' => '',
            'adTypeIcon' => '',
            'adType' => (string) ($row['property_type'] ?? ''),
            'badgeImage' => '',
            'price' => $this->money($row['price'] ?? null, (string) ($row['currency'] ?? '')),
            'title' => $title,
            'location' => (string) ($row['address'] ?? ''),
            'updatedLabel' => '',
            'features' => [],
            'detailLabel' => '',
            'style' => 'style3',
        ];
    }

    /** @return array<string, mixed>|null */
    private function one(string $path): ?array
    {
        if (! $this->configured()) {
            return null;
        }

        try {
            $body = $this->reonix->get($path);
        } catch (ReonixException $e) {
            if ($e->status !== 404) {
                Log::warning('Portal catalogue record failed.', ['path' => $path, 'status' => $e->status]);
            }

            return null;
        }

        $data = $body['data'] ?? null;

        return is_array($data) ? $data : null;
    }

    private function detailPath(string $section, string $locale, int $id, string $name): string
    {
        $template = (string) config('site.corporate.'.$section.'.detail.'.$locale, '');
        $slug = Str::slug($name) ?: 'kayit';
        if ($template === '') {
            return '/'.$locale.'/'.$id.'/'.$slug;
        }

        return str_replace(['{id}', '{slug}'], [(string) $id, $slug], $template);
    }

    private function listPath(string $section, string $locale): string
    {
        $paths = config('site.corporate.'.$section.'.lists.'.$locale, []);

        return is_array($paths) && isset($paths[0]) && is_string($paths[0]) ? $paths[0] : '/'.$locale;
    }

    /** @return array<string, string> */
    private function alternates(string $section, int $id, string $name): array
    {
        $out = [];
        foreach (['tr', 'en', 'de'] as $locale) {
            $out[$locale] = $this->detailPath($section, $locale, $id, $name);
        }

        return $out;
    }

    private function processLabel(string $type, string $locale): string
    {
        return match ($type) {
            'sale' => match ($locale) {
                'en' => 'For Sale',
                'de' => 'Zu verkaufen',
                default => 'Satılık',
            },
            'rent' => match ($locale) {
                'en' => 'For Rent',
                'de' => 'Vermietung',
                default => 'Kiralık',
            },
            default => $type,
        };
    }

    private function money(mixed $price, string $currency): string
    {
        if ($price === null || $price === '') {
            return '';
        }

        return number_format((float) $price, 0, ',', '.').($currency !== '' ? ' '.$currency : '');
    }

    /** @param  array<string, mixed>  $row */
    private function catalogueImage(string $kind, array $row): string
    {
        $id = (int) ($row['id'] ?? 0);
        $count = array_key_exists('image_count', $row)
            ? (int) $row['image_count']
            : (! empty($row['has_image']) ? 1 : 0);
        if ($id < 1 || $count < 1) {
            return '/img/catalogue-mark.svg';
        }

        return '/api/v1/catalogue/media/'.$kind.'/'.$id;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return list<array{original: string, image: string, imageWebp: string, thumb: string, caption: string}>
     */
    private function gallery(array $row): array
    {
        $id = (int) ($row['id'] ?? 0);
        $count = min(12, max(0, (int) ($row['image_count'] ?? 0)));
        $slides = [];
        for ($index = 0; $index < $count; $index++) {
            $url = '/api/v1/catalogue/media/portfolios/'.$id.'/'.$index;
            $slides[] = [
                'original' => $url,
                'image' => $url,
                'imageWebp' => '',
                'thumb' => $url,
                'caption' => '',
            ];
        }

        return $slides;
    }

    /** @return array<string, string> */
    private function formPlaceholders(string $locale): array
    {
        return match ($locale) {
            'en' => ['Subject' => 'Subject', 'FullName' => 'Name Surname', 'Email' => 'Email', 'Phone' => '', 'Message' => 'Message'],
            'de' => ['Subject' => 'Thema', 'FullName' => 'Name', 'Email' => 'Email', 'Phone' => '', 'Message' => 'Nachricht'],
            default => ['Subject' => 'Konu', 'FullName' => 'Ad Soyad', 'Email' => 'Email', 'Phone' => '', 'Message' => 'Mesaj'],
        };
    }
}
