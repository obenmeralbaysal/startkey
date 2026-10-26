<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\CorporateResolver;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeminarCountController extends Controller
{
    public function __construct(private readonly CorporateResolver $corporate) {}

    public function __invoke(Request $request): JsonResponse
    {
        $locale = Locale::fromRequest($request);

        return response()->json([
            'data' => [
                'count' => $this->corporate->upcomingSeminarCount($locale),
            ],
        ]);
    }
}
