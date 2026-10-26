<?php

namespace App\Services;

use App\Support\MediaPath;

/**
 * Reads StartKey news, blog, announcements, trainings and champions from Reonix.
 * These page types have no local database fallback.
 */
class ReonixContent
{
    public function __construct(private readonly ReonixClient $client) {}

    /**
     * @return array{matched: bool, payload: array<string, mixed>|null}
     */
    public function resolve(string $locale, string $path, int $page, string $search): array
    {
        $listKind = $this->listKind($locale, $path);
        if ($listKind !== null) {
            return ['matched' => true, 'payload' => $this->safe(fn () => $this->listPayload($listKind, $locale, $page, $search))];
        }

        $detail = $this->detailRef($locale, $path);
        if ($detail !== null) {
            return ['matched' => true, 'payload' => $this->safe(fn () => $this->detailPayload($detail['kind'], $detail['id'], $locale))];
        }

        return ['matched' => false, 'payload' => null];
    }

    /**
     * @return array{group: string, published: bool}|null
     */
    public function trainingGate(int $externalId): ?array
    {
        try {
            $body = $this->client->get('content/trainings/'.$externalId, ['locale' => 'tr']);
        } catch (ReonixException) {
            return null;
        }
        $data = $body['data'] ?? null;
        if (! is_array($data)) {
            return null;
        }

        return [
            'group' => (string) ($data['group'] ?? 'completed'),
            'published' => ($data['status'] ?? '') === 'published',
        ];
    }

    private function listKind(string $locale, string $path): ?string
    {
        foreach (config('site.corporate.article_types') as $type => $spec) {
            if (in_array($path, $spec['lists'][$locale] ?? [], true)) {
                return (string) $type;
            }
        }
        if (in_array($path, config('site.corporate.trainings.lists.'.$locale, []), true)) {
            return 'training';
        }
        if (in_array($path, config('site.corporate.champions.lists.'.$locale, []), true)) {
            return 'champion';
        }

        return null;
    }

    /**
     * @return array{kind: string, id: string}|null
     */
    private function detailRef(string $locale, string $path): ?array
    {
        foreach (config('site.corporate.article_types') as $type => $spec) {
            foreach ($spec['detail_prefixes'][$locale] ?? [] as $prefix) {
                $id = $this->idAfterPrefix($path, (string) $prefix);
                if ($id !== null) {
                    return ['kind' => (string) $type, 'id' => (string) $id];
                }
            }
        }
        foreach (config('site.corporate.trainings.detail_prefixes.'.$locale, []) as $prefix) {
            $id = $this->idAfterPrefix($path, (string) $prefix);
            if ($id !== null) {
                return ['kind' => 'training', 'id' => (string) $id];
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    private function collect(string $path, array $query): array
    {
        $page = 1;
        $rows = [];
        $list = null;
        $last = 1;
        do {
            $body = $this->client->get($path, $query + ['page' => $page, 'per_page' => 50]);
            foreach ($body['data'] ?? [] as $row) {
                if (is_array($row)) {
                    $rows[] = $row;
                }
            }
            if (is_array($body['list'] ?? null)) {
                $list = $body['list'];
            }
            $last = max(1, (int) ($body['meta']['last_page'] ?? 1));
            $page++;
        } while ($page <= $last && $page <= 20);

        return [
            'data' => $rows,
            'list' => $list,
            'meta' => [
                'current_page' => 1,
                'per_page' => max(1, count($rows)),
                'total' => count($rows),
                'last_page' => 1,
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function listPayload(string $kind, string $locale, int $page, string $search): ?array
    {
        if ($kind === 'training') {
            return $this->mapTrainingList($this->collect('content/trainings', ['locale' => $locale]));
        }
        if ($kind === 'champion') {
            return $this->mapChampions($this->collect('content/champions', ['locale' => $locale]));
        }

        $body = $this->client->get('content/articles', [
            'type' => $kind,
            'locale' => $locale,
            'page' => $page,
            'search' => $search,
        ]);

        return $this->mapArticleList($kind, $body, $search);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function detailPayload(string $kind, string $id, string $locale): ?array
    {
        if ($kind === 'training') {
            $body = $this->client->get('content/trainings/'.$id, ['locale' => $locale]);

            return $this->mapTrainingDetail($body['data'] ?? null);
        }

        $body = $this->client->get('content/articles/'.$id, ['type' => $kind, 'locale' => $locale]);

        return $this->mapArticleDetail($body['data'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>|null
     */
    private function mapArticleList(string $type, array $body, string $search): ?array
    {
        $list = $body['list'] ?? null;
        if (! is_array($list)) {
            return null;
        }
        $spec = config('site.corporate.article_types.'.$type, []);
        $meta = is_array($body['meta'] ?? null) ? $body['meta'] : [];
        $items = [];
        foreach ($body['data'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $locale = is_array($row['locale'] ?? null) ? $row['locale'] : [];
            $document = is_array($locale['document'] ?? null) ? $locale['document'] : [];
            $items[] = [
                'externalId' => (int) ($row['external_key'] ?? 0),
                'urlPath' => (string) ($document['url_path'] ?? ''),
                'title' => (string) ($locale['title'] ?? ''),
                'dateLabel' => (string) ($document['date_label'] ?? ''),
                'category' => (string) ($document['category'] ?? ''),
                'image' => $this->contentImage(($document['list_image'] ?? '') !== '' ? $document['list_image'] : ($document['image'] ?? '')),
                'imageWebp' => $this->contentImage(($document['list_image_webp'] ?? '') !== '' ? $document['list_image_webp'] : ($document['image_webp'] ?? '')),
                'width' => $document['list_width'] ?? null,
                'height' => $document['list_height'] ?? null,
                'imageAlt' => $spec['list_image_alt'] ?? '',
            ];
        }

        $pageIndex = (int) ($meta['current_page'] ?? 1);
        $perPage = (int) ($meta['per_page'] ?? ($list['per_page'] ?? 9));
        $total = (int) ($meta['total'] ?? count($items));
        $totalPages = (int) ($meta['last_page'] ?? 1);
        $searchQuery = $search !== '' ? '&searchText='.rawurlencode($search) : '';
        $sidebar = null;
        $searchBox = null;
        if ($type === 'blog') {
            $stored = is_array($list['sidebar'] ?? null) ? $list['sidebar'] : [];
            $popular = (isset($stored['popular']) && is_array($stored['popular']) && $stored['popular'] !== [])
                ? $stored['popular']
                : (is_array($list['popular'] ?? null) ? $list['popular'] : []);
            $sidebar = [
                'searchPlaceholder' => $stored['searchPlaceholder'] ?? '',
                'searchAction' => $stored['searchAction'] ?? (string) ($list['url_path'] ?? ''),
                'popularHeading' => $stored['popularHeading'] ?? '',
                'popular' => array_map(function ($item) {
                    if (! is_array($item)) {
                        return $item;
                    }
                    if (array_key_exists('image', $item)) {
                        $item['image'] = $this->contentImage($item['image']);
                    }
                    if (array_key_exists('imageWebp', $item)) {
                        $item['imageWebp'] = $this->contentImage($item['imageWebp']);
                    }

                    return $item;
                }, array_values($popular)),
            ];
            $searchBox = [
                'action' => (string) ($list['url_path'] ?? ''),
                'placeholder' => $stored['searchPlaceholder'] ?? '',
                'value' => $search,
            ];
        }

        return [
            'kind' => 'article-list',
            'type' => $type,
            'layout' => $spec['list_layout'] ?? 'three-col',
            'heading' => (string) ($list['heading'] ?? ''),
            'continueLabel' => (string) ($list['continue_label'] ?? ''),
            'breadcrumb' => $list['breadcrumb'] ?? ['heading' => $list['heading'] ?? '', 'trail' => []],
            'meta' => $list['meta'] ?? [],
            'items' => $items,
            'pagination' => [
                'pageIndex' => $pageIndex,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => $totalPages,
                'basePath' => (string) ($list['pager_base'] ?? $list['url_path'] ?? ''),
                'searchText' => $search,
                'searchQuery' => $searchQuery,
            ],
            'sidebar' => $sidebar,
            'search' => $searchBox,
            'alternates' => is_array($list['alternates'] ?? null) ? $list['alternates'] : [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapArticleDetail(mixed $row): ?array
    {
        if (! is_array($row)) {
            return null;
        }
        $type = (string) ($row['kind'] ?? 'news');
        $spec = config('site.corporate.article_types.'.$type, []);
        $locale = is_array($row['locale'] ?? null) ? $row['locale'] : [];
        $document = is_array($locale['document'] ?? null) ? $locale['document'] : [];

        return [
            'kind' => 'article-detail',
            'type' => $type,
            'layout' => $spec['detail_layout'] ?? 'wide',
            'imageAlt' => $spec['detail_image_alt'] ?? '',
            'externalId' => (int) ($row['external_key'] ?? 0),
            'urlPath' => (string) ($document['url_path'] ?? ''),
            'title' => (string) ($locale['title'] ?? ''),
            'dateLabel' => (string) ($document['date_label'] ?? ''),
            'category' => (string) ($document['category'] ?? ''),
            'bodyHtml' => (string) ($locale['body'] ?? ''),
            'image' => $this->contentImage($document['image'] ?? ''),
            'imageWebp' => $this->contentImage($document['image_webp'] ?? ''),
            'shareLabel' => (string) ($document['share_label'] ?? ''),
            'breadcrumb' => $document['breadcrumb'] ?? ['heading' => $locale['title'] ?? '', 'trail' => []],
            'meta' => $document['meta'] ?? [],
            'sidebar' => $type === 'blog' ? ($document['sidebar'] ?? null) : null,
            'continueLabel' => (string) ($document['continue_label'] ?? ''),
            'alternates' => is_array($document['alternates'] ?? null) ? $document['alternates'] : [],
        ];
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>|null
     */
    private function mapTrainingList(array $body): ?array
    {
        $list = $body['list'] ?? null;
        if (! is_array($list)) {
            return null;
        }
        $sections = [];
        foreach ($list['sections'] ?? [] as $section) {
            if (! is_array($section)) {
                continue;
            }
            $group = (string) ($section['group'] ?? '');
            $items = [];
            foreach ($body['data'] ?? [] as $row) {
                if (! is_array($row) || ($row['group'] ?? '') !== $group) {
                    continue;
                }
                $locale = is_array($row['locale'] ?? null) ? $row['locale'] : [];
                $document = is_array($locale['document'] ?? null) ? $locale['document'] : [];
                $items[] = [
                    'externalId' => (int) ($row['external_key'] ?? 0),
                    'urlPath' => (string) (($document['card_url_path'] ?? '') !== '' ? $document['card_url_path'] : ($document['url_path'] ?? '')),
                    'detailUrlPath' => (string) (($document['url_path'] ?? '') !== '' ? $document['url_path'] : ($document['card_url_path'] ?? '')),
                    'title' => (string) ($locale['title'] ?? ''),
                    'image' => $this->contentImage($document['list_image'] ?? ''),
                    'infoLines' => $document['info_lines'] ?? [],
                    'detailLabel' => (string) ($document['detail_label'] ?? ''),
                ];
            }
            $sections[] = [
                'group' => $group,
                'heading' => $section['heading'] ?? '',
                'headingStyle' => $section['headingStyle'] ?? '',
                'sectionStyle' => $section['sectionStyle'] ?? '',
                'items' => $items,
            ];
        }

        return [
            'kind' => 'training-list',
            'heading' => (string) ($list['heading'] ?? ''),
            'detailLabel' => (string) ($list['continue_label'] ?? ''),
            'breadcrumb' => $list['breadcrumb'] ?? ['heading' => $list['heading'] ?? '', 'trail' => []],
            'meta' => $list['meta'] ?? [],
            'sections' => $sections,
            'alternates' => is_array($list['alternates'] ?? null) ? $list['alternates'] : [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapTrainingDetail(mixed $row): ?array
    {
        if (! is_array($row)) {
            return null;
        }
        $locale = is_array($row['locale'] ?? null) ? $row['locale'] : [];
        $document = is_array($locale['document'] ?? null) ? $locale['document'] : [];
        $form = is_array($document['form'] ?? null) ? $document['form'] : [];
        $group = (string) ($row['group'] ?? 'completed');
        $hasForm = $group === 'ongoing' && trim((string) ($form['submitLabel'] ?? '')) !== '';

        return [
            'kind' => 'training-detail',
            'externalId' => (int) ($row['external_key'] ?? 0),
            'group' => $group,
            'urlPath' => (string) ($document['url_path'] ?? ''),
            'title' => (string) ($locale['title'] ?? ''),
            'image' => $this->contentImage(($document['image'] ?? '') !== '' ? $document['image'] : ($document['list_image'] ?? '')),
            'datePrefix' => (string) ($document['date_prefix'] ?? ''),
            'dateValue' => (string) ($document['date_value'] ?? ''),
            'timePrefix' => (string) ($document['time_prefix'] ?? ''),
            'timeValue' => (string) ($document['time_value'] ?? ''),
            'pricePrefix' => (string) ($document['price_prefix'] ?? ''),
            'priceValue' => (string) ($document['price_value'] ?? ''),
            'locationHeading' => (string) ($document['location_heading'] ?? ''),
            'locationValue' => (string) ($document['location_value'] ?? ''),
            'descriptionHeading' => (string) ($document['description_heading'] ?? ''),
            'descriptionHtml' => (string) ($locale['body'] ?? ''),
            'formHeading' => $hasForm ? (string) ($document['form_heading'] ?? '') : '',
            'hasApplicationForm' => $hasForm,
            'form' => [
                'placeholders' => $hasForm ? ($form['placeholders'] ?? []) : [],
                'required' => $hasForm ? ($form['required'] ?? []) : [],
                'genders' => $hasForm ? ($form['genders'] ?? []) : [],
                'submitLabel' => $hasForm ? ($form['submitLabel'] ?? '') : '',
                'captchaError' => $hasForm ? ($form['captchaError'] ?? '') : '',
                'paymentHtml' => $hasForm ? ($form['paymentHtml'] ?? '') : '',
            ],
            'relatedHeading' => (string) ($document['related_heading'] ?? ''),
            'related' => $document['related'] ?? [],
            'breadcrumb' => $document['breadcrumb'] ?? ['heading' => $locale['title'] ?? '', 'trail' => []],
            'meta' => $document['meta'] ?? [],
            'alternates' => is_array($document['alternates'] ?? null) ? $document['alternates'] : [],
        ];
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>|null
     */
    private function mapChampions(array $body): ?array
    {
        $list = $body['list'] ?? null;
        if (! is_array($list)) {
            return null;
        }
        $groups = [];
        foreach ($body['data'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $locale = is_array($row['locale'] ?? null) ? $row['locale'] : [];
            $document = is_array($locale['document'] ?? null) ? $locale['document'] : [];
            $groups[] = [
                'kicker' => (string) ($document['kicker'] ?? ''),
                'title' => (string) ($locale['title'] ?? ''),
                'photos' => array_values($document['photos'] ?? []),
            ];
        }

        return [
            'kind' => 'champions',
            'heading' => (string) ($list['heading'] ?? ''),
            'breadcrumb' => $list['breadcrumb'] ?? ['heading' => $list['heading'] ?? '', 'trail' => []],
            'meta' => $list['meta'] ?? [],
            'groups' => $groups,
            'alternates' => is_array($list['alternates'] ?? null) ? $list['alternates'] : [],
        ];
    }

    /**
     * @param  callable(): (array<string, mixed>|null)  $callback
     * @return array<string, mixed>|null
     */
    private function safe(callable $callback): ?array
    {
        try {
            return $callback();
        } catch (ReonixException) {
            return null;
        }
    }

    private function contentImage(mixed $value): string
    {
        return MediaPath::absolute(is_string($value) ? $value : '', 'content');
    }

    private function idAfterPrefix(string $path, string $prefix): ?int
    {
        $prefix = '/'.trim($prefix, '/');
        if ($prefix === '/' || $path === $prefix || ! str_starts_with($path, $prefix.'/')) {
            return null;
        }
        $rest = substr($path, strlen($prefix) + 1);
        if (! preg_match('/^(\d+)(?:\/|$)/', $rest, $match)) {
            return null;
        }

        return (int) $match[1];
    }
}
