<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsArticleTranslation;
use App\Models\CmsChampionGroup;
use App\Models\CmsListPage;
use App\Models\CmsPageTranslation;
use App\Models\CmsPerson;
use App\Models\CmsPersonTranslation;

/**
 * Maps a public URL to the shared Kurumsal template payload. Superadmin-created
 * rows are found by their stored url_path; the reference site's pager aliases and
 * `/id/slug` prefixes are applied on top so existing links keep working.
 */
class CorporateResolver
{
    public function resolve(string $locale, string $path, int $pageIndex = 1, string $searchText = ''): ?array
    {
        $path = $this->normalisePath($path);
        $pageIndex = max(1, $pageIndex);

        if ($page = $this->cmsPage($locale, $path)) {
            return $page;
        }

        if ($detail = $this->articleByPath($locale, $path)) {
            return $detail;
        }

        if ($person = $this->personByPath($locale, $path)) {
            return $person;
        }

        if ($list = $this->articleList($locale, $path, $pageIndex, $searchText)) {
            return $list;
        }

        if ($people = $this->peopleList($locale, $path)) {
            return $people;
        }

        if ($champions = $this->champions($locale, $path)) {
            return $champions;
        }

        if ($detail = $this->articleByPrefix($locale, $path)) {
            return $detail;
        }

        if ($person = $this->personByPrefix($locale, $path)) {
            return $person;
        }

        return null;
    }

    public function alternatePath(string $path, string $targetLocale): string
    {
        $path = $this->normalisePath($path);
        $currentLocale = $this->localeFromPath($path) ?? config('site.default_locale');

        $resolved = $this->resolve($currentLocale, $path, 1, '');
        if ($resolved === null) {
            return '/'.$targetLocale;
        }

        $alternates = $resolved['alternates'] ?? [];
        if (isset($alternates[$targetLocale]) && is_string($alternates[$targetLocale]) && $alternates[$targetLocale] !== '') {
            return $alternates[$targetLocale];
        }

        return '/'.$targetLocale;
    }

    private function cmsPage(string $locale, string $path): ?array
    {
        $translation = CmsPageTranslation::query()
            ->where('url_path', $path)
            ->with('page')
            ->first();

        if ($translation === null || ! $translation->page?->published) {
            return null;
        }

        $page = $translation->page;
        $local = $page->translations()->where('locale', $locale)->first() ?? $translation;

        return [
            'kind' => 'cms-page',
            'key' => $page->key,
            'heading' => $local->heading,
            'bodyHtml' => $local->body_html,
            'breadcrumb' => $local->breadcrumb ?? ['heading' => $local->heading, 'trail' => []],
            'meta' => $local->meta ?? [],
            'alternates' => $this->pageAlternates($page->id),
        ];
    }

    private function articleByPath(string $locale, string $path): ?array
    {
        $translation = CmsArticleTranslation::query()
            ->where('url_path', $path)
            ->with('article')
            ->first();

        if ($translation === null || ! $translation->article?->published) {
            return null;
        }

        return $this->articleDetailPayload($translation->article, $locale, $translation);
    }

    private function articleByPrefix(string $locale, string $path): ?array
    {
        foreach (config('site.corporate.article_types') as $type => $spec) {
            foreach ($spec['detail_prefixes'][$locale] ?? [] as $prefix) {
                $id = $this->idAfterPrefix($path, $prefix);
                if ($id === null) {
                    continue;
                }
                $article = CmsArticle::query()->published()->ofType($type)->where('external_id', $id)->first();
                if ($article === null) {
                    continue;
                }

                return $this->articleDetailPayload($article, $locale);
            }
        }

        return null;
    }

    private function articleDetailPayload(CmsArticle $article, string $locale, ?CmsArticleTranslation $fallback = null): ?array
    {
        $translation = $article->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        $type = $article->type;
        $spec = config("site.corporate.article_types.{$type}", []);
        $list = CmsListPage::query()->where('type', $type)->where('locale', $locale)->first();

        return [
            'kind' => 'article-detail',
            'type' => $type,
            'layout' => $spec['detail_layout'] ?? 'wide',
            'imageAlt' => $spec['detail_image_alt'] ?? '',
            'externalId' => $article->external_id,
            'urlPath' => $translation->url_path,
            'title' => $translation->title,
            'dateLabel' => $translation->date_label,
            'category' => $translation->category,
            'bodyHtml' => $translation->body_html ?? '',
            'image' => $translation->image,
            'imageWebp' => $translation->image_webp,
            'shareLabel' => $translation->share_label,
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->title, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'sidebar' => $type === 'blog' ? $this->blogSidebar($locale, $list) : null,
            'continueLabel' => $list?->continue_label ?? '',
            'alternates' => $this->articleAlternates($article->id),
        ];
    }

    private function articleList(string $locale, string $path, int $pageIndex, string $searchText): ?array
    {
        $type = $this->listTypeForPath($locale, $path);
        if ($type === null) {
            return null;
        }

        $list = CmsListPage::query()->where('type', $type)->where('locale', $locale)->first();
        if ($list === null) {
            return null;
        }

        $spec = config("site.corporate.article_types.{$type}", []);
        $perPage = max(1, $list->per_page);

        $query = CmsArticle::query()
            ->published()
            ->ofType($type)
            ->whereHas('translations', function ($builder) use ($locale, $searchText) {
                $builder->where('locale', $locale);
                if ($searchText !== '') {
                    $like = '%'.$this->escapeLike($searchText).'%';
                    $operator = $builder->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
                    $builder->where(function ($inner) use ($like, $operator) {
                        $inner->where('title', $operator, $like)
                            ->orWhere('body_html', $operator, $like);
                    });
                }
            })
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->orderBy('position');

        $total = (clone $query)->count();
        $totalPages = max(1, (int) ceil($total / $perPage));
        $pageIndex = min($pageIndex, $totalPages);

        $items = $query
            ->skip(($pageIndex - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function (CmsArticle $article) use ($spec) {
                $translation = $article->translations->first();

                return [
                    'externalId' => $article->external_id,
                    'urlPath' => $translation?->url_path ?? '',
                    'title' => $translation?->title ?? '',
                    'dateLabel' => $translation?->date_label ?? '',
                    'category' => $translation?->category ?? '',
                    'image' => $translation?->list_image ?: ($translation?->image ?? ''),
                    'imageWebp' => $translation?->list_image_webp ?: ($translation?->image_webp ?? ''),
                    'width' => $translation?->list_width,
                    'height' => $translation?->list_height,
                    'imageAlt' => $spec['list_image_alt'] ?? '',
                ];
            })
            ->all();

        $pagerBase = $list->pager_base !== '' ? $list->pager_base : $list->url_path;
        $searchQuery = $searchText !== '' ? '&searchText='.rawurlencode($searchText) : '';

        return [
            'kind' => 'article-list',
            'type' => $type,
            'layout' => $spec['list_layout'] ?? 'three-col',
            'heading' => $list->heading,
            'continueLabel' => $list->continue_label,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'items' => $items,
            'pagination' => [
                'pageIndex' => $pageIndex,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => $totalPages,
                'basePath' => $pagerBase,
                'searchText' => $searchText,
                'searchQuery' => $searchQuery,
            ],
            'sidebar' => $type === 'blog' ? $this->blogSidebar($locale, $list) : null,
            'search' => $type === 'blog' ? [
                'action' => $list->url_path,
                'placeholder' => $list->sidebar['searchPlaceholder'] ?? '',
                'value' => $searchText,
            ] : null,
            'alternates' => $this->listAlternates($type),
        ];
    }

    private function peopleList(string $locale, string $path): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.people.lists.'.$locale, []))) {
            return null;
        }

        $list = CmsListPage::query()->where('type', 'people')->where('locale', $locale)->first();
        if ($list === null) {
            return null;
        }

        $people = CmsPerson::query()
            ->published()
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->orderBy('position')
            ->get()
            ->map(function (CmsPerson $person) {
                $translation = $person->translations->first();

                return [
                    'externalId' => $person->external_id,
                    'urlPath' => $translation?->url_path ?? '',
                    'name' => $translation?->name ?? '',
                    'role' => $translation?->role ?? '',
                    'email' => $person->email,
                    'phoneHref' => $person->phone_href,
                    'phoneLabel' => $translation?->phone_label ?? '',
                    'image' => $person->image,
                    'imageWebp' => $person->image_webp,
                ];
            })
            ->all();

        return [
            'kind' => 'people-list',
            'heading' => $list->heading,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'people' => $people,
            'alternates' => $this->listAlternates('people'),
        ];
    }

    private function personByPath(string $locale, string $path): ?array
    {
        $translation = CmsPersonTranslation::query()
            ->where('url_path', $path)
            ->with('person')
            ->first();

        if ($translation === null || ! $translation->person?->published) {
            return null;
        }

        return $this->personDetailPayload($translation->person, $locale, $translation);
    }

    private function personByPrefix(string $locale, string $path): ?array
    {
        foreach (config('site.corporate.people.detail_prefixes.'.$locale, []) as $prefix) {
            $id = $this->idAfterPrefix($path, $prefix);
            if ($id === null) {
                continue;
            }
            $person = CmsPerson::query()->published()->where('external_id', $id)->first();
            if ($person === null) {
                continue;
            }

            return $this->personDetailPayload($person, $locale);
        }

        return null;
    }

    private function personDetailPayload(CmsPerson $person, string $locale, ?CmsPersonTranslation $fallback = null): ?array
    {
        $translation = $person->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        return [
            'kind' => 'people-detail',
            'externalId' => $person->external_id,
            'urlPath' => $translation->url_path,
            'name' => $translation->name,
            'role' => $translation->role,
            'email' => $person->email,
            'emailLabel' => $translation->email_label,
            'phoneHref' => $person->phone_href,
            'phoneLabel' => $translation->phone_label,
            'phoneFieldLabel' => $translation->phone_field_label,
            'bioHeading' => $translation->bio_heading,
            'bioHtml' => $translation->bio_html ?? '',
            'image' => $person->detail_image !== '' ? $person->detail_image : $person->image,
            'imageWebp' => $person->detail_image_webp !== '' ? $person->detail_image_webp : $person->image_webp,
            'social' => $person->social ?? [],
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->name, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'alternates' => $this->personAlternates($person->id),
        ];
    }

    private function champions(string $locale, string $path): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.champions.lists.'.$locale, []))) {
            return null;
        }

        $list = CmsListPage::query()->where('type', 'champions')->where('locale', $locale)->first();
        if ($list === null) {
            return null;
        }

        $groups = CmsChampionGroup::query()
            ->published()
            ->with([
                'translations' => fn ($builder) => $builder->where('locale', $locale),
                'photos',
            ])
            ->orderBy('position')
            ->get()
            ->map(function (CmsChampionGroup $group) {
                $translation = $group->translations->first();

                return [
                    'kicker' => $translation?->kicker ?? '',
                    'title' => $translation?->title ?? '',
                    'photos' => $group->photos->map(fn ($photo) => $photo->image)->all(),
                ];
            })
            ->all();

        return [
            'kind' => 'champions',
            'heading' => $list->heading,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'groups' => $groups,
            'alternates' => $this->listAlternates('champions'),
        ];
    }

    private function blogSidebar(string $locale, ?CmsListPage $list): ?array
    {
        $popular = CmsArticle::query()
            ->published()
            ->ofType('blog')
            ->whereHas('translations', fn ($builder) => $builder->where('locale', $locale))
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->orderBy('position')
            ->take(5)
            ->get()
            ->map(function (CmsArticle $article) {
                $translation = $article->translations->first();

                return [
                    'urlPath' => $translation?->url_path ?? '',
                    'title' => $translation?->title ?? '',
                    'dateLabel' => $translation?->date_label ?? '',
                    'image' => $translation?->list_image ?: ($translation?->image ?? ''),
                    'imageWebp' => $translation?->list_image_webp ?: ($translation?->image_webp ?? ''),
                ];
            })
            ->all();

        $sidebar = $list?->sidebar ?? [];

        return [
            'searchPlaceholder' => $sidebar['searchPlaceholder'] ?? '',
            'searchAction' => $list?->url_path ?? '',
            'popularHeading' => $sidebar['popularHeading'] ?? '',
            'popular' => $popular,
        ];
    }

    private function listTypeForPath(string $locale, string $path): ?string
    {
        foreach (config('site.corporate.article_types') as $type => $spec) {
            if ($this->pathMatches($path, $spec['lists'][$locale] ?? [])) {
                return $type;
            }
        }

        $list = CmsListPage::query()
            ->where('locale', $locale)
            ->where(function ($builder) use ($path) {
                $builder->where('url_path', $path)->orWhere('pager_base', $path);
            })
            ->whereIn('type', ['news', 'announcement', 'blog'])
            ->first();

        return $list?->type;
    }

    private function pageAlternates(int $pageId): array
    {
        return CmsPageTranslation::query()
            ->where('cms_page_id', $pageId)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function articleAlternates(int $articleId): array
    {
        return CmsArticleTranslation::query()
            ->where('cms_article_id', $articleId)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function personAlternates(int $personId): array
    {
        return CmsPersonTranslation::query()
            ->where('cms_person_id', $personId)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function listAlternates(string $type): array
    {
        return CmsListPage::query()
            ->where('type', $type)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function pathMatches(string $path, array $candidates): bool
    {
        return in_array($path, $candidates, true);
    }

    private function idAfterPrefix(string $path, string $prefix): ?int
    {
        $prefix = $this->normalisePath($prefix);
        if ($path === $prefix || ! str_starts_with($path, $prefix.'/')) {
            return null;
        }
        $rest = substr($path, strlen($prefix) + 1);
        if (! preg_match('/^(\d+)(?:\/|$)/', $rest, $match)) {
            return null;
        }

        return (int) $match[1];
    }

    private function normalisePath(string $path): string
    {
        $parsed = parse_url($path, PHP_URL_PATH);
        $path = is_string($parsed) && $parsed !== '' ? $parsed : $path;
        $path = '/'.trim($path, '/');

        return $path === '//' ? '/' : $path;
    }

    private function localeFromPath(string $path): ?string
    {
        if (preg_match('#^/(tr|en|de)(?:/|$)#', $path, $match)) {
            return $match[1];
        }

        return null;
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $value);
    }
}
