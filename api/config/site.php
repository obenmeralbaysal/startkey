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

];
