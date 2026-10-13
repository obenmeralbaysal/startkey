<?php

namespace Tests\Unit;

use App\Services\CaptchaVerifier;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CaptchaVerifierTest extends TestCase
{
    public function test_it_skips_verification_when_no_secret_is_configured(): void
    {
        config([
            'site.recaptcha_secret' => 'legacy-v2-secret',
            'site.recaptcha_v3_secret' => '',
        ]);

        $this->assertTrue(app(CaptchaVerifier::class)->verify(null, '127.0.0.1'));
    }

    public function test_it_rejects_an_empty_token_when_a_secret_is_configured(): void
    {
        config(['site.recaptcha_v3_secret' => 'test-secret']);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('', '127.0.0.1'));
    }

    public function test_it_rejects_a_google_error_response(): void
    {
        config([
            'site.recaptcha_v3_secret' => 'test-secret',
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => false], 200),
        ]);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('bad-token', '127.0.0.1'));
    }

    public function test_it_accepts_success_without_a_score(): void
    {
        config([
            'site.recaptcha_v3_secret' => 'test-secret',
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true], 200),
        ]);

        $this->assertTrue(app(CaptchaVerifier::class)->verify('valid-token', '127.0.0.1'));
    }

    public function test_it_rejects_a_v3_score_below_the_threshold(): void
    {
        config([
            'site.recaptcha_v3_min_score' => 0.5,
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success' => true,
                'score' => 0.2,
                'action' => 'newsletter',
            ], 200),
        ]);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('token', '127.0.0.1', 'test-secret', 'newsletter'));
    }

    public function test_it_rejects_a_v3_token_for_a_different_action(): void
    {
        config([
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response([
                'success' => true,
                'score' => 0.9,
                'action' => 'contact',
            ], 200),
        ]);

        $this->assertFalse(app(CaptchaVerifier::class)->verify('token', '127.0.0.1', 'test-secret', 'newsletter'));
    }
}
