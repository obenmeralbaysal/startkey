<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
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

    public function test_missing_location_filters_do_not_call_upstream(): void
    {
        $cookie = $this->login();
        Http::fake();

        foreach ([
            '/api/v1/portal/office/locations/districts',
            '/api/v1/portal/office/locations/districts?city_id=0',
            '/api/v1/portal/office/locations/neighborhoods',
            '/api/v1/portal/office/locations/neighborhoods?district_id=0',
        ] as $url) {
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->getJson($url)
                ->assertStatus(422)
                ->assertJsonPath('data', []);
        }

        Http::assertNothingSent();
    }

    public function test_a_real_district_filter_is_forwarded(): void
    {
        $cookie = $this->login();
        Http::fake([
            'http://reonix.test/api/v1/locations/neighborhoods*' => Http::response([
                'data' => [['id' => 3, 'name' => 'Alsancak', 'district_id' => 9]],
            ]),
        ]);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/locations/neighborhoods?district_id=9')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Alsancak');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'district_id=9'));
    }

    #[DataProvider('deniedSettings')]
    public function test_settings_the_role_cannot_open_are_forbidden(string $role, ?int $branchId, string $method, string $url): void
    {
        $cookie = $this->login([
            'role' => $role,
            'role_slug' => $role,
            'branch_id' => $branchId,
        ]);
        Http::fake();
        $call = $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7');
        $response = match ($method) {
            'put' => $call->putJson($url, []),
            'post' => $call->postJson($url, []),
            default => $call->getJson($url),
        };

        $response->assertForbidden()->assertJsonPath('message', 'Bu ayara erişim yetkiniz yok.');
        Http::assertNothingSent();
    }

    public function test_owner_settings_are_forwarded_including_upstream_forbidden(): void
    {
        $cookie = $this->login();
        Http::fake([
            'http://reonix.test/api/v1/commission-policy' => Http::response(['message' => 'Yetkiniz yok.'], 403),
            'http://reonix.test/api/v1/badges' => Http::response(['data' => []]),
            'http://reonix.test/api/v1/team' => Http::response(['data' => []]),
            'http://reonix.test/api/v1/duty-roster/today' => Http::response(['data' => []]),
        ]);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/commission-policy')
            ->assertForbidden()
            ->assertJsonPath('message', 'Yetkiniz yok.');
        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/badges')
            ->assertOk();

        $manager = $this->login([
            'role' => 'office_manager',
            'role_slug' => 'office_manager',
            'branch_id' => null,
        ]);
        Http::fake([
            'http://reonix.test/api/v1/team' => Http::response(['data' => []]),
            'http://reonix.test/api/v1/offices/7' => Http::response(['data' => ['id' => 7]]),
            'http://reonix.test/api/v1/duty-roster/today' => Http::response(['data' => []]),
        ]);
        $this->withCredentials()
            ->withUnencryptedCookie($manager->getName(), $manager->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/team')
            ->assertOk();
        $this->withCredentials()
            ->withUnencryptedCookie($manager->getName(), $manager->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/offices/7')
            ->assertOk();
        $agent = $this->login([
            'role' => 'agent',
            'role_slug' => 'agent',
        ]);
        Http::fake([
            'http://reonix.test/api/v1/duty-roster/today' => Http::response(['data' => ['date' => '2026-10-26']]),
        ]);
        $this->withCredentials()
            ->withUnencryptedCookie($agent->getName(), $agent->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/duty-roster/today')
            ->assertOk();
    }

    public function test_catalogue_and_dashboard_reads_hit_upstream_once(): void
    {
        $cookie = $this->login();
        $calls = 0;
        Http::fake(function () use (&$calls) {
            $calls++;
            usleep(120000);

            return Http::response(['data' => [['id' => 1, 'name' => 'İzmir']]]);
        });
        $call = fn () => $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7');

        $started = microtime(true);
        $call()->getJson('/api/v1/portal/office/locations/cities')->assertOk();
        $firstMs = (microtime(true) - $started) * 1000;

        $started = microtime(true);
        $call()->getJson('/api/v1/portal/office/locations/cities')->assertOk();
        $secondMs = (microtime(true) - $started) * 1000;

        $this->assertSame(1, $calls);
        $this->assertGreaterThan(80, $firstMs);
        $this->assertLessThan($firstMs / 2, $secondMs, "cities first={$firstMs}ms second={$secondMs}ms");

        $pages = [
            '/api/v1/portal/office/me',
            '/api/v1/portal/office/dashboard/stats',
            '/api/v1/portal/office/dashboard/pending-approvals',
            '/api/v1/portal/office/dashboard/my-revisions',
            '/api/v1/portal/office/duty-roster/today',
            '/api/v1/portal/office/dashboard/visuals?period=month&sort_by=score&limit=10',
        ];
        $before = $calls;
        $started = microtime(true);
        foreach ($pages as $url) {
            $call()->getJson($url)->assertOk();
        }
        $coldMs = (microtime(true) - $started) * 1000;
        $started = microtime(true);
        foreach ($pages as $url) {
            $call()->getJson($url)->assertOk();
        }
        $warmMs = (microtime(true) - $started) * 1000;

        $this->assertSame(count($pages), $calls - $before);
        $this->assertGreaterThan(400, $coldMs);
        $this->assertLessThan($coldMs / 3, $warmMs, "dashboard cold={$coldMs}ms warm={$warmMs}ms upstream=".($calls - $before));

        $call()->getJson('/api/v1/portal/office/dashboard/stats')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=15, private');
        $this->assertSame(count($pages), $calls - $before);

        $before = $calls;
        $started = microtime(true);
        $call()->getJson('/api/v1/portal/office/portfolios?sort_by=title&page=1&_=111')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=20, private');
        $coldList = (microtime(true) - $started) * 1000;
        $started = microtime(true);
        $call()->getJson('/api/v1/portal/office/portfolios?page=1&sort_by=title&_=222')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=20, private');
        $warmList = (microtime(true) - $started) * 1000;

        $this->assertSame(1, $calls - $before, 'portfolio list upstream='.($calls - $before));
        $this->assertGreaterThan(80, $coldList);
        $this->assertLessThan($coldList / 2, $warmList, "portfolios cold={$coldList}ms warm={$warmList}ms");
    }

    /**
     * @return array<string, array{0: string, 1: int|null, 2: string, 3: string}>
     */
    public static function deniedSettings(): array
    {
        return [
            'agent commission' => ['agent', null, 'get', '/api/v1/portal/office/commission-policy'],
            'agent rates' => ['agent', null, 'get', '/api/v1/portal/office/earning-rates'],
            'agent duty write' => ['agent', null, 'put', '/api/v1/portal/office/duty-roster'],
            'agent team' => ['agent', null, 'get', '/api/v1/portal/office/team'],
            'agent email' => ['agent', null, 'put', '/api/v1/portal/office/office/imap-settings'],
            'agent subscription' => ['agent', null, 'post', '/api/v1/portal/office/office/subscription/upgrade'],
            'agent billing' => ['agent', null, 'get', '/api/v1/portal/office/hq/office/billing'],
            'manager commission' => ['office_manager', null, 'get', '/api/v1/portal/office/commission-policy'],
            'manager rates' => ['office_manager', null, 'get', '/api/v1/portal/office/earning-rates'],
            'manager badges' => ['office_manager', null, 'post', '/api/v1/portal/office/badges'],
            'branched matchmaking' => ['office_manager', 4, 'post', '/api/v1/portal/office/office/matchmaking-weights'],
            'branched office' => ['office_manager', 4, 'put', '/api/v1/portal/office/offices/7'],
        ];
    }

    /**
     * @param  array<string, mixed>  $office
     */
    private function login(array $office = []): \Symfony\Component\HttpFoundation\Cookie
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
                        'offices' => [array_merge([
                            'id' => 7,
                            'name' => 'Merkez',
                            'role' => 'owner',
                            'role_slug' => 'owner',
                            'branch_id' => null,
                        ], $office)],
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
