<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LookupItem;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class LookupController extends Controller
{
    /**
     * Options for one homepage search bar dropdown.
     *
     * The response mirrors the reference website's lookup format, because the theme
     * runtime feeds it straight into select2: a localised empty placeholder followed by
     * the options, or – when select2 sends a search term in `q` – only the matching
     * options without the placeholder.
     */
    public function __invoke(Request $request, string $endpoint): JsonResponse
    {
        $locale = Locale::fromRequest($request);
        $definition = config('site.lookups')[strtolower($endpoint)] ?? null;

        if ($definition === null) {
            throw new NotFoundHttpException(__('messages.unknown_lookup'));
        }

        $term = $request->query('q');
        $term = is_string($term) ? trim($term) : '';

        $options = $this->options($definition, $request, $locale);

        if ($term !== '') {
            return response()->json(['items' => $this->search($options, $term, $locale)]);
        }

        return response()->json([
            'items' => array_merge(
                [['id' => '', 'text' => config("site.lookup_placeholders.{$locale}", '')]],
                $options,
            ),
        ]);
    }

    private function options(array $definition, Request $request, string $locale): array
    {
        $query = LookupItem::query()
            ->where('group', $definition['group'])
            ->with(['translations' => fn ($relation) => $relation->where('locale', $locale)])
            ->orderBy('position');

        if ($definition['parent'] !== null) {
            $parentIds = $this->parentIds($request->query($definition['parent']), $definition['parent_fallback']);

            if ($parentIds === []) {
                return [];
            }

            $query->whereIn('parent_external_id', $parentIds);
        }

        return $query->get()
            ->map(fn (LookupItem $item) => [
                'id' => $item->external_id,
                'text' => $item->translations->first()?->label ?? '',
            ])
            ->all();
    }

    /**
     * Case-insensitive "contains" match, as observed on the reference website.
     *
     * The Turkish version compares with Turkish casing rules – "İstanbul" is found by
     * "ist" and "İst" but not by "IST", because "I" lowercases to "ı" – while the
     * English and German versions compare with invariant casing.
     */
    private function search(array $options, string $term, string $locale): array
    {
        $needle = $this->fold($term, $locale);

        return array_values(array_filter(
            $options,
            fn (array $option) => str_contains($this->fold($option['text'], $locale), $needle),
        ));
    }

    private function fold(string $value, string $locale): string
    {
        if ($locale === 'tr') {
            $value = str_replace(['I', 'İ'], ['ı', 'i'], $value);
        }

        return mb_strtolower($value, 'UTF-8');
    }

    /**
     * Dependent dropdowns on the listing filter send one parent id, or several
     * `countyIds=` values when more than one county is selected.
     *
     * @return list<string>
     */
    private function parentIds(mixed $parent, mixed $fallback): array
    {
        $values = [];
        if (is_array($parent)) {
            $values = $parent;
        } elseif (is_string($parent) && $parent !== '') {
            $values = [$parent];
        } elseif ($fallback !== null) {
            $values = [(string) $fallback];
        }

        return array_values(array_filter(
            array_map(static fn ($value) => is_scalar($value) ? (string) $value : '', $values),
            static fn (string $value) => $value !== '',
        ));
    }
}
