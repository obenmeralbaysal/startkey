<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrainingApplicationRequest;
use App\Models\CmsTraining;
use App\Models\TrainingApplication;
use App\Services\CaptchaVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TrainingApplicationController extends Controller
{
    public function __construct(private readonly CaptchaVerifier $captcha)
    {
    }

    /**
     * Stores a seminar pre-application. The live site posts to the detail URL;
     * this API keeps the same fields and does not invent a private CRM workflow.
     */
    public function store(TrainingApplicationRequest $request, int $externalId): JsonResponse
    {
        $training = CmsTraining::query()->published()->where('external_id', $externalId)->first();
        if ($training === null) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        if ($training->group !== 'ongoing') {
            return response()->json(['message' => 'Not Found'], 404);
        }

        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'training')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $record = TrainingApplication::query()->create([
            'cms_training_id' => $training->id,
            'locale' => $request->string('locale')->value(),
            'first_name' => trim($request->string('first_name')->value()),
            'last_name' => trim($request->string('last_name')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'gender_id' => $request->integer('gender_id'),
            'ip_address' => $request->ip(),
        ]);

        Log::info('Training application stored.', [
            'training_application_id' => $record->id,
            'external_id' => $training->external_id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }
}
