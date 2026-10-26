<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\CorporateResolver;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CorporateController extends Controller
{
    public function __construct(private readonly CorporateResolver $resolver)
    {
    }

    /**
     * Resolves a public Kurumsal path to the shared template payload the Next.js
     * catch-all route renders. Unknown paths are 404 so the front-end can notFound().
     */
    public function show(Request $request): JsonResponse
    {
        $locale = Locale::fromRequest($request);
        $path = (string) $request->query('path', '');
        $pageIndex = (int) $request->query('page', $request->query('pageIndex', 1));
        $searchText = trim((string) $request->query('searchText', ''));

        $payload = $this->resolver->resolve($locale, $path, $pageIndex, $searchText, $this->listingFilters($request));

        if ($payload === null) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['data' => $payload]);
    }

    /**
     * Language-switch helper: given the current public path, return the equivalent
     * URL in the requested locale, or that locale's homepage when none exists.
     */
    public function alternate(Request $request): JsonResponse
    {
        $locale = Locale::fromRequest($request);
        $path = (string) $request->query('path', '');

        return response()->json([
            'data' => [
                'urlPath' => $this->resolver->alternatePath($path, $locale),
            ],
        ]);
    }

    /**
     * Query keys the listing filter form posts, forwarded so the shared template
     * can filter/sort the CMS rows the same way the reference GET form does.
     *
     * @return array<string, mixed>
     */
    private function listingFilters(Request $request): array
    {
        $query = $request->query();
        unset($query['locale'], $query['path'], $query['pageIndex'], $query['page'], $query['searchText']);

        return is_array($query) ? $query : [];
    }
}
