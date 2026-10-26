<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\UploadedFile;
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

    public function test_watermark_flags_pass_through_and_default_false(): void
    {
        $cookie = $this->login();
        Http::fake([
            'http://reonix.test/api/v1/portfolios/5' => Http::response([
                'data' => [
                    'id' => 5,
                    'title' => 'Ev',
                    'status' => 'potential',
                    'type' => 'sale',
                    'price' => 1,
                    'media' => [
                        ['id' => 1, 'url' => 'http://reonix.test/storage/a.jpg', 'is_watermarked' => true],
                        ['id' => 2, 'url' => 'http://reonix.test/storage/b.jpg'],
                    ],
                ],
            ]),
            'http://reonix.test/api/v1/portfolios' => Http::response([
                'data' => [[
                    'id' => 6,
                    'title' => 'Arsa',
                    'status' => 'potential',
                    'type' => 'sale',
                    'price' => 2,
                ]],
            ]),
            'http://reonix.test/api/v1/portfolios/5/status' => Http::response([
                'message' => 'Bu portföy filigranlı.',
                'errors' => ['watermarked_media' => ['Bu portföy filigranlı.']],
            ], 422),
        ]);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/portfolios/5')
            ->assertOk()
            ->assertJsonPath('data.has_watermarked_media', false)
            ->assertJsonPath('data.media.0.is_watermarked', true)
            ->assertJsonPath('data.media.1.is_watermarked', false)
            ->assertJsonPath('data.media.0.url', '/api/v1/portal/media/storage/a.jpg');

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->getJson('/api/v1/portal/office/portfolios')
            ->assertOk()
            ->assertJsonPath('data.0.has_watermarked_media', false);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7')
            ->postJson('/api/v1/portal/office/portfolios/5/status', ['status' => 'active'])
            ->assertStatus(422)
            ->assertJsonPath('errors.watermarked_media.0', 'Bu portföy filigranlı.');
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

    public function test_f1_paths_follow_role_rules_and_forward_query(): void
    {
        $owner = $this->login();
        $agent = $this->login(['role' => 'agent', 'role_slug' => 'agent']);
        $manager = $this->login(['role' => 'manager', 'role_slug' => 'manager']);
        $branched = $this->login([
            'role' => 'office_manager',
            'role_slug' => 'office_manager',
            'branch_id' => 4,
        ]);
        Http::fake([
            'http://reonix.test/api/v1/*' => Http::response(['data' => ['ok' => true]]),
        ]);

        $reads = [
            '/api/v1/portal/office/dashboard/agent-stats',
            '/api/v1/portal/office/categories/tree',
            '/api/v1/portal/office/categories/12/attributes',
            '/api/v1/portal/office/portfolio-attributes?portfolio_id=3',
            '/api/v1/portal/office/office/settings',
            '/api/v1/portal/office/earnings?from=2026-01-01&to=2026-01-31&result=success&status=success&source=portal&direction=in',
            '/api/v1/portal/office/earnings/9?from=2026-01-01&to=2026-01-31',
            '/api/v1/portal/office/earnings/summary?from=2026-01-01&to=2026-01-31&status=success',
            '/api/v1/portal/office/earnings/balance?from=2026-01-01&to=2026-01-31',
            '/api/v1/portal/office/reports/closings?from=2026-01-01&to=2026-01-31&result=success&status=success&source=portal&direction=in',
            '/api/v1/portal/office/reports/closings/export?from=2026-01-01&to=2026-01-31&result=success&status=success&source=portal&direction=out',
            '/api/v1/portal/office/collaboration-requests?direction=in',
            '/api/v1/portal/office/collaboration-requests?direction=out',
        ];

        foreach ([$owner, $agent, $manager, $branched] as $cookie) {
            foreach ($reads as $url) {
                $this->withCredentials()
                    ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                    ->withHeader('X-Portal-Office', '7')
                    ->getJson($url)
                    ->assertOk();
            }
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->postJson('/api/v1/portal/office/portfolios/quick', ['title' => 'Hizli'])
                ->assertOk();
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->postJson('/api/v1/portal/office/portfolio-attributes', ['portfolio_id' => 3])
                ->assertOk();
        }

        foreach ([$owner, $manager, $branched] as $cookie) {
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->getJson('/api/v1/portal/office/dashboard/stats')
                ->assertOk();
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->getJson('/api/v1/portal/office/dashboard/pending-approvals')
                ->assertOk();
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->putJson('/api/v1/portal/office/duty-roster', ['date' => '2026-10-26'])
                ->assertOk();
        }

        foreach ([$owner, $branched] as $cookie) {
            $this->withCredentials()
                ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
                ->withHeader('X-Portal-Office', '7')
                ->putJson('/api/v1/portal/office/office/settings', ['name' => 'Ofis', 'ttbs_no' => '3501234'])
                ->assertOk();
        }

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/earnings?')
            && str_contains($request->url(), 'from=2026-01-01')
            && str_contains($request->url(), 'to=2026-01-31')
            && str_contains($request->url(), 'result=success')
            && str_contains($request->url(), 'status=success')
            && str_contains($request->url(), 'source=portal')
            && str_contains($request->url(), 'direction=in'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/reports/closings?')
            && str_contains($request->url(), 'from=2026-01-01')
            && str_contains($request->url(), 'result=success')
            && str_contains($request->url(), 'status=success')
            && str_contains($request->url(), 'source=portal')
            && str_contains($request->url(), 'direction=in'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/reports/closings/export?')
            && str_contains($request->url(), 'direction=out'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/collaboration-requests?')
            && str_contains($request->url(), 'direction=in'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/collaboration-requests?')
            && str_contains($request->url(), 'direction=out'));
        Http::assertSent(fn ($request) => str_ends_with((string) parse_url($request->url(), PHP_URL_PATH), '/api/v1/categories/tree'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/categories/12/attributes'));
        Http::assertSent(fn ($request) => $request->method() === 'POST' && str_contains($request->url(), '/api/v1/portfolios/quick'));
        Http::assertSent(fn ($request) => $request->method() === 'PUT' && str_ends_with((string) parse_url($request->url(), PHP_URL_PATH), '/api/v1/duty-roster'));
    }

    public function test_office_settings_write_strips_branding_and_cache_drops_after_put(): void
    {
        $cookie = $this->login();
        $calls = 0;
        Http::fake(function () use (&$calls) {
            $calls++;

            return Http::response(['data' => ['name' => 'Ofis', 'n' => $calls]]);
        });
        $call = fn () => $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', '7');

        $call()->getJson('/api/v1/portal/office/office/settings')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=15, private')
            ->assertJsonPath('data.n', 1);
        $call()->getJson('/api/v1/portal/office/office/settings')
            ->assertOk()
            ->assertJsonPath('data.n', 1);
        $this->assertSame(1, $calls);

        $call()->putJson('/api/v1/portal/office/office/settings', [
            'name' => 'Yeni',
            'ttbs_no' => '3501234',
            'logo' => 'logo-bytes',
            'logo_url' => 'https://example.test/logo.png',
            'primary_color' => '#aabbcc',
            'secondary_color' => '#112233',
            'brand_color' => '#ffffff',
            'brand_colour' => '#000000',
            'primaryColor' => '#abcdef',
        ])->assertOk();

        $call()->put('/api/v1/portal/office/office/settings', [
            'name' => 'Dosya',
            'ttbs_no' => '3501234',
            'primary_color' => '#aabbcc',
            'logo' => UploadedFile::fake()->create('logo.png', 10, 'image/png'),
        ])->assertOk();

        $call()->getJson('/api/v1/portal/office/office/settings')
            ->assertOk()
            ->assertJsonPath('data.n', 4);
        $this->assertSame(4, $calls);

        Http::assertSent(function ($request) {
            if ($request->method() !== 'PUT') {
                return false;
            }
            $data = $request->data();
            foreach (['logo', 'logo_url', 'primary_color', 'secondary_color', 'brand_color', 'brand_colour', 'primaryColor'] as $key) {
                if (array_key_exists($key, $data)) {
                    return false;
                }
            }

            return ($data['name'] ?? null) === 'Yeni'
                && ($data['ttbs_no'] ?? null) === '3501234';
        });
        Http::assertSent(function ($request) {
            if ($request->method() !== 'PUT') {
                return false;
            }
            $data = $request->data();

            return ($data['name'] ?? null) === 'Dosya'
                && ! array_key_exists('logo', $data)
                && ! array_key_exists('primary_color', $data);
        });
    }

    public function test_cached_dashboard_does_not_cross_session_or_office_and_earnings_are_not_cached(): void
    {
        $owner = $this->login([], [[
            'id' => 8,
            'office_id' => 8,
            'name' => 'Sube',
            'role' => 'office_manager',
            'role_slug' => 'office_manager',
            'branch_id' => 4,
        ]]);
        $agent = $this->login(['role' => 'agent', 'role_slug' => 'agent']);
        $calls = 0;
        Http::fake(function ($request) use (&$calls) {
            $calls++;
            $office = $request->header('X-Office-Id');
            $office = is_array($office) ? (string) ($office[0] ?? '') : (string) $office;

            return Http::response(['data' => [
                'office' => $office,
                'n' => $calls,
            ]]);
        });
        $call = fn ($cookie, int $office) => $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->withHeader('X-Portal-Office', (string) $office);

        $call($owner, 7)->getJson('/api/v1/portal/office/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.office', '7')
            ->assertJsonPath('data.n', 1);
        $call($owner, 7)->getJson('/api/v1/portal/office/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.n', 1);
        $this->assertSame(1, $calls);

        $call($owner, 8)->getJson('/api/v1/portal/office/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.office', '8')
            ->assertJsonPath('data.n', 2);

        $call($agent, 7)->getJson('/api/v1/portal/office/dashboard/stats')->assertForbidden();
        $call($agent, 7)->getJson('/api/v1/portal/office/dashboard/pending-approvals')->assertForbidden();
        $this->assertSame(2, $calls);

        $call($agent, 7)->getJson('/api/v1/portal/office/dashboard/agent-stats')
            ->assertOk()
            ->assertJsonPath('data.n', 3);
        $call($owner, 7)->getJson('/api/v1/portal/office/dashboard/agent-stats')
            ->assertOk()
            ->assertJsonPath('data.n', 4);
        $call($agent, 7)->getJson('/api/v1/portal/office/dashboard/agent-stats')
            ->assertOk()
            ->assertJsonPath('data.n', 3);
        $this->assertSame(4, $calls);

        $before = $calls;
        $call($owner, 7)->getJson('/api/v1/portal/office/earnings?from=2026-01-01&to=2026-01-31&result=success&status=success&source=portal&direction=in')->assertOk();
        $call($owner, 7)->getJson('/api/v1/portal/office/earnings?from=2026-01-01&to=2026-01-31&result=success&status=success&source=portal&direction=in')->assertOk();
        $call($agent, 7)->getJson('/api/v1/portal/office/earnings/9')->assertOk();
        $call($owner, 8)->getJson('/api/v1/portal/office/earnings/summary')->assertOk();
        $call($owner, 7)->getJson('/api/v1/portal/office/earnings/balance')->assertOk();
        $call($owner, 7)->getJson('/api/v1/portal/office/reports/closings?from=2026-01-01&to=2026-01-31&status=success&direction=in')->assertOk();
        $call($owner, 7)->getJson('/api/v1/portal/office/reports/closings?from=2026-01-01&to=2026-01-31&status=success&direction=in')->assertOk();
        $call($owner, 7)->getJson('/api/v1/portal/office/reports/closings/export?source=portal&direction=out')->assertOk();
        $this->assertSame(8, $calls - $before);
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
            'agent dashboard stats' => ['agent', null, 'get', '/api/v1/portal/office/dashboard/stats'],
            'agent pending approvals' => ['agent', null, 'get', '/api/v1/portal/office/dashboard/pending-approvals'],
            'agent office settings write' => ['agent', null, 'put', '/api/v1/portal/office/office/settings'],
            'manager office settings write' => ['manager', null, 'put', '/api/v1/portal/office/office/settings'],
        ];
    }

    /**
     * @param  array<string, mixed>  $office
     * @param  list<array<string, mixed>>  $extraOffices
     */
    private function login(array $office = [], array $extraOffices = []): \Symfony\Component\HttpFoundation\Cookie
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        $this->app->forgetInstance(Factory::class);
        Http::clearResolvedInstances();
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => [
                    'token' => 'secret-token',
                    'user' => [
                        'id' => 1,
                        'first_name' => 'Ada',
                        'is_admin' => false,
                        'offices' => array_merge([array_merge([
                            'id' => 7,
                            'name' => 'Merkez',
                            'role' => 'owner',
                            'role_slug' => 'owner',
                            'branch_id' => null,
                        ], $office)], $extraOffices),
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
