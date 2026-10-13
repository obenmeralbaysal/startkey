<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CaptchaVerifier
{
    /**
     * Verifies a reCAPTCHA v3 token against Google.
     *
     * Pass `$secret` to override the configured v3 secret. Verification is skipped
     * when that secret is empty, which is the local development default. A score
     * under the configured threshold, or an unexpected action, is rejected.
     */
    public function verify(?string $token, ?string $ip, ?string $secret = null, ?string $expectedAction = null): bool
    {
        $secret ??= (string) config('site.recaptcha_v3_secret');

        if ($secret === '') {
            return true;
        }

        if ($token === null || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->retry(2, 200)
                ->post(config('site.recaptcha_verify_url'), array_filter([
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]));
        } catch (\Throwable $exception) {
            Log::warning('Captcha verification request failed.', ['message' => $exception->getMessage()]);

            return false;
        }

        if (! $response->successful()) {
            Log::warning('Captcha verification returned an error status.', ['status' => $response->status()]);

            return false;
        }

        $payload = $response->json();
        if (! is_array($payload) || ($payload['success'] ?? false) !== true) {
            return false;
        }

        if ($expectedAction !== null && ($payload['action'] ?? null) !== $expectedAction) {
            Log::warning('Captcha action did not match.', ['action' => $payload['action'] ?? null]);

            return false;
        }

        if (isset($payload['score']) && is_numeric($payload['score'])) {
            $minimum = (float) config('site.recaptcha_v3_min_score', 0.5);
            if ((float) $payload['score'] < $minimum) {
                Log::warning('Captcha score was below the threshold.');

                return false;
            }
        }

        return true;
    }
}
