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
        $this->getJson('/api/v1/portal/desk/stats')->assertUnauthorized();
        $this->putJson('/api/v1/portal/offices/1/location', ['latitude' => 41, 'longitude' => 29])->assertUnauthorized();
        $this->getJson('/api/v1/portal/offices/1/users')->assertUnauthorized();
        $this->putJson('/api/v1/portal/offices/1/users/2/password', ['password' => 'long-enough'])->assertUnauthorized();
        $this->deleteJson('/api/v1/portal/session')->assertOk();
    }

    public function test_desk_stats_are_forwarded_to_the_franchise_desk(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => ['token' => 'secret-token', 'user' => ['id' => 1, 'first_name' => 'Ada']],
            ], 200),
            'http://reonix.test/api/v1/integrations/portal/desk/stats' => Http::response([
                'data' => ['offices' => ['total' => 3]],
            ], 200),
        ]);

        $cookie = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk()->getCookie('startkey_portal', false);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/v1/portal/desk/stats')
            ->assertOk()
            ->assertJsonPath('data.offices.total', 3);

        Http::assertSent(fn ($request) => $request->url() === 'http://reonix.test/api/v1/integrations/portal/desk/stats'
            && $request->hasHeader('Authorization', 'Bearer secret-token'));
    }

    public function test_an_office_user_password_is_forwarded_without_being_stored_here(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => ['token' => 'secret-token', 'user' => ['id' => 1, 'first_name' => 'Ada']],
            ], 200),
            'http://reonix.test/api/v1/integrations/portal/offices/4/users/9/password' => Http::response([
                'data' => ['updated' => true],
            ], 200),
        ]);

        $cookie = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk()->getCookie('startkey_portal', false);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->putJson('/api/v1/portal/offices/4/users/9/password', ['password' => 'new-pass-1'])
            ->assertOk()
            ->assertJsonPath('data.updated', true);

        Http::assertSent(fn ($request) => $request->url() === 'http://reonix.test/api/v1/integrations/portal/offices/4/users/9/password'
            && $request['password'] === 'new-pass-1'
            && $request->hasHeader('Authorization', 'Bearer secret-token'));
    }

    public function test_an_office_pin_is_forwarded_and_validated(): void
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => ['token' => 'secret-token', 'user' => ['id' => 1, 'first_name' => 'Ada']],
            ], 200),
            'http://reonix.test/api/v1/integrations/portal/offices/4/location' => Http::response([
                'data' => ['id' => 4, 'latitude' => 40.9876543, 'longitude' => 29.0251],
            ], 200),
        ]);

        $cookie = $this->postJson('/api/v1/portal/session', [
            'email' => 'ada@example.com',
            'password' => 'secret',
        ])->assertOk()->getCookie('startkey_portal', false);
        $desk = fn () => $this->withCredentials()->withUnencryptedCookie($cookie->getName(), $cookie->getValue());

        $desk()->putJson('/api/v1/portal/offices/4/location', ['latitude' => 40.9876543, 'longitude' => 29.0251])
            ->assertOk()
            ->assertJsonPath('data.latitude', 40.9876543);
        $desk()->putJson('/api/v1/portal/offices/4/location', ['latitude' => 120, 'longitude' => 29])->assertStatus(422);
        $desk()->putJson('/api/v1/portal/offices/4/location', ['latitude' => 41])->assertStatus(422);

        Http::assertSent(fn ($request) => $request->url() === 'http://reonix.test/api/v1/integrations/portal/offices/4/location'
            && $request->method() === 'PUT'
            && $request['latitude'] == 40.9876543
            && $request->hasHeader('Authorization', 'Bearer secret-token'));
        Http::assertSentCount(2);
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
