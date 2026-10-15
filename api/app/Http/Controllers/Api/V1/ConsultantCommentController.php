<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConsultantCommentRequest;
use App\Models\CmsConsultant;
use App\Models\ConsultantComment;
use App\Services\CaptchaVerifier;
use App\Services\ReonixCatalogue;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ConsultantCommentController extends Controller
{
    public function __construct(private readonly CaptchaVerifier $captcha)
    {
    }

    /**
     * Stores a public consultant-detail comment. Reonix keeps a new review
     * pending until a super admin approves it.
     */
    public function store(ConsultantCommentRequest $request, int $externalId): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'comment')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $consultant = CmsConsultant::query()->published()->where('external_id', $externalId)->first();
        if ($consultant === null) {
            if (! app(ReonixCatalogue::class)->configured()) {
                throw new NotFoundHttpException;
            }
            try {
                app(ReonixClient::class)->post('catalogue/consultants/'.$externalId.'/reviews', [
                    'firstName' => trim($request->string('first_name')->value()),
                    'lastName' => trim($request->string('last_name')->value()),
                    'text' => trim($request->string('comment')->value()),
                    'rating' => is_numeric($request->input('rating')) ? (int) $request->input('rating') : null,
                ]);
            } catch (ReonixException) {
                throw new NotFoundHttpException;
            }

            return response()->json(['data' => ['stored' => true]], 201);
        }

        $rating = $request->input('rating');
        $record = ConsultantComment::query()->create([
            'cms_consultant_id' => $consultant->id,
            'locale' => $request->string('locale')->value(),
            'first_name' => trim($request->string('first_name')->value()),
            'last_name' => trim($request->string('last_name')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'rating' => is_numeric($rating) ? (int) $rating : null,
            'comment' => trim($request->string('comment')->value()),
            'ip_address' => $request->ip(),
        ]);

        Log::info('Consultant comment stored.', [
            'consultant_comment_id' => $record->id,
            'consultant_external_id' => $consultant->external_id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }
}
