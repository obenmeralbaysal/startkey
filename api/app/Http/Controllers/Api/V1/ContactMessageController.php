<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactMessageRequest;
use App\Models\ContactMessage;
use App\Services\CaptchaVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ContactMessageController extends Controller
{
    public function __construct(private readonly CaptchaVerifier $captcha)
    {
    }

    /**
     * Stores a public İletişim form submission. Delivery to mailbox/CRM is not
     * implemented; the row is kept for Superadmin until that destination exists.
     */
    public function store(ContactMessageRequest $request): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'contact')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $record = ContactMessage::query()->create([
            'locale' => $request->string('locale')->value(),
            'name' => trim($request->string('name')->value()),
            'surname' => trim($request->string('surname')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'subject' => trim($request->string('subject')->value()),
            'message' => trim($request->string('message')->value()),
            'ip_address' => $request->ip(),
        ]);

        Log::info('Contact message stored.', [
            'contact_message_id' => $record->id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }
}
