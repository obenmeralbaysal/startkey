<?php

namespace Tests\Unit;

use App\Support\PortalPayload;
use Tests\TestCase;

class PortalPayloadTest extends TestCase
{
    public function test_scrub_still_rewrites_urls_and_drops_secrets(): void
    {
        config(['reonix.base_url' => 'http://reonix.test']);
        $clean = PortalPayload::scrub([
            'message' => 'Reonix kaydı',
            'password' => 'hidden',
            'data' => [[
                'id' => 1,
                'public_url' => 'http://crm.example/p/abc',
                'photo' => 'http://reonix.test/storage/a.jpg',
            ]],
        ]);

        $this->assertSame('Portal kaydı', $clean['message']);
        $this->assertArrayNotHasKey('password', $clean);
        $this->assertSame('/portal/share/presentation/abc', $clean['data'][0]['public_url']);
        $this->assertSame('/api/v1/portal/media/storage/a.jpg', $clean['data'][0]['photo']);
    }

    public function test_scrub_large_flat_list_does_not_copy_the_payload(): void
    {
        $rows = [];
        for ($i = 0; $i < 20000; $i++) {
            $rows[] = ['id' => $i, 'name' => 'Mahalle '.$i, 'district_id' => 9];
        }
        $payload = ['data' => $rows];
        $before = memory_get_usage(true);
        $clean = PortalPayload::scrub($payload);
        $used = memory_get_usage(true) - $before;

        $this->assertSame($rows, $clean['data']);
        $this->assertLessThan(16 * 1024 * 1024, $used);
    }
}
