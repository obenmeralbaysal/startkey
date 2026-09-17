<?php

use App\Http\Controllers\Api\V1\HomepageController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\NewsletterController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('homepage', HomepageController::class);

    Route::get('lookups/{endpoint}', LookupController::class);

    // Public write endpoint: throttled to keep the form from being used for bulk writes.
    Route::post('newsletter', [NewsletterController::class, 'store'])
        ->middleware('throttle:newsletter');
});
