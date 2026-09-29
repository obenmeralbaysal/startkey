<?php

return [
    'base_url' => rtrim((string) env('REONIX_BASE_URL', ''), '/'),
    'portal_key' => env('REONIX_PORTAL_KEY', ''),
    'network_slug' => env('REONIX_NETWORK_SLUG', 'startkey'),
];
