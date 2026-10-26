<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PortalNetworkTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_adds_network_context_for_franchise_roles(): void
    {
        $cookie = $this->login('franchise_staff');
        Http::fake([
            'http://reonix.test/api/v1/me' => Http::response([
                'status' => 'success',
                'user' => ['id' => 4, 'first_name' => 'Ada'],
                'offices' => [],
            ]),
        ]);

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/v1/portal/office/me')
            ->assertOk()
            ->assertJsonPath('context', 'network')
            ->assertJsonPath('role', 'franchise_staff')
            ->assertJsonPath('user.role', 'franchise_staff')
            ->assertJsonPath('user.context', 'network');
    }

    public function test_network_summary_and_lists_come_from_reonix_without_contact_fields(): void
    {
        $cookie = $this->login('franchise_admin');
        Http::fake([
            'http://reonix.test/api/v1/admin/network/summary' => Http::response([
                'offices' => 2,
                'consultants' => 5,
                'active_portfolios' => 9,
                'branches' => 3,
                'updated_at' => '2026-10-26T07:00:00+00:00',
            ]),
            'http://reonix.test/api/v1/admin/network/offices*' => Http::response([
                'data' => [[
                    'id' => 7,
                    'name' => 'Karşıyaka',
                    'city' => 'İzmir',
                    'logo' => null,
                    'consultant_count' => 2,
                    'portfolio_count' => 4,
                    'email' => 'office@example.com',
                    'phone' => '0555',
                ]],
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => 20,
                    'total_items' => 1,
                    'total_pages' => 1,
                ],
            ]),
            'http://reonix.test/api/v1/admin/network/consultants*' => Http::response([
                'data' => [[
                    'id' => 9,
                    'name' => 'Meral Akın',
                    'title' => 'agent',
                    'office' => ['id' => 7, 'name' => 'Karşıyaka', 'email' => 'office@example.com'],
                    'photo' => null,
                    'portfolio_count' => 4,
                    'email' => 'meral@example.com',
                    'phone' => '0555',
                ]],
                'pagination' => [
                    'current_page' => 2,
                    'per_page' => 20,
                    'total_items' => 21,
                    'total_pages' => 2,
                ],
            ]),
        ]);

        $call = $this->withCredentials()->withUnencryptedCookie($cookie->getName(), $cookie->getValue());

        $call->getJson('/api/v1/portal/network/summary')
            ->assertOk()
            ->assertExactJson([
                'offices' => 2,
                'consultants' => 5,
                'active_portfolios' => 9,
                'branches' => 3,
                'updated_at' => '2026-10-26T07:00:00+00:00',
            ]);

        $offices = $call->getJson('/api/v1/portal/network/offices?page=1&q=Karşı')->assertOk();
        $offices->assertJsonPath('data.0.name', 'Karşıyaka');
        $offices->assertJsonPath('pagination.total_items', 1);
        $offices->assertJsonPath('pagination.per_page', 20);
        $this->assertStringNotContainsString('office@example.com', $offices->getContent());
        $this->assertStringNotContainsString('0555', $offices->getContent());

        $consultants = $call->getJson('/api/v1/portal/network/consultants?page=2&q=Meral&office_id=7')->assertOk();
        $consultants->assertJsonPath('data.0.office.name', 'Karşıyaka');
        $consultants->assertJsonPath('pagination.current_page', 2);
        $consultants->assertJsonPath('pagination.total_pages', 2);
        $this->assertStringNotContainsString('meral@example.com', $consultants->getContent());
        $this->assertStringNotContainsString('0555', $consultants->getContent());
        $this->assertArrayNotHasKey('email', $consultants->json('data.0'));
        $this->assertArrayNotHasKey('phone', $consultants->json('data.0'));
        $this->assertArrayNotHasKey('email', $consultants->json('data.0.office'));

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/admin/network/consultants')
            && str_contains($request->url(), 'office_id=7')
            && $request->hasHeader('Authorization', 'Bearer secret-token'));
    }

    public function test_an_office_user_cannot_read_the_network(): void
    {
        $cookie = $this->login('owner');
        Http::fake();

        $this->withCredentials()
            ->withUnencryptedCookie($cookie->getName(), $cookie->getValue())
            ->getJson('/api/v1/portal/network/summary')
            ->assertForbidden();

        Http::assertNothingSent();
    }

    #[DataProvider('writes')]
    public function test_franchise_roles_cannot_write(string $role, string $method, string $url): void
    {
        $cookie = $this->login($role);
        Http::fake();
        $call = $this->withCredentials()->withUnencryptedCookie($cookie->getName(), $cookie->getValue());
        $response = match ($method) {
            'put' => $call->putJson($url, ['latitude' => 41, 'longitude' => 29]),
            'delete' => $call->deleteJson($url),
            default => $call->postJson($url, ['first_name' => 'A', 'last_name' => 'B', 'email' => 'a@example.com']),
        };

        $response->assertForbidden();
        Http::assertNothingSent();
    }

    /**
     * @return list<array{0: string, 1: string, 2: string}>
     */
    public static function writes(): array
    {
        $urls = [
            ['post', '/api/v1/portal/offices/1/agents'],
            ['put', '/api/v1/portal/offices/1/location'],
            ['post', '/api/v1/portal/office/portfolios'],
            ['delete', '/api/v1/portal/office/portfolios/3'],
        ];
        $cases = [];
        foreach (['franchise_admin', 'franchise_staff'] as $role) {
            foreach ($urls as [$method, $url]) {
                $cases[] = [$role, $method, $url];
            }
        }

        return $cases;
    }

    private function login(string $role): \Symfony\Component\HttpFoundation\Cookie
    {
        config(['reonix.base_url' => 'http://reonix.test', 'reonix.portal_key' => 'test-key']);
        $network = in_array($role, ['franchise_admin', 'franchise_staff'], true);
        Http::fake([
            'http://reonix.test/api/v1/integrations/portal/session' => Http::response([
                'data' => [
                    'token' => 'secret-token',
                    'user' => [
                        'id' => 4,
                        'first_name' => 'Ada',
                        'is_admin' => false,
                        'offices' => $network ? [] : [[
                            'id' => 7,
                            'name' => 'Merkez',
                            'role' => $role,
                            'role_slug' => $role,
                        ]],
                        'context' => $network ? 'network' : 'office',
                        'role' => $role,
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
