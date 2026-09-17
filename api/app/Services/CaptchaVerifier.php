<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CaptchaVerifier
{
    /**
     * Verifies a reCAPTCHA v2 token against Google. Verification is skipped when no
     * secret is configured, which is the local development default; in that case the
     * newsletter form is rendered without the widget as well.
     */
    public function verify(?string $token, ?string $ip): bool
    {
        $secret = (string) config('site.recaptcha_secret');

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

        return $response->json('success') === true;
    }
}
