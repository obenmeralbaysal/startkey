<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConsultantApplicationRequest extends FormRequest
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

        $county = $this->input('county_id');
        if ($county === '' || $county === null) {
            $this->merge(['county_id' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'phone' => ['required', 'string', 'max:40'],
            'city_id' => ['required', 'integer'],
            'county_id' => ['nullable', 'integer'],
            'office_id' => ['required', 'integer'],
            'position' => ['required', 'integer', Rule::in([2, 4, 5])],
            'notes' => ['nullable', 'string', 'max:5000'],
            'locale' => ['required', 'string', Rule::in(config('site.locales'))],
            'captcha_token' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
