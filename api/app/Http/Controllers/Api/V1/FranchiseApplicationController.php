<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FranchiseApplicationRequest;
use App\Models\FranchiseApplication;
use App\Services\CaptchaVerifier;
use App\Services\LookupLabel;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class FranchiseApplicationController extends Controller
{
    public function __construct(
        private readonly CaptchaVerifier $captcha,
        private readonly ReonixClient $reonix,
        private readonly LookupLabel $labels,
    ) {
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

        $locale = $request->string('locale')->value();
        $city = $this->labels->find('cities', $request->integer('city_id'), $locale);
        $district = $this->labels->find('counties', $request->integer('county_id'), $locale);
        if ($city === null || $district === null) {
            $message = __('messages.portal.unavailable');

            return response()->json(['message' => $message], 422);
        }

        $first = trim($request->string('first_name')->value());
        $last = trim($request->string('last_name')->value());

        try {
            $remote = $this->reonix->post('applications', [
                'applicant_name' => trim($first.' '.$last),
                'phone' => trim($request->string('phone')->value()),
                'email' => mb_strtolower(trim($request->string('email')->value())),
                'city' => $city,
                'district' => $district,
                'notes' => $request->input('notes') ?: null,
            ]);
        } catch (ReonixException $e) {
            return response()->json(['message' => $this->message($e->error)], 422);
        }

        $record = FranchiseApplication::query()->create([
            'external_id' => $remote['data']['id'] ?? null,
            'locale' => $locale,
            'first_name' => $first,
            'last_name' => $last,
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'city_id' => $request->integer('city_id'),
            'county_id' => $request->integer('county_id'),
            'notes' => $request->input('notes') ?: null,
            'ip_address' => $request->ip(),
        ]);

        Log::info('Franchise application stored.', [
            'franchise_application_id' => $record->id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }

    private function message(string $error): string
    {
        $key = 'messages.portal.'.$error;
        $translated = __($key);

        return $translated === $key ? __('messages.portal.unavailable') : $translated;
    }
}
