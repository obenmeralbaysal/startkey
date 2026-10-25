<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReonixClient;
use App\Services\ReonixException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PortalSessionController extends Controller
{
    public function __construct(private readonly ReonixClient $reonix) {}

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $this->reonix->post('forgot-password', [
                'email' => mb_strtolower($data['email']),
            ]);
        } catch (ReonixException) {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        return response()->json(['message' => __('messages.portal.password_reset_sent')]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $this->reonix->post('reset-password', [
                'token' => $data['token'],
                'password' => $data['password'],
                'password_confirmation' => $data['password_confirmation'],
            ]);
        } catch (ReonixException $e) {
            return response()->json(['message' => $this->message($e->error)], 422);
        }

        return response()->json(['message' => __('messages.portal.password_reset_done')]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        try {
            $remote = $this->reonix->post('session', [
                'email' => mb_strtolower($data['email']),
                'password' => $data['password'],
            ]);
        } catch (ReonixException $e) {
            return response()->json(['message' => $this->message($e->error)], 422);
        }

        $user = $remote['data']['user'] ?? null;
        $token = $remote['data']['token'] ?? null;
        if (! is_array($user) || ! is_string($token) || $token === '') {
            return response()->json(['message' => __('messages.portal.unavailable')], 422);
        }

        $sessionId = Str::random(40);
        Cache::put($this->cacheKey($sessionId), [
            'token' => $token,
            'user' => $user,
        ], now()->addHours(12));

        return response()->json(['data' => ['user' => $user]])
            ->cookie('startkey_portal', $sessionId, 60 * 12, '/', null, false, true, false, 'lax');
    }

    public function show(Request $request): JsonResponse
    {
        $session = $this->session($request);
        if ($session === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }

        return response()->json(['data' => ['user' => $session['user']]]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $sessionId = $request->cookie('startkey_portal');
        if (is_string($sessionId) && $sessionId !== '') {
            Cache::forget($this->cacheKey($sessionId));
        }

        return response()->json(['data' => ['ok' => true]])->withoutCookie('startkey_portal');
    }

    public function applications(Request $request): JsonResponse
    {
        return $this->proxy($request, 'get', 'applications');
    }

    public function openOffice(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'office_name' => ['required', 'string', 'max:200'],
            'package' => ['nullable', 'string', 'max:80'],
        ]);

        return $this->proxy($request, 'post', "applications/{$id}/open-office", $data);
    }

    public function packages(Request $request): JsonResponse
    {
        return $this->proxy($request, 'get', 'packages');
    }

    public function updatePackage(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'package' => ['required', 'string', 'max:80'],
        ]);

        return $this->proxy($request, 'put', "offices/{$id}/package", $data);
    }

    public function consultantApplications(Request $request): JsonResponse
    {
        return $this->proxy($request, 'get', 'consultant-applications');
    }

    public function acceptConsultant(Request $request, int $id): JsonResponse
    {
        return $this->proxy($request, 'post', "consultant-applications/{$id}/accept");
    }

    public function storeBroker(Request $request, int $id): JsonResponse
    {
        return $this->storeMember($request, $id, 'brokers');
    }

    public function storeAgent(Request $request, int $id): JsonResponse
    {
        return $this->storeMember($request, $id, 'agents');
    }

    public function officeUsers(Request $request, int $id): JsonResponse
    {
        return $this->proxy($request, 'get', "offices/{$id}/users");
    }

    public function updateOfficeUser(Request $request, int $officeId, int $userId): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:200'],
            'phone' => ['nullable', 'string', 'max:40'],
        ]);

        return $this->proxy($request, 'put', "offices/{$officeId}/users/{$userId}", $data);
    }

    public function updateOfficeUserPassword(Request $request, int $officeId, int $userId): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:200'],
        ]);

        return $this->proxy($request, 'put', "offices/{$officeId}/users/{$userId}/password", $data);
    }

    public function deskOffices(Request $request): JsonResponse
    {
        return $this->proxy($request, 'get', 'desk/offices');
    }

    public function deskStats(Request $request): JsonResponse
    {
        return $this->proxy($request, 'get', 'desk/stats');
    }

    public function officePresence(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'presence' => ['required', 'in:active,hidden,passive,archived'],
        ]);

        return $this->proxy($request, 'put', "offices/{$id}/presence", $data);
    }

    public function officeCurrency(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'currency' => ['required', 'in:TRY,USD,EUR,GBP,AZN'],
        ]);

        return $this->proxy($request, 'put', "offices/{$id}/currency", $data);
    }

    public function officeLocation(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'latitude' => ['present', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['present', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
        ]);

        return $this->proxy($request, 'put', "offices/{$id}/location", $data);
    }

    public function portfolioCatalogue(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['held' => ['required', 'boolean']]);

        return $this->proxy($request, 'post', "portfolios/{$id}/catalogue", $data);
    }

    public function storeInvoice(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:190'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:10000000'],
            'due_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        return $this->proxy($request, 'post', "offices/{$id}/invoices", $data);
    }

    public function payInvoice(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:10000000'],
        ]);

        return $this->proxy($request, 'post', "invoices/{$id}/payments", $data);
    }

    public function storeLimitRequest(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'resource' => ['required', 'in:portfolios,users,contacts,branches'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10000'],
            'note' => ['required', 'string', 'max:500'],
        ]);

        return $this->proxy($request, 'post', "offices/{$id}/limit-requests", $data);
    }

    private function storeMember(Request $request, int $id, string $kind): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:200'],
            'phone' => ['nullable', 'string', 'max:40'],
        ]);

        return $this->proxy($request, 'post', "offices/{$id}/{$kind}", $data);
    }

    private function proxy(Request $request, string $method, string $path, array $data = []): JsonResponse
    {
        $session = $this->session($request);
        if ($session === null) {
            return response()->json(['message' => __('messages.portal.forbidden')], 401);
        }

        try {
            $remote = $this->reonix->{$method}($path, $data, $session['token']);
        } catch (ReonixException $e) {
            $status = $e->error === 'forbidden' ? 403 : 422;

            return response()->json(['message' => $this->message($e->error)], $status);
        }

        return response()->json(['data' => $remote['data'] ?? null]);
    }

    private function session(Request $request): ?array
    {
        $sessionId = $request->cookie('startkey_portal');
        if (! is_string($sessionId) || $sessionId === '') {
            return null;
        }
        $session = Cache::get($this->cacheKey($sessionId));

        return is_array($session) && is_string($session['token'] ?? null) ? $session : null;
    }

    private function cacheKey(string $sessionId): string
    {
        return 'portal-session:'.$sessionId;
    }

    private function message(string $error): string
    {
        $key = 'messages.portal.'.$error;
        $translated = __($key);

        return $translated === $key ? __('messages.portal.unavailable') : $translated;
    }
}
