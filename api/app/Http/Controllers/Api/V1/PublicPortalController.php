<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use App\Support\PortalPath;
use App\Support\PortalPayload;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PublicPortalController extends Controller
{
    public function __construct(private readonly ReonixClient $reonix) {}

    public function __invoke(Request $request, string $path): Response
    {
        $remotePath = PortalPath::customer($path);
        if ($remotePath === null || ! in_array($request->method(), ['GET', 'POST'], true)) {
            return response()->json(['message' => __('messages.portal.forbidden')], 404);
        }

        $decoded = json_decode($request->getContent(), true);

        try {
            $upstream = $this->reonix->exchange(
                strtolower($request->method()),
                $remotePath,
                $request->query(),
                $request->method() === 'GET' ? null : (is_array($decoded) ? $decoded : []),
            );
        } catch (ReonixException) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $raw = $upstream->json();
        if (! is_array($raw)) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        return response()->json(PortalPayload::scrub($raw), $upstream->status());
    }
}
