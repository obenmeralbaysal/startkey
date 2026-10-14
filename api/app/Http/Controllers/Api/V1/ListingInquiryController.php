<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListingInquiryRequest;
use App\Models\CmsListing;
use App\Models\ListingInquiry;
use App\Services\CaptchaVerifier;
use App\Services\ReonixCatalogue;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ListingInquiryController extends Controller
{
    public function __construct(
        private readonly CaptchaVerifier $captcha,
        private readonly ReonixCatalogue $catalogue,
        private readonly ReonixClient $reonix,
    ) {
    }

    /**
     * A public listing inquiry is a Reonix demand when the portal is configured.
     * The local row remains only for a site that has no portal connection.
     */
    public function store(ListingInquiryRequest $request, int $externalId): JsonResponse
    {
        if ($this->catalogue->configured()) {
            return $this->storeRemote($request, $externalId);
        }

        $listing = CmsListing::query()->published()->where('external_id', $externalId)->first();
        if ($listing === null) {
            throw new NotFoundHttpException;
        }

        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'listing')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        $record = ListingInquiry::query()->create([
            'cms_listing_id' => $listing->id,
            'locale' => $request->string('locale')->value(),
            'subject' => trim($request->string('subject')->value()),
            'full_name' => trim($request->string('full_name')->value()),
            'email' => mb_strtolower(trim($request->string('email')->value())),
            'phone' => trim($request->string('phone')->value()),
            'message' => trim($request->string('message')->value()),
            'ip_address' => $request->ip(),
        ]);

        Log::info('Listing inquiry stored.', [
            'listing_inquiry_id' => $record->id,
            'listing_external_id' => $listing->external_id,
            'locale' => $record->locale,
        ]);

        return response()->json(['data' => ['id' => $record->id]], 201);
    }

    private function storeRemote(ListingInquiryRequest $request, int $externalId): JsonResponse
    {
        if (! $this->captcha->verify($request->input('captcha_token'), $request->ip(), null, 'listing')) {
            $message = __('messages.captcha_failed');

            return response()->json([
                'message' => $message,
                'errors' => ['captcha_token' => [$message]],
            ], 422);
        }

        try {
            $body = $this->reonix->post('catalogue/portfolios/'.$externalId.'/inquiries', [
                'full_name' => trim($request->string('full_name')->value()),
                'email' => mb_strtolower(trim($request->string('email')->value())),
                'phone' => trim($request->string('phone')->value()),
                'message' => trim($request->string('message')->value()),
                'subject' => trim($request->string('subject')->value()),
            ]);
        } catch (ReonixException $e) {
            if ($e->status === 404) {
                throw new NotFoundHttpException;
            }
            Log::warning('Listing inquiry was not stored.', ['status' => $e->status]);

            return response()->json(['message' => __('messages.portal.unavailable')], 502);
        }

        $id = is_array($body['data'] ?? null) ? ($body['data']['id'] ?? null) : null;

        return response()->json(['data' => ['id' => $id]], 201);
    }
}
