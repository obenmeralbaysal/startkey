<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported locales
    |--------------------------------------------------------------------------
    |
    | The three languages the reference website publishes. Requests asking for
    | anything else are rejected instead of silently falling back.
    |
    */

    'locales' => ['tr', 'en', 'de'],

    'default_locale' => 'tr',

    /*
    |--------------------------------------------------------------------------
    | Search bar lookup endpoints
    |--------------------------------------------------------------------------
    |
    | Maps the lookup endpoint names used by the homepage search bar to the
    | lookup group stored in the database and the query parameter that carries
    | the parent option's id for the dependent dropdowns.
    |
    | `parent_fallback` reproduces what the reference website answers when the
    | dependent dropdown is requested without a parent id: the city endpoints
    | return the cities of Türkiye, while the process type and county endpoints
    | return no options at all.
    |
    */

    'lookups' => [
        'adtypes' => ['group' => 'ad_types', 'parent' => null, 'parent_fallback' => null],
        'processtypes' => ['group' => 'process_types', 'parent' => 'adType', 'parent_fallback' => null],
        'enteredcountries' => ['group' => 'property_countries', 'parent' => null, 'parent_fallback' => null],
        'enteredcitiesbycountryid' => ['group' => 'property_cities', 'parent' => 'countryId', 'parent_fallback' => '212'],
        'enteredofficecountries' => ['group' => 'office_countries', 'parent' => null, 'parent_fallback' => null],
        'enteredofficecitiesbycountryid' => ['group' => 'office_cities', 'parent' => 'countryId', 'parent_fallback' => '212'],
        'enteredconsultantcountries' => ['group' => 'consultant_countries', 'parent' => null, 'parent_fallback' => null],
        'enteredconsultantcitiesbycountryid' => ['group' => 'consultant_cities', 'parent' => 'countryId', 'parent_fallback' => '212'],
        'counties' => ['group' => 'counties', 'parent' => 'cityId', 'parent_fallback' => null],
    ],

    /*
    |--------------------------------------------------------------------------
    | Lookup placeholder option
    |--------------------------------------------------------------------------
    |
    | Every lookup response of the reference website starts with an empty option
    | whose label is localised; the search bar shows it as the unselected state.
    |
    */

    'lookup_placeholders' => [
        'tr' => 'Seçiniz',
        'en' => 'Select',
        'de' => 'Wählen',
    ],

    /*
    |--------------------------------------------------------------------------
    | Newsletter captcha
    |--------------------------------------------------------------------------
    |
    | Google reCAPTCHA v2 secret used to verify the newsletter form. When empty
    | the verification step is skipped, which is the local development default.
    |
    */

    'recaptcha_secret' => env('RECAPTCHA_SECRET_KEY', ''),

    'recaptcha_verify_url' => env(
        'RECAPTCHA_VERIFY_URL',
        'https://www.google.com/recaptcha/api/siteverify'
    ),

    /*
    |--------------------------------------------------------------------------
    | Corporate CMS
    |--------------------------------------------------------------------------
    |
    | Shared templates for the Kurumsal section. List path aliases exist because
    | the reference website's pager on EN/DE sometimes keeps the Turkish slug.
    | Superadmin-created rows are resolved by their stored url_path; these
    | prefixes still match `/id/slug` detail URLs when the slug changes.
    |
    */

    'corporate' => [
        'article_types' => [
            'news' => [
                'list_layout' => 'three-col',
                'detail_layout' => 'wide',
                'list_image_alt' => 'News-photo',
                'detail_image_alt' => 'startkey-news',
                'lists' => [
                    'tr' => ['/tr/haberler'],
                    'en' => ['/en/news', '/en/haberler'],
                    'de' => ['/de/nachricht', '/de/haberler'],
                ],
                'detail_prefixes' => [
                    'tr' => ['/tr/haberler'],
                    'en' => ['/en/news', '/en/haberler'],
                    'de' => ['/de/nachricht', '/de/haberler'],
                ],
            ],
            'announcement' => [
                'list_layout' => 'three-col',
                'detail_layout' => 'wide',
                'list_image_alt' => 'News-photo',
                'detail_image_alt' => 'startkey-notices',
                'lists' => [
                    'tr' => ['/tr/duyurular'],
                    'en' => ['/en/announcements', '/en/duyurular'],
                    'de' => ['/de/ankundigungen', '/de/duyurular'],
                ],
                'detail_prefixes' => [
                    'tr' => ['/tr/duyuru-detay'],
                    'en' => ['/en/announcements-detail', '/en/duyuru-detay'],
                    'de' => ['/de/ankundigungen-detail', '/de/duyuru-detay'],
                ],
            ],
            'blog' => [
                'list_layout' => 'two-col-sidebar',
                'detail_layout' => 'with-sidebar',
                'list_image_alt' => 'Blog-photo',
                'detail_image_alt' => 'Blog-photo',
                'lists' => [
                    'tr' => ['/tr/bloglar'],
                    'en' => ['/en/blogs', '/en/bloglar'],
                    'de' => ['/de/blogs', '/de/bloglar'],
                ],
                'detail_prefixes' => [
                    'tr' => ['/tr/bloglar'],
                    'en' => ['/en/blogs', '/en/bloglar'],
                    'de' => ['/de/blogs', '/de/bloglar'],
                ],
            ],
        ],
        'people' => [
            'lists' => [
                'tr' => ['/tr/yonetim-kadrosu'],
                'en' => ['/en/people'],
                'de' => ['/de/people'],
            ],
            'detail_prefixes' => [
                'tr' => ['/tr/kadro-detay'],
                'en' => ['/en/people-detail', '/en/kadro-detay'],
                'de' => ['/de/people-detail', '/de/kadro-detay'],
            ],
        ],
        'champions' => [
            'lists' => [
                'tr' => ['/tr/sampiyonlar'],
                'en' => ['/en/champions'],
                'de' => ['/de/champions'],
            ],
        ],
    ],

];
