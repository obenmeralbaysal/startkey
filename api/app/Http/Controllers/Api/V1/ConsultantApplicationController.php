<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConsultantApplicationRequest;
use App\Models\ConsultantApplication;
use App\Services\CaptchaVerifier;
use App\Services\LookupLabel;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use Illuminate\Http\JsonResponse;

class ConsultantApplicationController extends Controller
{
    public function __construct(
        private readonly CaptchaVerifier $captcha,
        private readonly ReonixClient $reonix,
        private readonly LookupLabel $labels,
    ) {}

    public function offices(): JsonResponse
    {
        try {
            $remote = $this->reonix->get('offices');
        } catch (ReonixException) {
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => $remote['data'] ?? []]);
    }

    public function store(ConsultantApplicationRequest $request): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'consultant')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $locale = $request->string('locale')->value();
        $city = $this->labels->find('cities', $request->integer('city_id'), $locale);
        if ($city === null) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }
        $district = $request->filled('county_id')
            ? $this->labels->find('counties', $request->integer('county_id'), $locale)
            : null;

        try {
            $remote = $this->reonix->post('consultant-applications', [
                'first_name' => trim($request->string('first_name')->value()),
                'last_name' => trim($request->string('last_name')->value()),
                'email' => mb_strtolower(trim($request->string('email')->value())),
                'phone' => trim($request->string('phone')->value()),
                'city' => $city,
                'district' => $district,
                'office_id' => $request->integer('office_id'),
                'position' => $request->integer('position'),
                'notes' => $request->input('notes') ?: null,
            ]);
        } catch (ReonixException $e) {
            return response()->json(['message' => $this->message($e->error)], 422);
        }

        $record = ConsultantApplication::query()->create([
            'external_id' => $remote['data']['id'] ?? null,
            'locale' => $locale,
            'first_name' => trim($request->string('first_name')->value()),
            'last_name' => trim($request->string('last_name')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'city_id' => $request->integer('city_id'),
            'county_id' => $request->filled('county_id') ? $request->integer('county_id') : null,
            'office_id' => $request->integer('office_id'),
            'position' => $request->integer('position'),
            'notes' => $request->input('notes') ?: null,
            'ip_address' => $request->ip(),
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
