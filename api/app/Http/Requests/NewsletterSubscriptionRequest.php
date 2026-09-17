<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NewsletterSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation messages follow the locale the form submitted, so the field
     * errors shown next to the homepage inputs match the page language.
     */
    protected function prepareForValidation(): void
    {
        $locale = $this->input('locale');

        if (is_string($locale) && in_array($locale, config('site.locales'), true)) {
            app()->setLocale($locale);
        }
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'locale' => ['required', 'string', Rule::in(config('site.locales'))],
            'captcha_token' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
