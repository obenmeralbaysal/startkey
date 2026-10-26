<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
class ReonixClient
{
    private static ?Client $http = null;
    public function get(string $path, array $data = [], ?string $token = null): array
    {
        return $this->send('get', $path, $data, $token);
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

        $request = $this->pending(15)
            ->asJson()
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

    /**
     * @param  array<string, mixed>  $query
     * @param  array<string, mixed>|null  $json
     * @param  array<string, array{contents: string, filename: string, type: string}>  $files
     */
    public function exchange(string $method, string $path, array $query = [], ?array $json = null, array $files = [], ?string $token = null, ?string $officeId = null): Response
    {
        $base = (string) config('reonix.base_url');
        if ($base === '') {
            throw new ReonixException('unavailable');
        }

        $pending = $this->pending($files === [] ? 20 : 60);
        if ($token) {
            $pending = $pending->withToken($token);
        }
        $headers = [];
        if ($officeId !== null && $officeId !== '') {
            $headers['X-Office-Id'] = $officeId;
        }
        if ($headers !== []) {
            $pending = $pending->withHeaders($headers);
        }

        $url = $base.'/api/v1/'.ltrim($path, '/');
        if ($query !== []) {
            $url .= '?'.http_build_query($query);
        }

        try {
            if ($files !== []) {
                foreach ($files as $name => $file) {
                    $pending = $pending->attach($name, $file['contents'], $file['filename'], ['Content-Type' => $file['type']]);
                }

                return $pending->send(strtoupper($method), $url, [
                    'multipart' => $this->fields($json ?? []),
                ]);
            }

            $options = [];
            if ($json !== null) {
                $pending = $pending->asJson();
                $options['json'] = $json;
            }

            return $pending->send(strtoupper($method), $url, $options);
        } catch (\Throwable $e) {
            throw new ReonixException('unavailable');
        }
    }

    private function pending(int $timeout): PendingRequest
    {
        $pending = Http::acceptJson()->connectTimeout(3)->timeout($timeout);
        if (app()->runningUnitTests()) {
            return $pending;
        }

        self::$http ??= new Client([
            'http_errors' => false,
            'connect_timeout' => 3,
            'curl' => [
                CURLOPT_TCP_KEEPALIVE => 1,
                CURLOPT_TCP_KEEPIDLE => 20,
                CURLOPT_TCP_KEEPINTVL => 10,
            ],
        ]);

        return $pending->setClient(self::$http);
    }

    /**
     * @param  array<string, mixed>  $fields
     * @return list<array{name: string, contents: string}>
     */
    private function fields(array $fields): array
    {
        $out = [];
        foreach ($fields as $name => $value) {
            if (is_array($value)) {
                $out[] = ['name' => (string) $name, 'contents' => json_encode($value) ?: ''];
                continue;
            }
            if ($value === null) {
                continue;
            }
            $out[] = ['name' => (string) $name, 'contents' => is_bool($value) ? ($value ? '1' : '0') : (string) $value];
        }

        return $out;
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
