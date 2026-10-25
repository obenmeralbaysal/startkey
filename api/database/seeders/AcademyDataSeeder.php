<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use App\Support\ReferenceHtml;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Loads the contact page from database/data/academy-seed.json.
 *
 * Trainings are served from Reonix. Re-running updates the contact page.
 */
class AcademyDataSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/academy-seed.json');

        if (! is_file($path)) {
            throw new RuntimeException("Academy seed data not found at {$path}.");
        }

        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            $this->seedContact($data['contact'] ?? []);
        });
    }

    private function seedContact(array $contact): void
    {
        $page = CmsPage::updateOrCreate(
            ['key' => 'contact'],
            ['published' => true, 'position' => 20],
        );

        foreach ($contact as $locale => $translation) {
            $payload = $this->rewriteDeep([
                'items' => $translation['items'] ?? [],
                'kicker' => $translation['kicker'] ?? '',
                'heading' => $translation['heading'] ?? '',
                'intro' => $translation['intro'] ?? '',
                'hoursHeading' => $translation['hoursHeading'] ?? '',
                'hours' => $translation['hours'] ?? [],
                'social' => $translation['social'] ?? [],
                'formTitle' => $translation['formTitle'] ?? '',
                'placeholders' => $translation['placeholders'] ?? [],
                'required' => $translation['required'] ?? [],
                'submitLabel' => $translation['submitLabel'] ?? '',
                'captchaError' => $translation['captchaError'] ?? '',
                'mapHref' => html_entity_decode($translation['mapHref'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'mapSrc' => html_entity_decode($translation['mapSrc'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'mapTitle' => $translation['mapTitle'] ?? '',
            ]);

            $page->translations()->updateOrCreate(
                ['locale' => $locale],
                [
                    'url_path' => $translation['urlPath'],
                    'heading' => $translation['breadcrumb']['heading'] ?? '',
                    'body_html' => '',
                    'breadcrumb' => $this->rewriteDeep($translation['breadcrumb'] ?? []),
                    'meta' => $this->rewriteDeep($translation['meta'] ?? []),
                    'payload' => $payload,
                ],
            );
        }
    }

    private function rewriteDeep(mixed $value): mixed
    {
        if (is_string($value)) {
            return ReferenceHtml::rewrite($value);
        }
        if (is_array($value)) {
            return array_map(fn ($item) => $this->rewriteDeep($item), $value);
        }

        return $value;
    }
}
