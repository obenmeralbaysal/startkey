<?php

use App\Http\Controllers\Api\V1\ConsultantCommentController;
use App\Http\Controllers\Api\V1\ContactMessageController;
use App\Http\Controllers\Api\V1\CorporateController;
use App\Http\Controllers\Api\V1\FranchiseApplicationController;
use App\Http\Controllers\Api\V1\HomepageController;
use App\Http\Controllers\Api\V1\ListingInquiryController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\NewsletterController;
use App\Http\Controllers\Api\V1\TrainingApplicationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('homepage', HomepageController::class);

    Route::get('corporate', [CorporateController::class, 'show']);
    Route::get('corporate/alternate', [CorporateController::class, 'alternate']);

    Route::get('lookups/{endpoint}', LookupController::class);

    // Public write endpoints: throttled to keep the forms from being used for bulk writes.
    Route::post('newsletter', [NewsletterController::class, 'store'])
        ->middleware('throttle:newsletter');
    Route::post('contact', [ContactMessageController::class, 'store'])
        ->middleware('throttle:contact');
    Route::post('trainings/{externalId}/applications', [TrainingApplicationController::class, 'store'])
        ->middleware('throttle:training-application')
        ->whereNumber('externalId');
    Route::post('franchise/applications', [FranchiseApplicationController::class, 'store'])
        ->middleware('throttle:franchise-application');
    Route::post('listings/{externalId}/inquiries', [ListingInquiryController::class, 'store'])
        ->middleware('throttle:listing-inquiry')
        ->whereNumber('externalId');
    Route::post('consultants/{externalId}/comments', [ConsultantCommentController::class, 'store'])
        ->middleware('throttle:consultant-comment')
        ->whereNumber('externalId');
});
