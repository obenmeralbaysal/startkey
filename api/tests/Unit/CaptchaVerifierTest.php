<?php

namespace Tests\Unit;

use App\Services\CaptchaVerifier;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CaptchaVerifierTest extends TestCase
{
    public function test_it_skips_verification_when_no_secret_is_configured(): void
    {
        config(['site.recaptcha_secret' => '']);

        $this->assertTrue(app(CaptchaVerifier::class)->verify(null, '127.0.0.1'));
    }

    public function test_it_rejects_an_empty_token_when_a_secret_is_configured(): void
    {
        config(['site.recaptcha_secret' => 'test-secret']);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('', '127.0.0.1'));
    }

    public function test_it_rejects_a_google_error_response(): void
    {
        config([
            'site.recaptcha_secret' => 'test-secret',
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => false], 200),
        ]);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('bad-token', '127.0.0.1'));
    }
}
