<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PortalForwardTest extends TestCase
{
    use RefreshDatabase;

    public function test_portal_login_does_not_return_the_upstream_token(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/*' => Http::response([
                'data' => [
                    'token' => 'secret-token',
                    'user' => [
                        'id' => 1,
                        'first_name' => 'Ada',
                        'last_name' => 'Yılmaz',
                        'email' => 'ada@example.com',
                        'is_admin' => true,
                        'offices' => [],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk();

        $response->assertJsonMissingPath('data.token');
        $response->assertJsonPath('data.user.first_name', 'Ada');
        $this->assertStringNotContainsString('reonix', strtolower($response->getContent()));
        $this->assertNotEmpty($response->getCookie('startkey_portal', false));
    }

    public function test_portal_data_routes_reject_a_missing_session(): void
    {
        $this->getJson('/api/v1/portal/session')->assertUnauthorized();
        $this->getJson('/api/v1/portal/applications')->assertUnauthorized();
        $this->postJson('/api/v1/portal/offices/1/agents', [])->assertUnauthorized();
        $this->deleteJson('/api/v1/portal/session')->assertOk();
    }

    public function test_portal_data_routes_allow_a_valid_session(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/*' => Http::response([
                'data' => [
                    'token' => 'secret-token',
                    'user' => ['id' => 1, 'first_name' => 'Ada'],
                ],
            ], 200),
        ]);

        $login = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk();
        $cookie = $login->getCookie('startkey_portal', false);
        $this->assertNotNull($cookie);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/v1/portal/applications')
            ->assertOk()
            ->assertJsonPath('data.user.first_name', 'Ada');
    }

    public function test_consultant_page_resolves_without_calling_upstream(): void
    {
        $this->getJson('/api/v1/corporate?locale=tr&path=/tr/danisman-basvuru')
            ->assertOk()
            ->assertJsonPath('data.kind', 'consultant-application')
            ->assertJsonPath('data.formHeading', 'Danışman Başvurusu')
            ->assertJsonPath('data.positions.0.label', 'Gayrimenkul Danışmanı');

        $this->getJson('/api/v1/corporate?locale=en&path=/en/consultant-form')
            ->assertOk()
            ->assertJsonPath('data.captchaError', 'Verification is required.')
            ->assertJsonPath('data.positions.2.label', 'Office Assistant');

        $this->getJson('/api/v1/corporate?locale=de&path=/de/consultant-form')
            ->assertOk()
            ->assertJsonPath('data.captchaError', 'Verifizierung ist erforderlich.');
    }
}
