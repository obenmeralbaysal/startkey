<?php

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NewsletterApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The newsletter limiter is IP-based; clear it so tests do not share a quota.
        \Illuminate\Support\Facades\Cache::flush();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ayşe',
            'last_name' => 'Yılmaz',
            'email' => 'ayse@example.com',
            'locale' => 'tr',
            'captcha_token' => null,
        ], $overrides);
    }

    public function test_it_stores_a_subscription(): void
    {
        $response = $this->postJson('/api/v1/newsletter', $this->validPayload());

        $response->assertCreated()->assertJsonPath('data.id', 1);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'ayse@example.com',
            'first_name' => 'Ayşe',
            'locale' => 'tr',
        ]);
    }

    public function test_re_submitting_the_same_address_is_idempotent(): void
    {
        $this->postJson('/api/v1/newsletter', $this->validPayload())->assertCreated();

        $this->postJson('/api/v1/newsletter', $this->validPayload([
            'first_name' => 'Fatma',
        ]))->assertCreated();

        $this->assertSame(1, NewsletterSubscriber::query()->count());
        $this->assertSame('Fatma', NewsletterSubscriber::query()->first()?->first_name);
    }

    public function test_it_normalises_the_email_address(): void
    {
        $this->postJson('/api/v1/newsletter', $this->validPayload([
            'email' => '  AySe@Example.COM  ',
        ]))->assertCreated();

        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'ayse@example.com']);
    }

    public function test_it_rejects_invalid_input_in_the_requested_locale(): void
    {
        $this->postJson('/api/v1/newsletter', [
            'first_name' => '',
            'last_name' => '',
            'email' => 'not-an-email',
            'locale' => 'tr',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email'])
            ->assertJsonPath('errors.first_name.0', 'Ad alanı zorunludur.')
            ->assertJsonPath('errors.email.0', 'E-posta geçerli bir e-posta adresi olmalıdır.');
    }

    public function test_it_rejects_an_unsupported_locale_value(): void
    {
        $this->postJson('/api/v1/newsletter', $this->validPayload(['locale' => 'fr']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['locale']);
    }

    public function test_it_rejects_a_missing_captcha_when_a_secret_is_configured(): void
    {
        config(['site.recaptcha_secret' => 'test-secret']);

        $this->postJson('/api/v1/newsletter', $this->validPayload())
            ->assertStatus(422)
            ->assertJsonPath('errors.captcha_token.0', 'Doğrulama başarısız oldu.');
    }

    public function test_it_accepts_a_captcha_token_google_confirms(): void
    {
        config([
            'site.recaptcha_secret' => 'test-secret',
            'site.recaptcha_verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
        ]);

        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true], 200),
        ]);

        $this->postJson('/api/v1/newsletter', $this->validPayload([
            'captcha_token' => 'valid-token',
        ]))->assertCreated();
    }

    public function test_it_throttles_repeated_submissions_from_the_same_client(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/newsletter', $this->validPayload([
                'email' => "user{$i}@example.com",
            ]))->assertCreated();
        }

        $this->postJson('/api/v1/newsletter', $this->validPayload([
            'email' => 'user5@example.com',
        ]))->assertStatus(429);
    }
}
