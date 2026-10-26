<?php

namespace App\Services;

use App\Support\MediaPath;
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
        $listed = $this->listed($kind);

        return $listed === null ? null : $listed['rows'];
    }

    /**
     * Catalogue list plus city/district facets. `q`, `il`, and `ilce` are forwarded
     * so Reonix can filter; an empty query keeps the previous unfiltered URL.
     *
     * @param  array<string, string>  $query
     * @return array{rows: list<array<string, mixed>>, places: list<array{city: string, districts: list<string>}>, offices: list<array{id: string, name: string}>}|null
     */
    public function listed(string $kind, array $query = []): ?array
    {
        if (! $this->configured()) {
            return null;
        }

        $params = [];
        foreach (['q', 'il', 'ilce', 'ofis'] as $key) {
            $value = mb_substr(trim((string) ($query[$key] ?? '')), 0, 80);
            if ($value !== '') {
                $params[$key] = $value;
            }
        }

        try {
            $body = $this->reonix->get('catalogue/'.$kind, $params);
        } catch (ReonixException $e) {
            Log::warning('Portal catalogue list failed.', ['kind' => $kind, 'status' => $e->status]);

            return ['rows' => [], 'places' => [], 'offices' => []];
        }

        $rows = $body['data'] ?? [];
        $offices = [];
        foreach (is_array($body['offices'] ?? null) ? $body['offices'] : [] as $office) {
            if (! is_array($office)) {
                continue;
            }
            $id = trim((string) ($office['id'] ?? ''));
            $name = trim((string) ($office['name'] ?? ''));
            if ($id !== '' && $name !== '') {
                $offices[] = ['id' => $id, 'name' => $name];
            }
        }
        $places = [];
        foreach (is_array($body['places'] ?? null) ? $body['places'] : [] as $place) {
            if (! is_array($place)) {
                continue;
            }
            $city = trim((string) ($place['city'] ?? ''));
            if ($city === '') {
                continue;
            }
            $districts = [];
            foreach (is_array($place['districts'] ?? null) ? $place['districts'] : [] as $district) {
                if (is_string($district) && trim($district) !== '') {
                    $districts[] = trim($district);
                }
            }
            $places[] = ['city' => $city, 'districts' => array_values(array_unique($districts))];
        }

        return [
            'rows' => is_array($rows) ? array_values(array_filter($rows, 'is_array')) : [],
            'places' => $places,
            'offices' => $offices,
        ];
    }

    /** @return array<string, mixed>|null */
    /** @return list<array{network: string, href: string}> */
    public function socialLinks(array $office): array
    {
        $out = [];
        foreach (is_array($office['social'] ?? null) ? $office['social'] : [] as $link) {
            $href = is_array($link) ? (string) ($link['href'] ?? '') : '';
            $network = is_array($link) ? strtolower((string) ($link['network'] ?? '')) : '';
            if ($network !== '' && preg_match('#^https?://#i', $href)) {
                $out[] = ['network' => $network, 'href' => $href];
            }
        }

        return $out;
    }

    private function instagram(array $office): string
    {
        foreach ($this->socialLinks($office) as $link) {
            if ($link['network'] === 'instagram') {
                return $link['href'];
            }
        }

        return '';
    }

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
        [$latitude, $longitude] = $this->coordinatePair($office['latitude'] ?? null, $office['longitude'] ?? null);
        $pin = ($latitude !== null && $longitude !== null) ? [
            'id' => (int) $office['id'],
            'name' => $name,
            'urlPath' => $card['urlPath'],
            'latitude' => $latitude,
            'longitude' => $longitude,
        ] : null;
        $mapQuery = $pin === null ? '' : $latitude.','.$longitude;

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
            'instagram' => $this->instagram($office),
            'social' => $this->socialLinks($office),
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
            'pin' => $pin,
            'map' => $mapQuery === '' ? [] : [
                'query' => $mapQuery,
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
                ['id' => 'tab_2', 'label' => $locale === 'tr' ? 'Portföyler' : 'Portfolios'],
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
            'location' => $this->cardLocation((string) ($row['address'] ?? '')) ?: trim((string) ($row['city'] ?? '').(((string) ($row['district'] ?? '')) !== '' ? ' / '.$row['district'] : '')),
            'variant' => 'office',
            'badges' => $this->badges($row),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $consultants
     * @return list<array{heading: string, members: list<array<string, mixed>>}>
     */
    private function teamGroups(array $consultants, string $locale): array
    {
        $buckets = ['broker' => [], 'professional' => []];
        foreach ($consultants as $row) {
            if (! is_array($row)) {
                continue;
            }
            $role = (string) ($row['role'] ?? '');
            $key = $role === 'agent' ? 'professional' : 'broker';
            $buckets[$key][] = $this->consultantCard($row, $locale);
        }

        $headings = [
            'broker' => match ($locale) {
                'de' => 'MAKLER/EIGENTÜMER',
                default => 'BROKER/OWNER',
            },
            'professional' => match ($locale) {
                'en' => 'PROFESSIONALS',
                'de' => 'UNSERE PROFIS',
                default => 'PROFESYONELLER',
            },
        ];
        $groups = [];
        foreach (['broker', 'professional'] as $key) {
            if ($buckets[$key] === []) {
                continue;
            }
            $groups[] = ['heading' => $headings[$key], 'members' => $buckets[$key]];
        }

        return $groups;
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'owner', 'office_manager', 'manager' => 'Broker/Owner',
            'agent' => 'Gayrimenkul Danışmanı',
            default => $role,
        };
    }

    private function emptyListingsLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'No Advertisement Has Been Posted Yet. Click the Button to See All Our Advertisements',
            'de' => 'Es wurde noch keine Werbung gepostet. Klicken Sie auf die Schaltfläche, um alle unsere Anzeigen anzuzeigen',
            default => 'Henüz İlan Girilmemiş. Tüm İlanlarımızı Görmek İçin Butona Tıklayınız',
        };
    }

    private function seeAllLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'See All Portfolios',
            'de' => 'Alle Portfolios anzeigen',
            default => 'Tüm Portföyleri Gör',
        };
    }

    private function homePath(string $locale): string
    {
        return $locale === 'tr' ? '/' : '/'.$locale;
    }

    private function homeLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'Home',
            'de' => 'Startseite',
            default => 'Anasayfa',
        };
    }

    private function officeListLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'Our Offices',
            'de' => 'Unsere buros',
            default => 'Ofislerimiz',
        };
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
        if (($row['type'] ?? '') === 'office') {
            $officeId = (int) ($row['office_id'] ?? 0);

            return $this->officeCard(array_merge($row, ['id' => $officeId]), $locale);
        }
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
            'badges' => $this->badges($row),
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

    /**
     * Homepage map pins. Offices without a numeric latitude and longitude are skipped.
     *
     * @return list<array{id: int, name: string, urlPath: string, latitude: float, longitude: float, locationNeedsReview: bool}>
     */
    public function mapOffices(string $locale): array
    {
        $rows = $this->collection('offices');
        if (! is_array($rows)) {
            return [];
        }

        $pins = [];
        $skipped = 0;
        foreach ($rows as $row) {
            [$latitude, $longitude] = $this->coordinatePair($row['latitude'] ?? null, $row['longitude'] ?? null);
            if ($latitude === null || $longitude === null) {
                $skipped++;

                continue;
            }
            $card = $this->officeCard($row, $locale);
            $pins[] = [
                'id' => (int) $card['externalId'],
                'name' => (string) $card['name'],
                'urlPath' => (string) $card['urlPath'],
                'latitude' => $latitude,
                'longitude' => $longitude,
                'locationNeedsReview' => $this->locationNeedsReview($row),
            ];
        }

        if ($skipped > 0) {
            Log::info('Homepage map skipped offices without coordinates.', ['count' => $skipped]);
        }

        return $pins;
    }

    /** @param  array<string, mixed>  $row */
    private function locationNeedsReview(array $row): bool
    {
        $value = $row['location_needs_review'] ?? $row['locationNeedsReview'] ?? false;

        return $value === true || $value === 1 || $value === '1' || $value === 'true';
    }

    /**
     * @return array{0: ?float, 1: ?float}
     */
    private function coordinatePair(mixed $latitude, mixed $longitude): array
    {
        $lat = $this->coordinate($latitude);
        $lng = $this->coordinate($longitude);
        if ($lat === null || $lng === null || abs($lat) > 90) {
            return [null, null];
        }

        return [$lat, $lng];
    }

    private function coordinate(mixed $value): ?float
    {
        if (is_string($value)) {
            $value = trim($value);
            if (preg_match('/^-?\d+,\d+$/', $value)) {
                $value = str_replace(',', '.', $value);
            }
        }
        if (! is_numeric($value)) {
            return null;
        }
        $number = (float) $value;
        if (! is_finite($number) || $number < -180 || $number > 180 || ($number === 0.0 && trim((string) $value) === '')) {
            return null;
        }

        return $number;
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

    /**
     * @param  array<string, mixed>  $row
     * @return list<array{title: string, period: string}>
     */
    private function badges(array $row): array
    {
        $out = [];
        foreach (is_array($row['badges'] ?? null) ? $row['badges'] : [] as $badge) {
            if (! is_array($badge)) {
                continue;
            }
            $title = trim((string) ($badge['title'] ?? ''));
            if ($title === '') {
                continue;
            }
            $out[] = ['title' => $title, 'period' => trim((string) ($badge['period'] ?? ''))];
        }

        return $out;
    }

    /** @param  array<string, mixed>  $row */
    private function catalogueImage(string $kind, array $row): string
    {
        $id = (int) ($row['id'] ?? 0);
        $count = array_key_exists('image_count', $row)
            ? (int) $row['image_count']
            : (! empty($row['has_image']) ? 1 : 0);
        if ($id > 0 && $count > 0) {
            return '/api/v1/catalogue/media/'.$kind.'/'.$id;
        }

        $raw = $this->rowImage($row);
        if ($raw !== '') {
            return MediaPath::absolute($raw, match ($kind) {
                'offices' => 'officelogo',
                'consultants' => 'user',
                default => 'property',
            });
        }

        return '/img/catalogue-mark.svg';
    }

    /** @param  array<string, mixed>  $row */
    private function rowImage(array $row): string
    {
        foreach (['image', 'image_url', 'logo', 'avatar', 'avatar_path', 'photo', 'cover', 'thumbnail'] as $key) {
            $value = $row[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return '';
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
