<?php

namespace App\Support;

use App\Models\CmsArticle;
use App\Models\CmsArticleTranslation;
use App\Models\CmsChampionGroup;
use App\Models\CmsConsultant;
use App\Models\CmsConsultantTranslation;
use App\Models\CmsListPage;
use App\Models\CmsListing;
use App\Models\CmsListingTranslation;
use App\Models\CmsOffice;
use App\Models\CmsOfficeTranslation;
use App\Models\CmsPage;
use App\Models\CmsPageTranslation;
use App\Models\CmsPerson;
use App\Models\CmsPersonTranslation;
use App\Models\CmsTraining;
use App\Models\CmsTrainingTranslation;
use App\Models\LookupItem;
use App\Services\ReonixCatalogue;

/**
 * Maps a public URL to the shared Kurumsal template payload. Superadmin-created
 * rows are found by their stored url_path; the reference site's pager aliases and
 * `/id/slug` prefixes are applied on top so existing links keep working.
 */
class CorporateResolver
{
    public function resolve(string $locale, string $path, int $pageIndex = 1, string $searchText = '', array $filters = []): ?array
    {
        $path = $this->normalisePath($path);
        $pageIndex = max(1, $pageIndex);

        if ($consultant = app(ConsultantApplicationPage::class)->payload($locale, $path)) {
            return $consultant;
        }

        if ($page = $this->cmsPage($locale, $path)) {
            return $page;
        }

        if ($detail = $this->articleByPath($locale, $path)) {
            return $detail;
        }

        if ($detail = $this->trainingByPath($locale, $path)) {
            return $detail;
        }

        if ($detail = $this->listingByPath($locale, $path)) {
            return $detail;
        }

        if ($detail = $this->officeByPath($locale, $path)) {
            return $detail;
        }

        if ($detail = $this->consultantByPath($locale, $path)) {
            return $detail;
        }

        if ($person = $this->personByPath($locale, $path)) {
            return $person;
        }

        if ($list = $this->articleList($locale, $path, $pageIndex, $searchText)) {
            return $list;
        }

        if ($list = $this->trainingList($locale, $path)) {
            return $list;
        }

        if ($list = $this->listingList($locale, $path, $pageIndex, $filters)) {
            return $list;
        }

        if ($list = $this->officeList($locale, $path, $pageIndex, $filters)) {
            return $list;
        }

        if ($list = $this->consultantList($locale, $path, $pageIndex, $filters)) {
            return $list;
        }

        if ($office = $this->officeByShortSlug($locale, $path)) {
            return $office;
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

        if ($detail = $this->trainingByPrefix($locale, $path)) {
            return $detail;
        }

        if ($detail = $this->listingByPrefix($locale, $path)) {
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

        if ($translation === null) {
            $aliased = $this->cmsPageByAlias($locale, $path);
            $translation = $aliased?->translations()->where('locale', $locale)->first();
        }

        if ($translation === null || ! $translation->page?->published) {
            return null;
        }

        $page = $translation->page;
        $local = $page->translations()->where('locale', $locale)->first() ?? $translation;

        if ($page->key === 'contact') {
            return $this->contactPayload($page, $local);
        }

        if ($page->key === 'franchise') {
            return $this->franchisePayload($page, $local);
        }

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

    private function contactPayload(CmsPage $page, CmsPageTranslation $local): array
    {
        $payload = $local->payload ?? [];

        return [
            'kind' => 'contact',
            'key' => 'contact',
            'heading' => $local->heading,
            'breadcrumb' => $local->breadcrumb ?? ['heading' => $local->heading, 'trail' => []],
            'meta' => $local->meta ?? [],
            'items' => $payload['items'] ?? [],
            'kicker' => $payload['kicker'] ?? '',
            'pageHeading' => $payload['heading'] ?? '',
            'intro' => $payload['intro'] ?? '',
            'hoursHeading' => $payload['hoursHeading'] ?? '',
            'hours' => $payload['hours'] ?? [],
            'social' => $payload['social'] ?? [],
            'formTitle' => $payload['formTitle'] ?? '',
            'placeholders' => $payload['placeholders'] ?? [],
            'required' => $payload['required'] ?? [],
            'submitLabel' => $payload['submitLabel'] ?? '',
            'captchaError' => $payload['captchaError'] ?? '',
            'mapHref' => html_entity_decode((string) ($payload['mapHref'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'mapSrc' => html_entity_decode((string) ($payload['mapSrc'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'mapTitle' => $payload['mapTitle'] ?? '',
            'alternates' => $this->pageAlternates($page->id),
        ];
    }

    private function franchisePayload(CmsPage $page, CmsPageTranslation $local): array
    {
        $payload = $local->payload ?? [];

        return [
            'kind' => 'franchise',
            'key' => 'franchise',
            'heading' => $local->heading,
            'urlPath' => $local->url_path,
            'formHeading' => $payload['formHeading'] ?? '',
            'placeholders' => $payload['placeholders'] ?? [],
            'required' => $payload['required'] ?? [],
            'cities' => $payload['cities'] ?? [],
            'countyBindUrl' => $payload['countyBindUrl'] ?? '',
            'submitLabel' => $payload['submitLabel'] ?? '',
            'captchaError' => $payload['captchaError'] ?? '',
            'widgetCss' => $payload['widgetCss'] ?? '',
            'bodyHtml' => $local->body_html,
            'breadcrumb' => $local->breadcrumb ?? ['heading' => $local->heading, 'trail' => []],
            'meta' => $local->meta ?? [],
            'alternates' => $this->pageAlternates($page->id),
        ];
    }

    private function cmsPageByAlias(string $locale, string $path): ?CmsPage
    {
        foreach (['contact', 'franchise', 'terms', 'kvkk'] as $key) {
            if (! $this->pathMatches($path, config('site.corporate.'.$key.'.lists.'.$locale, []))) {
                continue;
            }

            return CmsPage::query()->where('key', $key)->where('published', true)->first();
        }

        return null;
    }

    private function trainingByPath(string $locale, string $path): ?array
    {
        $translation = CmsTrainingTranslation::query()
            ->where('url_path', $path)
            ->with('training')
            ->first();

        if ($translation === null || ! $translation->training?->published) {
            return null;
        }

        return $this->trainingDetailPayload($translation->training, $locale, $translation);
    }

    private function trainingByPrefix(string $locale, string $path): ?array
    {
        foreach (config('site.corporate.trainings.detail_prefixes.'.$locale, []) as $prefix) {
            $id = $this->idAfterPrefix($path, $prefix);
            if ($id === null) {
                continue;
            }
            $training = CmsTraining::query()->published()->where('external_id', $id)->first();
            if ($training === null) {
                continue;
            }

            return $this->trainingDetailPayload($training, $locale);
        }

        return null;
    }

    private function trainingDetailPayload(CmsTraining $training, string $locale, ?CmsTrainingTranslation $fallback = null): ?array
    {
        $translation = $training->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        $form = $translation->form ?? [];
        // Tamamlanan eğitimlerde referans sayfa ön başvuru formu basmaz; yalnızca
        // “Diğer Aktif Seminerler” listesi kalır. Form, canlı HTML’de submit düğmesi
        // olan devam eden kayıtlarda vardır.
        $hasApplicationForm = $training->group === 'ongoing'
            && trim((string) ($form['submitLabel'] ?? '')) !== '';

        return [
            'kind' => 'training-detail',
            'externalId' => $training->external_id,
            'group' => $training->group,
            'urlPath' => $translation->url_path,
            'title' => $translation->title,
            'image' => $translation->image !== '' ? $translation->image : $translation->list_image,
            'datePrefix' => $translation->date_prefix,
            'dateValue' => $translation->date_value,
            'timePrefix' => $translation->time_prefix,
            'timeValue' => $translation->time_value,
            'pricePrefix' => $translation->price_prefix,
            'priceValue' => $translation->price_value,
            'locationHeading' => $translation->location_heading,
            'locationValue' => $translation->location_value,
            'descriptionHeading' => $translation->description_heading,
            'descriptionHtml' => $translation->description_html ?? '',
            'formHeading' => $hasApplicationForm ? $translation->form_heading : '',
            'hasApplicationForm' => $hasApplicationForm,
            'form' => [
                'placeholders' => $hasApplicationForm ? ($form['placeholders'] ?? []) : [],
                'required' => $hasApplicationForm ? ($form['required'] ?? []) : [],
                'genders' => $hasApplicationForm ? ($form['genders'] ?? []) : [],
                'submitLabel' => $hasApplicationForm ? ($form['submitLabel'] ?? '') : '',
                'captchaError' => $hasApplicationForm ? ($form['captchaError'] ?? '') : '',
            ],
            'relatedHeading' => $translation->related_heading,
            'related' => $translation->related ?? [],
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->page_heading ?: $translation->title, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'alternates' => $this->trainingAlternates($training->id),
        ];
    }

    private function trainingList(string $locale, string $path): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.trainings.lists.'.$locale, []))) {
            return null;
        }

        $list = CmsListPage::query()->where('type', 'training')->where('locale', $locale)->first();
        if ($list === null) {
            return null;
        }

        $sectionsMeta = $list->sidebar['sections'] ?? [];
        $trainings = CmsTraining::query()
            ->published()
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->orderBy('position')
            ->get();

        $sections = [];
        foreach ($sectionsMeta as $section) {
            $group = $section['group'] ?? '';
            $items = $trainings
                ->where('group', $group)
                ->map(function (CmsTraining $training) {
                    $translation = $training->translations->first();

                    return [
                        'externalId' => $training->external_id,
                        'urlPath' => $translation?->card_url_path ?: ($translation?->url_path ?? ''),
                        'title' => $translation?->title ?? '',
                        'image' => $translation?->list_image ?? '',
                        'infoLines' => $translation?->info_lines ?? [],
                        'detailLabel' => $translation?->detail_label ?? '',
                    ];
                })
                ->values()
                ->all();

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
            'heading' => $list->heading,
            'detailLabel' => $list->continue_label,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'sections' => $sections,
            'alternates' => $this->listAlternates('training'),
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
        $sidebar = $list?->sidebar ?? [];
        $popular = $sidebar['popular'] ?? [];

        // The reference sidebar is a captured widget (six 85x85 thumbs), not "the
        // first N list cards". Rebuild from articles only when Superadmin has not
        // stored that widget yet.
        if (! is_array($popular) || $popular === []) {
            $popular = CmsArticle::query()
                ->published()
                ->ofType('blog')
                ->whereHas('translations', fn ($builder) => $builder->where('locale', $locale))
                ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
                ->orderBy('position')
                ->take(6)
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
        }

        return [
            'searchPlaceholder' => $sidebar['searchPlaceholder'] ?? '',
            'searchAction' => $sidebar['searchAction'] ?? ($list?->url_path ?? ''),
            'popularHeading' => $sidebar['popularHeading'] ?? '',
            'popular' => array_values($popular),
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

    private function trainingAlternates(int $trainingId): array
    {
        return CmsTrainingTranslation::query()
            ->where('cms_training_id', $trainingId)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function listingByPath(string $locale, string $path): ?array
    {
        if (app(ReonixCatalogue::class)->configured()) {
            return null;
        }

        $translation = CmsListingTranslation::query()
            ->where('url_path', $path)
            ->with('listing')
            ->first();

        if ($translation === null || ! $translation->listing?->published) {
            return null;
        }

        return $this->listingDetailPayload($translation->listing, $locale, $translation);
    }

    private function listingByPrefix(string $locale, string $path): ?array
    {
        foreach (config('site.corporate.listings.detail_prefixes.'.$locale, []) as $prefix) {
            $id = $this->idAfterPrefix($path, $prefix);
            if ($id === null) {
                continue;
            }
            if (app(ReonixCatalogue::class)->configured()) {
                return app(ReonixCatalogue::class)->listingDetail($locale, $id);
            }
            $listing = CmsListing::query()->published()->where('external_id', $id)->first();
            if ($listing === null) {
                continue;
            }

            return $this->listingDetailPayload($listing, $locale);
        }

        return null;
    }

    private function listingList(string $locale, string $path, int $pageIndex, array $filters): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.listings.lists.'.$locale, []))) {
            return null;
        }

        $remote = app(ReonixCatalogue::class)->collection('portfolios');
        if (is_array($remote)) {
            return $this->remoteListingList($locale, $path, $pageIndex, $filters, $remote);
        }

        $list = CmsListPage::query()->where('type', 'listing')->where('locale', $locale)->first();
        if ($list === null) {
            return $this->emptyListingList($locale, $path, $filters);
        }

        $perPage = max(1, $list->per_page);
        $query = CmsListing::query()
            ->published()
            ->whereHas('translations', fn ($builder) => $builder->where('locale', $locale));

        $this->applyListingFilters($query, $locale, $filters);

        $sort = $this->filterScalar($filters, 'SortingType');
        if ($sort === '1') {
            $query->orderBy('price_amount')->orderBy('list_rank');
        } elseif ($sort === '2') {
            $query->orderByDesc('price_amount')->orderBy('list_rank');
        } elseif ($sort === '3') {
            $query->orderBy('updated_on')->orderBy('list_rank');
        } elseif ($sort === '4') {
            $query->orderByDesc('updated_on')->orderBy('list_rank');
        } else {
            $query->orderBy('list_rank')->orderBy('id');
        }

        $total = (clone $query)->count();
        $totalPages = max(1, (int) ceil(max($total, 1) / $perPage));
        if ($total === 0) {
            $pageIndex = 1;
            $totalPages = 1;
        } else {
            $pageIndex = min($pageIndex, $totalPages);
        }

        $items = [];
        if ($total > 0) {
            $items = $query
                ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
                ->skip(($pageIndex - 1) * $perPage)
                ->take($perPage)
                ->get()
                ->map(fn (CmsListing $listing) => $this->listingCardPayload($listing, $locale, $listing->translations->first()))
                ->filter()
                ->values()
                ->all();
        }

        $sidebar = $list->sidebar ?? [];
        $formAction = $sidebar['formAction'] ?? $list->pager_base ?: $list->url_path;
        $queryString = $this->listingQueryString($filters);

        return [
            'kind' => 'listing-list',
            'heading' => $list->heading,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'filter' => [
                'action' => $formAction,
                'heading' => $sidebar['filterHeading'] ?? '',
                'mobileOpenLabel' => $sidebar['mobileFilterOpen'] ?? '',
                'submitLabel' => $sidebar['submitLabel'] ?? '',
                'labels' => $sidebar['labels'] ?? [],
                'placeholders' => $sidebar['placeholders'] ?? [],
                'adTypes' => $sidebar['adTypes'] ?? [],
                'sortOptions' => $sidebar['sortOptions'] ?? [],
                'bindUrls' => $sidebar['bindUrls'] ?? [],
                'values' => $this->listingFilterValues($filters),
            ],
            'foundLabel' => str_replace('{count}', (string) $total, (string) ($sidebar['foundTemplate'] ?? '{count}')),
            'emptyLabel' => $this->catalogueEmptyLabel('listings', $locale),
            'items' => $items,
            'hasResults' => $total > 0,
            'pagination' => [
                'pageIndex' => $pageIndex,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => $totalPages,
                'basePath' => $formAction,
                'searchQuery' => $queryString,
            ],
            'alternates' => $this->listAlternates('listing'),
        ];
    }

    private function listingDetailPayload(CmsListing $listing, string $locale, ?CmsListingTranslation $fallback = null): ?array
    {
        $translation = $listing->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        $detail = $translation->detail ?? [];
        $card = $translation->card ?? [];
        $agent = is_array($detail['agent'] ?? null) ? $detail['agent'] : [];
        $agent['phones'] = is_array($agent['phones'] ?? null) ? $agent['phones'] : [];
        $agent['href'] = $this->resourceUrl('consultants', $locale, $listing->consultant_id, $listing->consultant_slug);
        $agent['officeHref'] = $this->resourceUrl('offices', $locale, $listing->office_id, $listing->office_slug);

        $listPath = config('site.corporate.listings.lists.'.$locale.'.0', '/'.$locale);
        $location = $detail['locationIds'] ?? [];
        $locationLinks = [];
        foreach (['city' => 'CityId', 'county' => 'CountyIds', 'district' => 'DistrictIds'] as $key => $param) {
            $id = $location[$key.'Id'] ?? '';
            $label = $location[$key.'Label'] ?? '';
            if ($id === '' && $label === '') {
                continue;
            }
            $locationLinks[] = [
                'href' => $id !== '' ? $listPath.'?FilterDTO.'.$param.'='.rawurlencode((string) $id) : null,
                'label' => $label,
            ];
        }

        return [
            'kind' => 'listing-detail',
            'externalId' => $listing->external_id,
            'urlPath' => $translation->url_path,
            'title' => $translation->title,
            'price' => $detail['price'] ?? ($card['price'] ?? ''),
            'gallery' => $detail['gallery'] ?? [],
            'locationLinks' => $locationLinks,
            'specs' => $detail['specs'] ?? [],
            'descriptionHeading' => $detail['descriptionHeading'] ?? '',
            'descriptionHtml' => $detail['descriptionHtml'] ?? '',
            'eids' => $detail['eids'] ?? null,
            'featureGroups' => $detail['featureGroups'] ?? [],
            'map' => $detail['map'] ?? [],
            'agent' => $agent,
            'form' => $detail['form'] ?? [],
            'relatedHeading' => $detail['relatedHeading'] ?? '',
            'related' => $this->listingRelated($listing, $locale, $detail['relatedIds'] ?? []),
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->title, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'alternates' => $this->listingAlternates($listing->id),
        ];
    }

    /**
     * @param  list<int|string>  $relatedIds
     * @return list<array<string, mixed>>
     */
    private function listingRelated(CmsListing $listing, string $locale, array $relatedIds): array
    {
        $ids = [];
        foreach ($relatedIds as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $ids[] = $id;
            }
        }
        $ids = array_values(array_unique($ids));
        if ($ids === []) {
            return [];
        }

        $related = CmsListing::query()
            ->published()
            ->whereIn('external_id', $ids)
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->get()
            ->keyBy('external_id');

        $cards = [];
        foreach ($ids as $id) {
            $item = $related->get($id);
            if ($item === null) {
                continue;
            }
            $card = $this->listingCardPayload($item, $locale, $item->translations->first(), 'style6');
            if ($card !== null) {
                $cards[] = $card;
            }
        }

        return $cards;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function listingCardPayload(CmsListing $listing, string $locale, ?CmsListingTranslation $translation, string $style = 'style3'): ?array
    {
        if ($translation === null) {
            $translation = $listing->translations()->where('locale', $locale)->first();
        }
        if ($translation === null) {
            return null;
        }

        $card = $translation->card ?? [];

        return [
            'externalId' => $listing->external_id,
            'urlPath' => $card['urlPath'] ?? $translation->url_path,
            'image' => $card['image'] ?? '',
            'imageWebp' => $card['imageWebp'] ?? '',
            'processType' => $card['processType'] ?? '',
            'adSubType' => $card['adSubType'] ?? '',
            'adTypeIcon' => $card['adTypeIcon'] ?? '',
            'adType' => $card['adType'] ?? '',
            'badgeImage' => $card['badgeImage'] ?? '',
            'price' => $card['price'] ?? '',
            'title' => $card['title'] ?? $translation->title,
            'location' => $card['location'] ?? '',
            'updatedLabel' => $card['updatedLabel'] ?? '',
            'features' => $card['features'] ?? [],
            'detailLabel' => $card['detailLabel'] ?? '',
            'style' => $style,
        ];
    }

    private function applyListingFilters($query, string $locale, array $filters): void
    {
        $keyword = trim((string) $this->filterScalar($filters, 'FilterDTO.Keyword'));
        if ($keyword !== '') {
            $like = '%'.$this->escapeLike($keyword).'%';
            $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($builder) use ($locale, $like, $operator, $keyword) {
                $builder->whereHas('translations', function ($translation) use ($locale, $like, $operator) {
                    $translation->where('locale', $locale)->where('title', $operator, $like);
                });
                if (ctype_digit($keyword)) {
                    $builder->orWhere('external_id', (int) $keyword);
                }
            });
        }

        $this->whereOptional($query, 'ad_type_id', $this->filterScalar($filters, 'FilterDTO.AdTypeId'));
        $this->whereOptional($query, 'process_type_id', $this->filterScalar($filters, 'FilterDTO.ProcessTypeId'));
        $this->whereOptional($query, 'currency_id', $this->filterScalar($filters, 'FilterDTO.CurrencyId'));
        $this->whereOptional($query, 'country_id', $this->filterScalar($filters, 'FilterDTO.CountryId'));
        $this->whereOptional($query, 'city_id', $this->filterScalar($filters, 'FilterDTO.CityId'));
        $this->whereOptional($query, 'office_id', $this->filterScalar($filters, 'FilterDTO.OfficeId'));
        $this->whereOptional($query, 'consultant_id', $this->filterScalar($filters, 'FilterDTO.UserId'));

        $counties = $this->filterList($filters, 'FilterDTO.CountyIds');
        if ($counties !== []) {
            $query->whereIn('county_id', $counties);
        }
        $districts = $this->filterList($filters, 'FilterDTO.DistrictIds');
        if ($districts !== []) {
            $query->whereIn('district_id', $districts);
        }

        $minPrice = $this->filterNumber($filters, 'FilterDTO.MinPrice');
        if ($minPrice !== null) {
            $query->where('price_amount', '>=', $minPrice);
        }
        $maxPrice = $this->filterNumber($filters, 'FilterDTO.MaxPrice');
        if ($maxPrice !== null) {
            $query->where('price_amount', '<=', $maxPrice);
        }
        $minArea = $this->filterNumber($filters, 'FilterDTO.MinCleanArea');
        if ($minArea !== null) {
            $query->where('clean_area', '>=', $minArea);
        }
        $maxArea = $this->filterNumber($filters, 'FilterDTO.MaxCleanArea');
        if ($maxArea !== null) {
            $query->where('clean_area', '<=', $maxArea);
        }
    }

    private function whereOptional($query, string $column, ?string $value): void
    {
        if ($value !== null && $value !== '') {
            $query->where($column, $value);
        }
    }

    private function filterScalar(array $filters, string $key): ?string
    {
        $value = $filters[$key] ?? $filters[str_replace('.', '_', $key)] ?? null;
        if (is_array($value)) {
            $value = $value[0] ?? null;
        }

        return is_scalar($value) ? trim((string) $value) : null;
    }

    /**
     * @return list<string>
     */
    private function filterList(array $filters, string $key): array
    {
        $value = $filters[$key] ?? $filters[str_replace('.', '_', $key)] ?? null;
        if ($value === null || $value === '') {
            return [];
        }
        $items = is_array($value) ? $value : [$value];

        return array_values(array_filter(
            array_map(static fn ($item) => is_scalar($item) ? trim((string) $item) : '', $items),
            static fn (string $item) => $item !== '',
        ));
    }

    private function filterNumber(array $filters, string $key): ?int
    {
        $value = $this->filterScalar($filters, $key);
        if ($value === null || $value === '') {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $value);

        return $digits !== null && $digits !== '' ? (int) $digits : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function listingFilterValues(array $filters): array
    {
        $keys = [
            'SortingType',
            'FilterDTO.Keyword',
            'FilterDTO.AdTypeId',
            'FilterDTO.ProcessTypeId',
            'FilterDTO.MinPrice',
            'FilterDTO.MaxPrice',
            'FilterDTO.CurrencyId',
            'FilterDTO.MinCleanArea',
            'FilterDTO.MaxCleanArea',
            'FilterDTO.CountryId',
            'FilterDTO.CityId',
            'FilterDTO.CountyIds',
            'FilterDTO.DistrictIds',
            'FilterDTO.OfficeId',
            'FilterDTO.UserId',
        ];
        $values = [];
        foreach ($keys as $key) {
            if (str_ends_with($key, 'Ids')) {
                $values[$key] = $this->filterList($filters, $key);
            } else {
                $values[$key] = $this->filterScalar($filters, $key) ?? '';
            }
        }

        return $values;
    }

    private function listingQueryString(array $filters): string
    {
        $pairs = [];
        foreach ($this->listingFilterValues($filters) as $key => $value) {
            if (is_array($value)) {
                foreach ($value as $item) {
                    if ($item !== '') {
                        $pairs[] = rawurlencode($key).'='.rawurlencode($item);
                    }
                }
                continue;
            }
            if ($value !== '') {
                $pairs[] = rawurlencode($key).'='.rawurlencode((string) $value);
            }
        }

        return $pairs === [] ? '' : '&'.implode('&', $pairs);
    }

    private function officeByPath(string $locale, string $path): ?array
    {
        $prefix = preg_replace('#/\{id\}/\{slug\}$#', '', (string) config('site.corporate.offices.detail.'.$locale, ''));
        $remoteId = $prefix ? $this->idAfterPrefix($path, $prefix) : null;
        if ($remoteId !== null && app(ReonixCatalogue::class)->configured()) {
            return app(ReonixCatalogue::class)->officeDetail($locale, $remoteId);
        }

        $translation = CmsOfficeTranslation::query()
            ->where(function ($query) use ($path) {
                $query->where('url_path', $path)->orWhere('short_path', $path);
            })
            ->with('office')
            ->first();

        if ($translation === null || ! $translation->office?->published) {
            $prefix = preg_replace('#/\{id\}/\{slug\}$#', '', (string) config('site.corporate.offices.detail.'.$locale, ''));
            $id = $prefix ? $this->idAfterPrefix($path, $prefix) : null;
            if ($id === null) {
                return null;
            }
            $office = CmsOffice::query()->published()->where('external_id', $id)->first();
            if ($office === null) {
                return null;
            }

            return $this->officeDetailPayload($office, $locale);
        }

        return $this->officeDetailPayload($translation->office, $locale, $translation);
    }

    private function officeByShortSlug(string $locale, string $path): ?array
    {
        $slug = $this->lastSegment($path);
        if ($slug === '' || ! preg_match('/^[a-z0-9][a-z0-9_-]*$/i', $slug)) {
            return null;
        }
        if ($this->pathMatches($path, config('site.corporate.offices.lists.'.$locale, []))) {
            return null;
        }

        $office = CmsOffice::query()->published()->where('short_slug', $slug)->first();
        if ($office === null) {
            return null;
        }

        $expectedTr = '/tr/'.$slug;
        $expectedBare = '/'.$slug;
        $expectedLocale = '/'.$locale.'/'.$slug;
        if (! in_array($path, [$expectedTr, $expectedBare, $expectedLocale, $office->short_slug ? '/'.$office->short_slug : ''], true)) {
            $translation = $office->translations()->where('locale', $locale)->first();
            if ($translation === null || ($translation->short_path !== $path && $translation->url_path !== $path)) {
                return null;
            }
        }

        return $this->officeDetailPayload($office, $locale);
    }

    private function consultantByPath(string $locale, string $path): ?array
    {
        $prefix = preg_replace('#/\{id\}/\{slug\}$#', '', (string) config('site.corporate.consultants.detail.'.$locale, ''));
        $remoteId = $prefix ? $this->idAfterPrefix($path, $prefix) : null;
        if ($remoteId !== null && app(ReonixCatalogue::class)->configured()) {
            return app(ReonixCatalogue::class)->consultantDetail($locale, $remoteId);
        }

        $translation = CmsConsultantTranslation::query()
            ->where('url_path', $path)
            ->with('consultant')
            ->first();

        if ($translation !== null && $translation->consultant?->published) {
            return $this->consultantDetailPayload($translation->consultant, $locale, $translation);
        }

        $prefix = preg_replace('#/\{id\}/\{slug\}$#', '', (string) config('site.corporate.consultants.detail.'.$locale, ''));
        $id = $prefix ? $this->idAfterPrefix($path, $prefix) : null;
        if ($id === null) {
            return null;
        }
        $consultant = CmsConsultant::query()->published()->where('external_id', $id)->first();
        if ($consultant === null) {
            return null;
        }

        return $this->consultantDetailPayload($consultant, $locale);
    }

    private function officeList(string $locale, string $path, int $pageIndex, array $filters): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.offices.lists.'.$locale, []))) {
            return null;
        }

        $remote = app(ReonixCatalogue::class)->collection('offices');
        if (is_array($remote)) {
            return $this->remoteOfficeList($locale, $path, $pageIndex, $filters, $remote);
        }

        $list = CmsListPage::query()->where('type', 'office')->where('locale', $locale)->first();
        if ($list === null) {
            return $this->emptyOfficeList($locale, $path, $filters);
        }

        $perPage = max(1, $list->per_page);
        $query = CmsOffice::query()
            ->published()
            ->whereHas('translations', fn ($builder) => $builder->where('locale', $locale));

        $search = trim((string) ($this->filterScalar($filters, 'SearchText') ?? ''));
        if ($search !== '') {
            $like = '%'.$this->escapeLike($search).'%';
            $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->whereHas('translations', function ($translation) use ($locale, $like, $operator) {
                $translation->where('locale', $locale)->where('name', $operator, $like);
            });
        }
        $this->whereOptional($query, 'country_id', $this->filterScalar($filters, 'FilterDTO.CountryId'));
        $this->whereOptional($query, 'city_id', $this->filterScalar($filters, 'FilterDTO.CityId'));
        $this->whereOptional($query, 'county_id', $this->filterScalar($filters, 'FilterDTO.CountyId'));

        $query->orderBy('list_rank')->orderBy('id');

        $payload = $this->pagedCardList(
            $query,
            $list,
            $locale,
            $pageIndex,
            $perPage,
            $filters,
            'office-list',
            'office',
            fn (CmsOffice $office) => $this->officeCardPayload($office, $locale, $office->translations->first()),
            ['SearchText', 'FilterDTO.CountryId', 'FilterDTO.CityId', 'FilterDTO.CountyId'],
        );
        $payload['emptyLabel'] = $this->officeEmptyLabel($locale);

        return $payload;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function remoteOfficeList(string $locale, string $path, int $pageIndex, array $filters, array $rows): array
    {
        $search = mb_strtolower(trim((string) ($this->filterScalar($filters, 'SearchText') ?? '')));
        $items = [];
        foreach ($rows as $row) {
            $name = mb_strtolower((string) ($row['name'] ?? ''));
            if ($search !== '' && ! str_contains($name, $search)) {
                continue;
            }
            $items[] = app(ReonixCatalogue::class)->officeCard($row, $locale);
        }
        $payload = $this->emptyOfficeList($locale, $path, $filters);
        $foundTemplate = '{count}';
        $perPage = 18;

        $list = CmsListPage::query()->where('type', 'office')->where('locale', $locale)->first();
        if ($list !== null) {
            $sidebar = $list->sidebar ?? [];
            $payload['heading'] = $list->heading ?: $payload['heading'];
            $payload['breadcrumb'] = $list->breadcrumb ?? $payload['breadcrumb'];
            $payload['meta'] = $list->meta ?? $payload['meta'];
            foreach (['searchHeading', 'searchPlaceholder', 'submitLabel'] as $key) {
                if (($sidebar[$key] ?? '') !== '') {
                    $payload['filter'][$key] = $sidebar[$key];
                }
            }
            if (is_array($sidebar['bindUrls'] ?? null) && $sidebar['bindUrls'] !== []) {
                $payload['filter']['bindUrls'] = $sidebar['bindUrls'];
            }
            $foundTemplate = (string) ($sidebar['foundTemplate'] ?? '{count}');
            $perPage = max(1, (int) $list->per_page);
        }

        $payload = $this->pageRemote($payload, $items, $pageIndex, $perPage, (string) $payload['pagination']['basePath'], (string) $payload['pagination']['searchQuery']);
        $payload['foundLabel'] = str_replace('{count}', (string) $payload['pagination']['total'], $foundTemplate);

        return $payload;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function remoteListingList(string $locale, string $path, int $pageIndex, array $filters, array $rows): array
    {
        $search = mb_strtolower(trim((string) ($this->filterScalar($filters, 'FilterDTO.Keyword') ?? $this->filterScalar($filters, 'SearchText') ?? '')));
        $items = [];
        foreach ($rows as $row) {
            $title = mb_strtolower((string) ($row['title'] ?? ''));
            if ($search !== '' && ! str_contains($title, $search)) {
                continue;
            }
            $items[] = app(ReonixCatalogue::class)->listingCard($row, $locale);
        }
        $payload = $this->emptyListingList($locale, $path, $filters);

        return $this->pageRemote($payload, $items, $pageIndex, 12, (string) $payload['pagination']['basePath'], (string) $payload['pagination']['searchQuery']);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function remoteConsultantList(string $locale, string $path, int $pageIndex, array $filters, array $rows): array
    {
        $first = mb_strtolower(trim((string) ($this->filterScalar($filters, 'FilterDTO.Firstname') ?? '')));
        $last = mb_strtolower(trim((string) ($this->filterScalar($filters, 'FilterDTO.Lastname') ?? '')));
        $items = [];
        foreach ($rows as $row) {
            $name = mb_strtolower((string) ($row['name'] ?? ''));
            if ($first !== '' && ! str_contains($name, $first)) {
                continue;
            }
            if ($last !== '' && ! str_contains($name, $last)) {
                continue;
            }
            $items[] = app(ReonixCatalogue::class)->consultantCard($row, $locale);
        }
        $payload = $this->emptyConsultantList($locale, $path, $filters);

        return $this->pageRemote($payload, $items, $pageIndex, 18, (string) $payload['pagination']['basePath'], (string) $payload['pagination']['searchQuery']);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    private function pageRemote(array $payload, array $items, int $pageIndex, int $perPage, string $basePath, string $searchQuery): array
    {
        $total = count($items);
        $totalPages = max(1, (int) ceil($total / $perPage));
        $pageIndex = min(max(1, $pageIndex), $totalPages);
        $payload['items'] = array_values(array_slice($items, ($pageIndex - 1) * $perPage, $perPage));
        $payload['hasResults'] = $total > 0;
        $payload['foundLabel'] = (string) $total;
        $payload['pagination'] = [
            'pageIndex' => $pageIndex,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
            'basePath' => $basePath,
            'searchQuery' => $searchQuery,
        ];

        return $payload;
    }

    /**
     * A known office list URL stays a page when the catalogue has not been loaded.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function emptyOfficeList(string $locale, string $path, array $filters): array
    {
        $lists = config('site.corporate.offices.lists', []);
        $canonical = is_array($lists[$locale] ?? null) ? ($lists[$locale][0] ?? $path) : $path;
        $heading = match ($locale) {
            'en' => 'Our Offices',
            'de' => 'Unsere Büros',
            default => 'Ofislerimiz',
        };
        $keys = ['SearchText', 'FilterDTO.CountryId', 'FilterDTO.CityId', 'FilterDTO.CountyId'];
        $values = [];
        foreach ($keys as $key) {
            $values[$key] = $this->filterScalar($filters, $key) ?? '';
        }
        $alternates = [];
        foreach ($lists as $code => $paths) {
            if (is_array($paths) && isset($paths[0]) && is_string($paths[0])) {
                $alternates[$code] = $paths[0];
            }
        }

        return [
            'kind' => 'office-list',
            'heading' => $heading,
            'breadcrumb' => ['heading' => $heading, 'trail' => []],
            'meta' => ['title' => $heading],
            'filter' => [
                'action' => $canonical,
                'searchHeading' => match ($locale) {
                    'en' => 'Search office:',
                    'de' => 'Büro suchen:',
                    default => 'Ofis Ara :',
                },
                'searchPlaceholder' => match ($locale) {
                    'en' => 'Office name',
                    'de' => 'Büroname',
                    default => 'Ofis Adı',
                },
                'submitLabel' => match ($locale) {
                    'en' => 'Search',
                    'de' => 'Suchen',
                    default => 'Ara',
                },
                'placeholders' => [],
                'bindUrls' => [
                    'countries' => '/'.$locale.'/Lookup/EnteredOfficeCountries',
                    'cities' => '/'.$locale.'/Lookup/EnteredOfficeCitiesByCountryId',
                    'counties' => '/'.$locale.'/Lookup/Counties',
                ],
                'values' => $values,
                'selectedLabels' => $this->selectedFilterLabels($values, $locale),
            ],
            'foundLabel' => '',
            'emptyLabel' => $this->officeEmptyLabel($locale),
            'items' => [],
            'hasResults' => false,
            'pagination' => [
                'pageIndex' => 1,
                'perPage' => 18,
                'total' => 0,
                'totalPages' => 1,
                'basePath' => $canonical,
                'searchQuery' => $this->simpleQueryString($values),
            ],
            'alternates' => $alternates,
        ];
    }

    private function officeEmptyLabel(string $locale): string
    {
        return $this->catalogueEmptyLabel('offices', $locale);
    }

    private function catalogueEmptyLabel(string $group, string $locale): string
    {
        $key = 'messages.'.$group.'.empty';
        $label = __($key, [], $locale);

        return $label === $key ? 'Henüz eklenmiş kayıt yok.' : $label;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function emptyListingList(string $locale, string $path, array $filters): array
    {
        $canonical = $this->cataloguePath('listings', $locale, $path);
        $heading = match ($locale) {
            'en' => 'Our Portfolios',
            'de' => 'Unsere Portfolios',
            default => 'Portföylerimiz',
        };

        return [
            'kind' => 'listing-list',
            'heading' => $heading,
            'breadcrumb' => ['heading' => $heading, 'trail' => []],
            'meta' => ['title' => $heading],
            'filter' => [
                'action' => $canonical,
                'heading' => match ($locale) {
                    'en' => 'Search portfolio',
                    'de' => 'Portfolio suchen',
                    default => 'Portföy Ara',
                },
                'mobileOpenLabel' => match ($locale) {
                    'en' => 'Open filter',
                    'de' => 'Filter öffnen',
                    default => 'Portföy Filtresini Aç',
                },
                'submitLabel' => match ($locale) {
                    'en' => 'Search',
                    'de' => 'Suchen',
                    default => 'Ara',
                },
                'labels' => [],
                'placeholders' => [],
                'adTypes' => [],
                'sortOptions' => [],
                'bindUrls' => [],
                'values' => $this->listingFilterValues($filters),
            ],
            'foundLabel' => '',
            'emptyLabel' => $this->catalogueEmptyLabel('listings', $locale),
            'items' => [],
            'hasResults' => false,
            'pagination' => [
                'pageIndex' => 1,
                'perPage' => 12,
                'total' => 0,
                'totalPages' => 1,
                'basePath' => $canonical,
                'searchQuery' => $this->listingQueryString($filters),
            ],
            'alternates' => $this->catalogueAlternates('listings'),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function emptyConsultantList(string $locale, string $path, array $filters): array
    {
        $canonical = $this->cataloguePath('consultants', $locale, $path);
        $heading = match ($locale) {
            'en' => 'Our Professionals',
            'de' => 'Unsere Fachleute',
            default => 'Profesyonellerimiz',
        };
        $keys = ['FilterDTO.Firstname', 'FilterDTO.Lastname', 'FilterDTO.OfficeId', 'FilterDTO.CityId'];
        $values = [];
        foreach ($keys as $key) {
            $values[$key] = $this->filterScalar($filters, $key) ?? '';
        }

        return [
            'kind' => 'consultant-list',
            'heading' => $heading,
            'breadcrumb' => ['heading' => $heading, 'trail' => []],
            'meta' => ['title' => $heading],
            'filter' => [
                'action' => $canonical,
                'searchHeading' => match ($locale) {
                    'en' => 'Search consultant:',
                    'de' => 'Berater suchen:',
                    default => 'Danışman Ara :',
                },
                'searchPlaceholder' => '',
                'submitLabel' => match ($locale) {
                    'en' => 'Search',
                    'de' => 'Suchen',
                    default => 'Ara',
                },
                'placeholders' => [
                    'firstName' => match ($locale) {
                        'en' => 'First name',
                        'de' => 'Vorname',
                        default => 'Ad',
                    },
                    'lastName' => match ($locale) {
                        'en' => 'Last name',
                        'de' => 'Nachname',
                        default => 'Soyad',
                    },
                ],
                'bindUrls' => [
                    'offices' => '/'.$locale.'/Lookup/GetAllOffices',
                    'cities' => '/'.$locale.'/Lookup/Cities',
                ],
                'values' => $values,
                'selectedLabels' => $this->selectedFilterLabels($values, $locale),
            ],
            'foundLabel' => '',
            'emptyLabel' => $this->catalogueEmptyLabel('consultants', $locale),
            'items' => [],
            'hasResults' => false,
            'pagination' => [
                'pageIndex' => 1,
                'perPage' => 15,
                'total' => 0,
                'totalPages' => 1,
                'basePath' => $canonical,
                'searchQuery' => $this->simpleQueryString($values),
            ],
            'alternates' => $this->catalogueAlternates('consultants'),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function catalogueAlternates(string $section): array
    {
        $lists = config('site.corporate.'.$section.'.lists', []);
        $alternates = [];
        foreach ($lists as $code => $paths) {
            if (is_array($paths) && isset($paths[0]) && is_string($paths[0])) {
                $alternates[$code] = $paths[0];
            }
        }

        return $alternates;
    }

    private function cataloguePath(string $section, string $locale, string $path): string
    {
        $lists = config('site.corporate.'.$section.'.lists', []);
        $paths = $lists[$locale] ?? null;

        return is_array($paths) && isset($paths[0]) && is_string($paths[0]) ? $paths[0] : $path;
    }

    private function consultantList(string $locale, string $path, int $pageIndex, array $filters): ?array
    {
        if (! $this->pathMatches($path, config('site.corporate.consultants.lists.'.$locale, []))) {
            return null;
        }

        $remote = app(ReonixCatalogue::class)->collection('consultants');
        if (is_array($remote)) {
            return $this->remoteConsultantList($locale, $path, $pageIndex, $filters, $remote);
        }

        $list = CmsListPage::query()->where('type', 'consultant')->where('locale', $locale)->first();
        if ($list === null) {
            return $this->emptyConsultantList($locale, $path, $filters);
        }

        $perPage = max(1, $list->per_page);
        $query = CmsConsultant::query()
            ->published()
            ->whereHas('translations', fn ($builder) => $builder->where('locale', $locale));

        $first = trim((string) ($this->filterScalar($filters, 'FilterDTO.Firstname') ?? ''));
        $last = trim((string) ($this->filterScalar($filters, 'FilterDTO.Lastname') ?? ''));
        $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
        if ($first !== '') {
            $like = $this->escapeLike($first).'%';
            $query->where(function ($builder) use ($like, $operator, $locale) {
                $builder->where('first_name', $operator, $like)
                    ->orWhereHas('translations', function ($translation) use ($locale, $like, $operator) {
                        $translation->where('locale', $locale)->where('name', $operator, $like);
                    });
            });
        }
        if ($last !== '') {
            $like = $this->escapeLike($last).'%';
            $query->where(function ($builder) use ($like, $operator, $locale) {
                $builder->where('last_name', $operator, $like)
                    ->orWhereHas('translations', function ($translation) use ($locale, $like, $operator) {
                        $translation->where('locale', $locale)->where('name', $operator, '%'.$like);
                    });
            });
        }
        $this->whereOptional($query, 'office_id', $this->filterScalar($filters, 'FilterDTO.OfficeId'));
        $this->whereOptional($query, 'city_id', $this->filterScalar($filters, 'FilterDTO.CityId'));

        $query->orderBy('list_rank')->orderBy('id');

        $payload = $this->pagedCardList(
            $query,
            $list,
            $locale,
            $pageIndex,
            $perPage,
            $filters,
            'consultant-list',
            'consultant',
            fn (CmsConsultant $consultant) => $this->consultantCardPayload($consultant, $locale, $consultant->translations->first()),
            ['FilterDTO.Firstname', 'FilterDTO.Lastname', 'FilterDTO.OfficeId', 'FilterDTO.CityId'],
        );
        $payload['emptyLabel'] = $this->catalogueEmptyLabel('consultants', $locale);

        return $payload;
    }

    /**
     * @param  callable(mixed): (?array<string, mixed>)  $card
     * @param  list<string>  $filterKeys
     * @return array<string, mixed>
     */
    private function pagedCardList($query, CmsListPage $list, string $locale, int $pageIndex, int $perPage, array $filters, string $kind, string $alternateType, callable $card, array $filterKeys): array
    {
        $total = (clone $query)->count();
        $totalPages = max(1, (int) ceil(max($total, 1) / $perPage));
        if ($total === 0) {
            $pageIndex = 1;
            $totalPages = 1;
        } else {
            $pageIndex = min($pageIndex, $totalPages);
        }

        $items = [];
        if ($total > 0) {
            $items = $query
                ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
                ->skip(($pageIndex - 1) * $perPage)
                ->take($perPage)
                ->get()
                ->map($card)
                ->filter()
                ->values()
                ->all();
        }

        $sidebar = $list->sidebar ?? [];
        $formAction = $sidebar['formAction'] ?? $list->url_path;
        $values = [];
        foreach ($filterKeys as $key) {
            $values[$key] = $this->filterScalar($filters, $key) ?? '';
        }
        $queryString = $this->simpleQueryString($values);

        return [
            'kind' => $kind,
            'heading' => $list->heading,
            'breadcrumb' => $list->breadcrumb ?? ['heading' => $list->heading, 'trail' => []],
            'meta' => $list->meta ?? [],
            'filter' => [
                'action' => $formAction,
                'searchHeading' => $sidebar['searchHeading'] ?? '',
                'searchPlaceholder' => $sidebar['searchPlaceholder'] ?? '',
                'submitLabel' => $sidebar['submitLabel'] ?? '',
                'placeholders' => $sidebar['placeholders'] ?? [],
                'bindUrls' => $sidebar['bindUrls'] ?? [],
                'values' => $values,
                'selectedLabels' => $this->selectedFilterLabels($values, $locale),
            ],
            'foundLabel' => str_replace('{count}', (string) $total, (string) ($sidebar['foundTemplate'] ?? '{count}')),
            'items' => $items,
            'hasResults' => $total > 0,
            'pagination' => [
                'pageIndex' => $pageIndex,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => $totalPages,
                'basePath' => $list->pager_base ?: $formAction,
                'searchQuery' => $queryString,
            ],
            'alternates' => $this->listAlternates($alternateType),
        ];
    }

    /**
     * Maps selected lookup filter ids (office, city, …) to the visible labels
     * so the dropdown can keep showing "Akın" instead of "18140" after search.
     *
     * @param  array<string, string>  $values
     * @return array<string, string>
     */
    private function selectedFilterLabels(array $values, string $locale): array
    {
        $labels = [];
        foreach ($values as $key => $value) {
            if ($value === '') {
                continue;
            }
            $label = $this->lookupFilterLabel($key, $value, $locale);
            if ($label !== null && $label !== '') {
                $labels[$key] = $label;
            }
        }

        return $labels;
    }

    private function lookupFilterLabel(string $key, string $value, string $locale): ?string
    {
        $groups = match ($key) {
            'FilterDTO.OfficeId' => ['offices'],
            'FilterDTO.CityId' => ['cities', 'office_cities', 'consultant_cities'],
            'FilterDTO.CountryId' => ['office_countries', 'property_countries', 'consultant_countries'],
            'FilterDTO.CountyId' => ['counties'],
            default => [],
        };

        if ($groups !== []) {
            $item = LookupItem::query()
                ->whereIn('group', $groups)
                ->where('external_id', $value)
                ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
                ->first();
            $label = $item?->translations->first()?->label;
            if (is_string($label) && $label !== '') {
                return $label;
            }
        }

        if ($key === 'FilterDTO.OfficeId') {
            $office = CmsOffice::query()->where('external_id', $value)->first();

            return $office?->translations()->where('locale', $locale)->value('name');
        }

        return null;
    }

    /**
     * @param  array<string, string>  $values
     */
    private function simpleQueryString(array $values): string
    {
        $pairs = [];
        foreach ($values as $key => $value) {
            if ($value !== '') {
                $pairs[] = rawurlencode($key).'='.rawurlencode($value);
            }
        }

        return $pairs === [] ? '' : '&'.implode('&', $pairs);
    }

    private function officeDetailPayload(CmsOffice $office, string $locale, ?CmsOfficeTranslation $fallback = null): ?array
    {
        $translation = $office->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        $detail = $translation->detail ?? [];
        $card = $translation->card ?? [];
        $listPath = config('site.corporate.listings.lists.'.$locale.'.0', '/'.$locale);

        $groups = [];
        foreach ($detail['teamGroups'] ?? [] as $group) {
            $members = [];
            foreach ($group['consultantIds'] ?? [] as $consultantId) {
                $consultant = CmsConsultant::query()->published()->where('external_id', (int) $consultantId)->first();
                if ($consultant === null) {
                    continue;
                }
                $member = $this->consultantCardPayload($consultant, $locale);
                if ($member !== null) {
                    $members[] = $member;
                }
            }
            $groups[] = [
                'heading' => $group['heading'] ?? '',
                'members' => $members,
            ];
        }

        $canonical = $this->resourceUrl('offices', $locale, (string) $office->external_id, $office->short_slug);

        return [
            'kind' => 'office-detail',
            'externalId' => $office->external_id,
            'urlPath' => $translation->url_path !== '' ? $translation->url_path : $canonical,
            'shortPath' => $translation->short_path,
            'name' => $translation->name,
            'image' => $detail['image'] ?? ($card['image'] ?? ''),
            'imageWebp' => $detail['imageWebp'] ?? ($card['imageWebp'] ?? ''),
            'phoneHref' => $detail['phoneHref'] ?? ($card['phoneHref'] ?? ''),
            'phoneLabel' => $detail['phoneLabel'] ?? ($card['phoneLabel'] ?? ''),
            'email' => $detail['email'] ?? ($card['email'] ?? ''),
            'address' => $detail['address'] ?? '',
            'instagram' => $detail['instagram'] ?? ($card['instagram'] ?? ''),
            'portfoliosHref' => $listPath.'?FilterDTO.OfficeId='.$office->external_id,
            'portfoliosLabel' => $detail['portfoliosLabel'] ?? '',
            'tabs' => $detail['tabs'] ?? [],
            'teamGroups' => $groups,
            'listings' => $this->listingCardsByIds($detail['listingIds'] ?? [], $locale),
            'map' => $detail['map'] ?? [],
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->name, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'alternates' => $this->officeAlternates($office->id),
        ];
    }

    private function consultantDetailPayload(CmsConsultant $consultant, string $locale, ?CmsConsultantTranslation $fallback = null): ?array
    {
        $translation = $consultant->translations()->where('locale', $locale)->first() ?? $fallback;
        if ($translation === null) {
            return null;
        }

        $detail = $translation->detail ?? [];
        $card = $translation->card ?? [];
        $listPath = config('site.corporate.listings.lists.'.$locale.'.0', '/'.$locale);
        $officeHref = $detail['officeHref'] ?? '';
        if ($officeHref === '' && $consultant->office_id) {
            $office = CmsOffice::query()->published()->where('external_id', (int) $consultant->office_id)->first();
            $officeHref = $office ? $this->resourceUrl('offices', $locale, (string) $office->external_id, $office->short_slug) : '';
        }

        $labels = [
            'tr' => ['email' => 'Email:', 'phone' => 'Telefon:', 'office' => 'Startkey:'],
            'en' => ['email' => 'Email:', 'phone' => 'Phone:', 'office' => 'Startkey:'],
            'de' => ['email' => 'Email:', 'phone' => 'Telefon:', 'office' => 'Startkey:'],
        ];

        return [
            'kind' => 'consultant-detail',
            'externalId' => $consultant->external_id,
            'urlPath' => $translation->url_path,
            'name' => $translation->name,
            'role' => $translation->role,
            'image' => $detail['image'] ?? ($card['image'] ?? ''),
            'imageWebp' => $detail['imageWebp'] ?? ($card['imageWebp'] ?? ''),
            'email' => $detail['email'] ?? ($card['email'] ?? ''),
            'phoneHref' => $detail['phoneHref'] ?? ($card['phoneHref'] ?? ''),
            'phoneLabel' => $detail['phoneLabel'] ?? ($card['phoneLabel'] ?? ''),
            'officeHref' => $officeHref,
            'officeName' => $detail['officeName'] ?? '',
            'contactLabels' => $labels[$locale] ?? $labels['tr'],
            'tabs' => $detail['tabs'] ?? [],
            'bioHtml' => $detail['bioHtml'] ?? '',
            'listings' => $this->listingCardsByIds($detail['listingIds'] ?? [], $locale),
            'allListingsHref' => $listPath.'?FilterDTO.OfficeId='.rawurlencode((string) ($consultant->office_id ?? '')).'&FilterDTO.UserId='.$consultant->external_id,
            'allListingsLabel' => $detail['allListingsLabel'] ?? '',
            'commentHeading' => $detail['commentHeading'] ?? '',
            'form' => $detail['form'] ?? ['placeholders' => [], 'submitLabel' => '', 'captchaError' => ''],
            'ratingLabel' => 'Yıldız',
            'breadcrumb' => $translation->breadcrumb ?? ['heading' => $translation->name, 'trail' => []],
            'meta' => $translation->meta ?? [],
            'alternates' => $this->consultantAlternates($consultant->id),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function officeCardPayload(CmsOffice $office, string $locale, ?CmsOfficeTranslation $translation = null): ?array
    {
        $translation ??= $office->translations()->where('locale', $locale)->first();
        if ($translation === null) {
            return null;
        }
        $card = $translation->card ?? [];
        $detail = $translation->detail ?? [];
        $shortPath = $translation->short_path !== '' ? $translation->short_path : ($locale === 'tr' ? '/'.$office->short_slug : '/'.$locale.'/'.$office->short_slug);

        return [
            'externalId' => $office->external_id,
            'urlPath' => $card['urlPath'] ?? $shortPath,
            'name' => $card['name'] ?? $translation->name,
            'image' => $card['image'] ?? ($detail['image'] ?? ''),
            'imageWebp' => $card['imageWebp'] ?? ($detail['imageWebp'] ?? ''),
            'phoneHref' => $card['phoneHref'] ?? ($detail['phoneHref'] ?? ''),
            'phoneLabel' => $card['phoneLabel'] ?? ($detail['phoneLabel'] ?? ''),
            'email' => $card['email'] ?? ($detail['email'] ?? ''),
            'location' => $card['location'] ?? ($office->city_label !== '' && $office->county_label !== '' ? $office->city_label.' / '.$office->county_label : $office->city_label),
            'instagram' => $card['instagram'] ?? ($detail['instagram'] ?? ''),
            'variant' => 'office',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function consultantCardPayload(CmsConsultant $consultant, string $locale, ?CmsConsultantTranslation $translation = null): ?array
    {
        $translation ??= $consultant->translations()->where('locale', $locale)->first();
        if ($translation === null) {
            return null;
        }
        $card = $translation->card ?? [];
        $href = $card['urlPath'] ?? $translation->url_path;
        if ($href === '') {
            $href = $this->resourceUrl('consultants', $locale, (string) $consultant->external_id, $consultant->slug);
        }

        return [
            'externalId' => $consultant->external_id,
            'urlPath' => $href,
            'name' => $card['name'] ?? $translation->name,
            'role' => $card['role'] ?? $translation->role,
            'image' => $card['image'] ?? '',
            'imageWebp' => $card['imageWebp'] ?? '',
            'phoneHref' => $card['phoneHref'] ?? '',
            'phoneLabel' => $card['phoneLabel'] ?? '',
            'email' => $card['email'] ?? '',
            'variant' => 'consultant',
        ];
    }

    /**
     * @param  list<int|string>  $ids
     * @return list<array<string, mixed>>
     */
    private function listingCardsByIds(array $ids, string $locale): array
    {
        $clean = [];
        foreach ($ids as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $clean[] = $id;
            }
        }
        $clean = array_values(array_unique($clean));
        if ($clean === []) {
            return [];
        }

        $listings = CmsListing::query()
            ->published()
            ->whereIn('external_id', $clean)
            ->with(['translations' => fn ($builder) => $builder->where('locale', $locale)])
            ->get()
            ->keyBy('external_id');

        $cards = [];
        foreach ($clean as $id) {
            $listing = $listings->get($id);
            if ($listing === null) {
                continue;
            }
            $card = $this->listingCardPayload($listing, $locale, $listing->translations->first(), 'style6');
            if ($card !== null) {
                $cards[] = $card;
            }
        }

        return $cards;
    }

    private function officeAlternates(int $officeId): array
    {
        $paths = CmsOfficeTranslation::query()
            ->where('cms_office_id', $officeId)
            ->get()
            ->mapWithKeys(function (CmsOfficeTranslation $translation) {
                $path = $translation->short_path !== '' ? $translation->short_path : $translation->url_path;

                return [$translation->locale => $path];
            })
            ->all();

        return $paths;
    }

    private function consultantAlternates(int $consultantId): array
    {
        return CmsConsultantTranslation::query()
            ->where('cms_consultant_id', $consultantId)
            ->pluck('url_path', 'locale')
            ->all();
    }

    private function lastSegment(string $path): string
    {
        $parts = array_values(array_filter(explode('/', $path), static fn ($part) => $part !== ''));

        return (string) ($parts[array_key_last($parts)] ?? '');
    }

    private function resourceUrl(string $kind, string $locale, ?string $id, string $slug): string
    {
        $template = config('site.corporate.'.$kind.'.detail.'.$locale);
        if (! is_string($template) || $id === null || $id === '') {
            return config('site.corporate.'.$kind.'.lists.'.$locale.'.0', '/'.$locale);
        }

        return str_replace(['{id}', '{slug}'], [$id, $slug !== '' ? $slug : $id], $template);
    }

    private function listingAlternates(int $listingId): array
    {
        return CmsListingTranslation::query()
            ->where('cms_listing_id', $listingId)
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
