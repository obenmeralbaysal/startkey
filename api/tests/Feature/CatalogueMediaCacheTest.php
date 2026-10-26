<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogueMediaCacheTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'reonix.base_url' => 'https://portal.test',
            'reonix.portal_key' => 'test-key',
            'reonix.media_cache_ttl' => 21600,
        ]);
        Storage::fake('local');
    }

    protected function tearDown(): void
    {
        config([
            'reonix.base_url' => '',
            'reonix.portal_key' => '',
        ]);
        parent::tearDown();
    }

    public function test_a_second_request_is_served_from_disk_and_a_matching_etag_is_not_modified(): void
    {
        $bytes = 'jpeg-bytes';
        $url = 'https://portal.test/api/v1/integrations/portal/catalogue/media/portfolios/9/0';
        Http::fake([
            $url => Http::response($bytes, 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $first = $this->get('/api/v1/catalogue/media/portfolios/9/0')
            ->assertOk()
            ->assertHeader('content-type', 'image/jpeg')
            ->assertHeader('cache-control', 'max-age=86400, public, stale-while-revalidate=604800')
            ->assertHeader('etag', '"'.sha1($bytes).'"');
        $this->assertNotEmpty($first->headers->get('Last-Modified'));
        $this->assertSame($bytes, $first->getContent());

        $disk = Storage::disk('local');
        $meta = json_decode($disk->get('catalogue-media/portfolios/9/0.meta'), true);
        $this->assertSame('image/jpeg', $meta['type']);
        $this->assertArrayHasKey('fetched_at', $meta);
        $this->assertSame($bytes, $disk->get('catalogue-media/portfolios/9/0.bin'));

        $second = $this->get('/api/v1/catalogue/media/portfolios/9/0')->assertOk();
        $this->assertSame($bytes, $second->getContent());
        Http::assertSentCount(1);

        $this->withHeaders(['If-None-Match' => $first->headers->get('ETag')])
            ->get('/api/v1/catalogue/media/portfolios/9/0')
            ->assertStatus(304);
        Http::assertSentCount(1);
    }

    public function test_a_stale_copy_is_served_when_upstream_fails(): void
    {
        $bytes = 'jpeg-bytes';
        $url = 'https://portal.test/api/v1/integrations/portal/catalogue/media/portfolios/9/1';
        Http::fake([
            $url => Http::response($bytes, 200, ['Content-Type' => 'image/jpeg']),
        ]);

        $this->get('/api/v1/catalogue/media/portfolios/9/1')->assertOk();

        $disk = Storage::disk('local');
        $meta = json_decode($disk->get('catalogue-media/portfolios/9/1.meta'), true);
        $meta['fetched_at'] = time() - 21601;
        $disk->put('catalogue-media/portfolios/9/1.meta', json_encode($meta));

        Http::fake([
            $url => Http::response('down', 503),
        ]);

        $stale = $this->get('/api/v1/catalogue/media/portfolios/9/1')
            ->assertOk()
            ->assertHeader('content-type', 'image/jpeg');
        $this->assertSame($bytes, $stale->getContent());
        Http::assertSentCount(1);
    }

    public function test_a_non_image_response_is_not_cached(): void
    {
        $url = 'https://portal.test/api/v1/integrations/portal/catalogue/media/portfolios/9/2';
        Http::fake([
            $url => Http::response('<html></html>', 200, ['Content-Type' => 'text/html']),
        ]);

        $this->get('/api/v1/catalogue/media/portfolios/9/2')->assertNotFound();
        $this->get('/api/v1/catalogue/media/portfolios/9/2')->assertNotFound();
        Http::assertSentCount(2);

        $disk = Storage::disk('local');
        $this->assertFalse($disk->exists('catalogue-media/portfolios/9/2.bin'));
        $this->assertFalse($disk->exists('catalogue-media/portfolios/9/2.meta'));
    }
}
