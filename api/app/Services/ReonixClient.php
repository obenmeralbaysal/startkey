<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
class ReonixClient
{
    public function get(string $path, ?string $token = null): array
    {
        return $this->send('get', $path, [], $token);
    }

    public function post(string $path, array $data = [], ?string $token = null): array
    {
        return $this->send('post', $path, $data, $token);
    }

    public function put(string $path, array $data = [], ?string $token = null): array
    {
        return $this->send('put', $path, $data, $token);
    }

    private function send(string $method, string $path, array $data, ?string $token): array
    {
        $base = (string) config('reonix.base_url');
        $key = (string) config('reonix.portal_key');
        if ($base === '' || $key === '') {
            throw new ReonixException('unavailable');
        }

        $request = Http::acceptJson()
            ->timeout(15)
            ->withHeaders(['X-Portal-Key' => $key]);
        if ($token) {
            $request = $request->withToken($token);
        }

        try {
            $response = $request->{$method}($base.'/api/v1/integrations/portal/'.ltrim($path, '/'), $data);
        } catch (\Throwable $e) {
            throw new ReonixException('unavailable');
        }

        return $this->decode($response);
    }

    private function decode(Response $response): array
    {
        $body = $response->json();
        if (! is_array($body)) {
            throw new ReonixException('unavailable', $response->status());
        }
        if ($response->failed()) {
            $error = is_string($body['error'] ?? null) ? $body['error'] : 'unavailable';
            throw new ReonixException($error, $response->status());
        }

        return $body;
    }
}
