<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OfficeProxyTest extends TestCase
{
    use RefreshDatabase;

    public function test_office_proxy_forwards_an_allowed_path_and_hides_the_upstream(): void
    {
        $cookie = $this->login();
        Http::fake([
            'http://reonix.test/api/v1/portfolios*' => Http::response([
                'data' => [[
                    'id' => 5,
                    'title' => 'Ev',
                    'public_url' => 'http://crm.example/p/abc',
                    'photo' => 'http://reonix.test/storage/a.jpg',
                ]],
                'message' => 'Reonix kaydı',
            ]),
        ]);

        $response = $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/portfolios')
            ->assertOk();

        $response->assertJsonPath('data.0.title', 'Ev');
        $response->assertJsonPath('data.0.public_url', '/portal/share/presentation/abc');
        $response->assertJsonPath('data.0.photo', '/api/v1/portal/media/storage/a.jpg');
        $response->assertJsonPath('message', 'Portal kaydı');
        $this->assertStringNotContainsString('reonix', strtolower($response->getContent()));
        $this->assertStringNotContainsString('secret-token', $response->getContent());
        Http::assertSent(function ($request) {
            return $request->url() === 'http://reonix.test/api/v1/portfolios'
                && $request->hasHeader('Authorization', 'Bearer secret-token')
                && $request->hasHeader('X-Office-Id', '7');
        });
    }

    public function test_office_proxy_rejects_admin_and_foreign_offices(): void
    {
        $cookie = $this->login();
        Http::fake();

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/v1/portal/office/admin/offices')
            ->assertNotFound();
        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '9')
            ->getJson('/api/v1/portal/office/portfolios')
            ->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_office_proxy_requires_a_session(): void
    {
        $this->getJson('/api/v1/portal/office/portfolios')->assertUnauthorized();
    }

    public function test_switch_office_keeps_the_new_token_on_the_server(): void
    {
        $cookie = $this->login();
        Http::fake([
            'http://reonix.test/api/v1/auth/switch-office' => Http::response([
                'data' => ['token' => 'secret-2', 'user' => ['id' => 1]],
                'offices' => [['office_id' => 8, 'role_slug' => 'agent']],
            ]),
            'http://reonix.test/api/v1/me' => Http::response([
                'user' => ['id' => 1],
                'offices' => [['office_id' => 8, 'role_slug' => 'agent']],
            ]),
        ]);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->postJson('/api/v1/portal/office/auth/switch-office', ['office_id' => 7])
            ->assertOk()
            ->assertJsonMissingPath('data.token');

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '8')
            ->getJson('/api/v1/portal/office/me')
            ->assertOk();

        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/api/v1/me')
            && $request->hasHeader('Authorization', 'Bearer secret-2')
            && $request->hasHeader('X-Office-Id', '8'));
    }

    public function test_public_share_proxy_is_limited_to_customer_links(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/api/v1/public/magic-links/abc' => Http::response(['data' => ['title' => 'Sunum']]),
        ]);

        $this->getJson('/api/v1/portal/public/magic-links/abc')
            ->assertOk()
            ->assertJsonPath('data.title', 'Sunum');
        $this->getJson('/api/v1/portal/public/blog')->assertNotFound();
    }

    private function login(): \Symfony\Component\HttpFoundation\Cookie
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => [
                    'token' => 'secret-token',
                    'user' => [
                        'id' => 1,
                        'first_name' => 'Ada',
                        'is_admin' => false,
                        'offices' => [['id' => 7, 'name' => 'Merkez', 'role' => 'owner']],
                    ],
                ],
            ]),
        ]);

        $login = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk();
        $cookie = $login->getCookie('startkey_portal', false);
        $this->assertNotNull($cookie);

        return $cookie;
    }
}
