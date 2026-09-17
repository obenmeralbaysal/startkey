<?php

namespace App\Support;

use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class Locale
{
    /**
     * Resolves the request locale from the `locale` query parameter, falling back to
     * the default locale when it is absent. An unsupported value is rejected so that
     * callers cannot make the API read arbitrary translation rows.
     */
    public static function fromRequest(Request $request): string
    {
        $locale = $request->query('locale');

        if ($locale === null || $locale === '') {
            return config('site.default_locale');
        }

        if (! in_array($locale, config('site.locales'), true)) {
            app()->setLocale(config('site.default_locale'));
            throw new BadRequestHttpException(__('messages.unsupported_locale'));
        }

        app()->setLocale($locale);

        return $locale;
    }
}
