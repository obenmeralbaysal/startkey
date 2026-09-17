<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrainingApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

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
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'phone' => ['required', 'string', 'max:40'],
            'gender_id' => ['required', 'integer', Rule::in([1, 2])],
            'locale' => ['required', 'string', Rule::in(config('site.locales'))],
            'captcha_token' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
