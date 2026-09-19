<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FranchiseApplicationRequest;
use App\Models\FranchiseApplication;
use App\Services\CaptchaVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class FranchiseApplicationController extends Controller
{
    public function __construct(private readonly CaptchaVerifier $captcha)
    {
    }

    /**
     * Stores a public Franchise application. The live site posts to the page URL;
     * this API keeps the same fields and does not invent a private CRM workflow.
     */
    public function store(FranchiseApplicationRequest $request): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip())) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $record = FranchiseApplication::query()->create([
            'locale' => $request->string('locale')->value(),
            'first_name' => trim($request->string('first_name')->value()),
            'last_name' => trim($request->string('last_name')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'city_id' => $request->integer('city_id'),
            'county_id' => $request->filled('county_id') ? $request->integer('county_id') : null,
            'notes' => $request->input('notes') ?: null,
            'ip_address' => $request->ip(),
        ]);

        Log::info('Franchise application stored.', [
            'franchise_application_id' => $record->id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }
}
