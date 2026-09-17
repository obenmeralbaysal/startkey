<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterSubscriptionRequest;
use App\Models\NewsletterSubscriber;
use App\Services\CaptchaVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class NewsletterController extends Controller
{
    public function __construct(private readonly CaptchaVerifier $captcha)
    {
    }

    /**
     * Stores a newsletter subscription from the homepage form.
     *
     * Re-submitting an address updates the stored name instead of creating a second
     * row, so a double submit cannot duplicate the subscriber.
     */
    public function store(NewsletterSubscriptionRequest $request): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip())) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $email = mb_strtolower(trim($request->string('email')->value()));

        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => $email],
            [
                'first_name' => trim($request->string('first_name')->value()),
                'last_name' => trim($request->string('last_name')->value()),
                'locale' => $request->string('locale')->value(),
                'ip_address' => $request->ip(),
            ],
        );

        Log::info('Newsletter subscription stored.', [
            'subscriber_id' => $subscriber->id,
            'locale' => $subscriber->locale,
            'created' => $subscriber->wasRecentlyCreated,
        ]);

        return response()->json(['data' => ['id' => $subscriber->id]], 201);
    }
}
