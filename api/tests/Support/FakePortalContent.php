<?php

namespace Tests\Support;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

class FakePortalContent
{
    /** @var array<string, list<array<string, mixed>>> */
    public static array $articles = [];

    /** @var list<array<string, mixed>> */
    public static array $trainings = [];

    /** @var list<array<string, mixed>> */
    public static array $champions = [];

    /** @var array<string, array<string, mixed>> */
    public static array $lists = [];

    public static function reset(): void
    {
        self::$articles = [];
        self::$trainings = [];
        self::$champions = [];
        self::$lists = [];
    }

    public static function install(): void
    {
        config([
            'reonix.base_url' => 'https://reonix.test',
            'reonix.portal_key' => 'test-portal-key',
        ]);
        Http::fake([
            'https://reonix.test/api/v1/integrations/portal/content/*' => function (Request $request) {
                return self::respond($request);
            },
        ]);
    }

    public static function addArticle(string $type, int $externalId, int $position, array $translations): void
    {
        $locales = [];
        foreach ($translations as $locale => $translation) {
            $locales[$locale] = [
                'title' => $translation['title'],
                'body' => $translation['body_html'],
                'document' => [
                    'url_path' => $translation['url_path'],
                    'date_label' => $translation['date_label'],
                    'category' => $translation['category'],
                    'image' => '/media/content/article.jpg',
                    'image_webp' => '/media/content/article.webp',
                    'list_image' => '/media/content/article-416x500.jpg',
                    'list_image_webp' => '/media/content/article-416x500.webp',
                    'list_width' => 416,
                    'list_height' => 500,
                    'share_label' => $translation['share_label'],
                    'breadcrumb' => ['heading' => $translation['title'], 'trail' => []],
                    'meta' => ['title' => $translation['title']],
                    'alternates' => [],
                ],
            ];
        }
        $alternates = [];
        foreach ($locales as $locale => $row) {
            $alternates[$locale] = $row['document']['url_path'];
        }
        foreach ($locales as $locale => $row) {
            $locales[$locale]['document']['alternates'] = $alternates;
        }
        self::$articles[$type][] = [
            'external_key' => (string) $externalId,
            'kind' => $type,
            'status' => 'published',
            'position' => $position,
            'locales' => $locales,
        ];
    }

    public static function addList(
        string $type,
        string $locale,
        string $urlPath,
        string $pagerBase,
        int $perPage,
        string $continueLabel,
        string $heading,
        ?array $sidebar = null,
        array $sections = [],
    ): void {
        self::$lists[$type.'.'.$locale] = [
            'heading' => $heading,
            'url_path' => $urlPath,
            'pager_base' => $pagerBase,
            'per_page' => $perPage,
            'continue_label' => $continueLabel,
            'breadcrumb' => ['heading' => $heading, 'trail' => []],
            'meta' => ['title' => $heading],
            'sidebar' => $sidebar,
            'sections' => $sections,
        ];
    }

    public static function addTraining(int $externalId, string $group, int $position, array $translations): void
    {
        $locales = [];
        $alternates = [];
        foreach ($translations as $translation) {
            $locale = $translation['locale'];
            $alternates[$locale] = $translation['url_path'];
            $locales[$locale] = [
                'title' => $translation['title'],
                'body' => $translation['description_html'],
                'document' => [
                    'url_path' => $translation['url_path'],
                    'card_url_path' => $translation['card_url_path'],
                    'list_image' => $translation['list_image'],
                    'image' => $translation['image'],
                    'info_lines' => $translation['info_lines'],
                    'detail_label' => $translation['detail_label'],
                    'date_prefix' => $translation['date_prefix'],
                    'date_value' => $translation['date_value'],
                    'time_prefix' => $translation['time_prefix'],
                    'time_value' => $translation['time_value'],
                    'price_prefix' => $translation['price_prefix'],
                    'price_value' => $translation['price_value'],
                    'location_heading' => $translation['location_heading'],
                    'location_value' => $translation['location_value'],
                    'description_heading' => $translation['description_heading'],
                    'form_heading' => $translation['form_heading'],
                    'form' => $translation['form'],
                    'related_heading' => $translation['related_heading'],
                    'related' => $translation['related'],
                    'breadcrumb' => $translation['breadcrumb'],
                    'meta' => $translation['meta'],
                ],
            ];
        }
        foreach ($locales as $locale => $row) {
            $locales[$locale]['document']['alternates'] = $alternates;
        }
        self::$trainings[] = [
            'external_key' => (string) $externalId,
            'kind' => 'training',
            'status' => 'published',
            'group' => $group,
            'position' => $position,
            'locales' => $locales,
        ];
    }

    public static function addChampion(int $position, array $translations, array $photos): void
    {
        $locales = [];
        foreach ($translations as $locale => $translation) {
            $locales[$locale] = [
                'title' => $translation['title'],
                'body' => null,
                'document' => [
                    'kicker' => $translation['kicker'],
                    'photos' => $photos,
                ],
            ];
        }
        self::$champions[] = [
            'external_key' => 'group-'.$position,
            'kind' => 'champion',
            'status' => 'published',
            'position' => $position,
            'locales' => $locales,
        ];
    }

    public static function setTrainingGroup(int $externalId, string $group): void
    {
        foreach (self::$trainings as $index => $training) {
            if ((int) $training['external_key'] === $externalId) {
                self::$trainings[$index]['group'] = $group;
            }
        }
    }

    public static function setTrainingPaymentHtml(int $externalId, string $locale, string $html): void
    {
        foreach (self::$trainings as $index => $training) {
            if ((int) $training['external_key'] !== $externalId) {
                continue;
            }
            $form = self::$trainings[$index]['locales'][$locale]['document']['form'] ?? [];
            $form['paymentHtml'] = $html;
            self::$trainings[$index]['locales'][$locale]['document']['form'] = $form;
        }
    }

    public static function respond(Request $request): \GuzzleHttp\Promise\PromiseInterface
    {
        $path = parse_url($request->url(), PHP_URL_PATH) ?? '';
        $query = [];
        parse_str(parse_url($request->url(), PHP_URL_QUERY) ?? '', $query);
        $locale = (string) ($query['locale'] ?? 'tr');
        $page = max(1, (int) ($query['page'] ?? 1));
        $search = (string) ($query['search'] ?? '');

        if (str_contains($path, '/content/articles/')) {
            $id = basename($path);
            $type = (string) ($query['type'] ?? '');
            $row = self::findArticle($type, $id, $locale);
            if ($row === null) {
                return Http::response(['error' => 'not_found'], 404);
            }

            return Http::response(['data' => $row]);
        }

        if (str_ends_with($path, '/content/articles')) {
            $type = (string) ($query['type'] ?? '');
            $list = self::$lists[$type.'.'.$locale] ?? null;

            return Http::response(self::pageArticles($type, $locale, $page, $search, $list));
        }

        if (preg_match('#/content/trainings/(\d+)$#', $path, $match)) {
            $row = self::findTraining($match[1], $locale);
            if ($row === null) {
                return Http::response(['error' => 'not_found'], 404);
            }

            return Http::response(['data' => $row]);
        }

        if (str_ends_with($path, '/content/trainings')) {
            $list = self::$lists['training.'.$locale] ?? null;

            return Http::response(self::pageRows(self::trainingRows($locale), $page, $list));
        }

        if (str_ends_with($path, '/content/champions')) {
            $list = self::$lists['champions.'.$locale] ?? self::$lists['champion.'.$locale] ?? null;

            return Http::response(self::pageRows(self::championRows($locale), $page, $list));
        }

        return Http::response(['error' => 'not_found'], 404);
    }

    /**
     * @return array<string, mixed>
     */
    private static function pageArticles(string $type, string $locale, int $page, string $search, ?array $list): array
    {
        $rows = [];
        foreach (self::$articles[$type] ?? [] as $article) {
            if (($article['status'] ?? '') !== 'published') {
                continue;
            }
            $local = $article['locales'][$locale] ?? null;
            if ($local === null) {
                continue;
            }
            if ($search !== '') {
                $haystack = ($local['title'] ?? '').' '.($local['body'] ?? '');
                if (! str_contains(mb_strtolower($haystack), mb_strtolower($search))) {
                    continue;
                }
            }
            $rows[] = self::project($article, $locale);
        }
        usort($rows, fn ($a, $b) => $a['position'] <=> $b['position']);
        $perPage = max(1, (int) ($list['per_page'] ?? 9));

        return self::slice($rows, $page, $perPage, $list, $type);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function trainingRows(string $locale): array
    {
        $rows = [];
        foreach (self::$trainings as $training) {
            if (($training['status'] ?? '') !== 'published' || ! isset($training['locales'][$locale])) {
                continue;
            }
            $rows[] = self::project($training, $locale);
        }
        usort($rows, fn ($a, $b) => $a['position'] <=> $b['position']);

        return $rows;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function championRows(string $locale): array
    {
        $rows = [];
        foreach (self::$champions as $group) {
            if (! isset($group['locales'][$locale])) {
                continue;
            }
            $rows[] = self::project($group, $locale);
        }

        return $rows;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    private static function pageRows(array $rows, int $page, ?array $list): array
    {
        $perPage = max(1, (int) ($list['per_page'] ?? 100));

        return self::slice($rows, $page, $perPage, $list, null);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    private static function slice(array $rows, int $page, int $perPage, ?array $list, ?string $kind): array
    {
        $total = count($rows);
        $last = max(1, (int) ceil($total / $perPage));
        $page = min($page, $last);
        $data = array_slice($rows, ($page - 1) * $perPage, $perPage);
        $alternates = [];
        if ($kind !== null) {
            foreach (self::$lists as $key => $row) {
                if (str_starts_with($key, $kind.'.') && ($row['url_path'] ?? '') !== '') {
                    $alternates[substr($key, strlen($kind) + 1)] = $row['url_path'];
                }
            }
        } else {
            foreach (['training', 'champions', 'champion'] as $candidate) {
                foreach (self::$lists as $key => $row) {
                    if (str_starts_with($key, $candidate.'.') && ($row['url_path'] ?? '') !== '') {
                        $alternates[substr($key, strlen($candidate) + 1)] = $row['url_path'];
                    }
                }
            }
        }
        if (is_array($list)) {
            $list['alternates'] = $alternates;
            $list['popular'] = [];
        }

        return [
            'data' => array_values($data),
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $last,
            ],
            'list' => $list,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function project(array $row, string $locale): array
    {
        $local = $row['locales'][$locale];

        return [
            'external_key' => $row['external_key'],
            'kind' => $row['kind'],
            'status' => $row['status'] ?? 'published',
            'position' => $row['position'] ?? 0,
            'group' => $row['group'] ?? null,
            'locale' => $local,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function findArticle(string $type, string $id, string $locale): ?array
    {
        foreach (self::$articles[$type] ?? [] as $article) {
            if ($article['external_key'] === $id && ($article['status'] ?? '') === 'published' && isset($article['locales'][$locale])) {
                return self::project($article, $locale);
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function findTraining(string $id, string $locale): ?array
    {
        foreach (self::$trainings as $training) {
            if ($training['external_key'] !== $id || ($training['status'] ?? '') !== 'published') {
                continue;
            }
            $use = $locale;
            if (! isset($training['locales'][$use])) {
                $use = array_key_first($training['locales']);
            }
            if ($use === null) {
                return null;
            }

            return self::project($training, $use);
        }

        return null;
    }
}
