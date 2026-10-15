<?php

use App\Http\Controllers\Api\V1\CatalogueMediaController;
use App\Http\Controllers\Api\V1\ConsultantApplicationController;
use App\Http\Controllers\Api\V1\ConsultantCommentController;
use App\Http\Controllers\Api\V1\ContactMessageController;
use App\Http\Controllers\Api\V1\CorporateController;
use App\Http\Controllers\Api\V1\FranchiseApplicationController;
use App\Http\Controllers\Api\V1\HomepageController;
use App\Http\Controllers\Api\V1\ListingInquiryController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\NewsletterController;
use App\Http\Controllers\Api\V1\OfficeProxyController;
use App\Http\Controllers\Api\V1\PortalMediaController;
use App\Http\Controllers\Api\V1\PortalSessionController;
use App\Http\Controllers\Api\V1\PublicPortalController;
use App\Http\Controllers\Api\V1\TrainingApplicationController;
use App\Http\Middleware\AuthenticatePortalSession;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('homepage', HomepageController::class);

    Route::get('corporate', [CorporateController::class, 'show']);
    Route::get('catalogue/media/{kind}/{id}/{index?}', CatalogueMediaController::class)
        ->whereNumber('id')
        ->where('kind', 'offices|consultants|portfolios')
        ->where('index', '[0-9]+')
        ->middleware('throttle:120,1');
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
    Route::get('consultant-applications/offices', [ConsultantApplicationController::class, 'offices']);
    Route::post('consultant-applications', [ConsultantApplicationController::class, 'store'])
        ->middleware('throttle:consultant-application');

    Route::post('portal/session', [PortalSessionController::class, 'store'])->middleware('throttle:portal-session');
    Route::post('portal/password/forgot', [PortalSessionController::class, 'forgotPassword'])->middleware('throttle:portal-password');
    Route::post('portal/password/reset', [PortalSessionController::class, 'resetPassword'])->middleware('throttle:portal-password');
    Route::delete('portal/session', [PortalSessionController::class, 'destroy']);
    Route::middleware(AuthenticatePortalSession::class)->group(function () {
        Route::get('portal/session', [PortalSessionController::class, 'show']);
        Route::get('portal/applications', [PortalSessionController::class, 'applications']);
        Route::post('portal/applications/{id}/open-office', [PortalSessionController::class, 'openOffice'])->whereNumber('id');
        Route::get('portal/packages', [PortalSessionController::class, 'packages']);
        Route::put('portal/offices/{id}/package', [PortalSessionController::class, 'updatePackage'])->whereNumber('id');
        Route::get('portal/consultant-applications', [PortalSessionController::class, 'consultantApplications']);
        Route::post('portal/consultant-applications/{id}/accept', [PortalSessionController::class, 'acceptConsultant'])->whereNumber('id');
        Route::post('portal/offices/{id}/brokers', [PortalSessionController::class, 'storeBroker'])->whereNumber('id');
        Route::post('portal/offices/{id}/agents', [PortalSessionController::class, 'storeAgent'])->whereNumber('id');
        Route::get('portal/desk/offices', [PortalSessionController::class, 'deskOffices']);
        Route::put('portal/offices/{id}/presence', [PortalSessionController::class, 'officePresence'])->whereNumber('id');
        Route::put('portal/offices/{id}/currency', [PortalSessionController::class, 'officeCurrency'])->whereNumber('id');
        Route::post('portal/portfolios/{id}/catalogue', [PortalSessionController::class, 'portfolioCatalogue'])->whereNumber('id');
        Route::post('portal/offices/{id}/invoices', [PortalSessionController::class, 'storeInvoice'])->whereNumber('id');
        Route::post('portal/invoices/{id}/payments', [PortalSessionController::class, 'payInvoice'])->whereNumber('id');
        Route::post('portal/offices/{id}/limit-requests', [PortalSessionController::class, 'storeLimitRequest'])->whereNumber('id');
        Route::match(['get', 'post', 'put', 'patch', 'delete'], 'portal/office/{path}', OfficeProxyController::class)->where('path', '.*');
        Route::get('portal/media/{path}', PortalMediaController::class)->where('path', '.*');
    });
    Route::match(['get', 'post'], 'portal/public/{path}', PublicPortalController::class)
        ->where('path', '.*')
        ->middleware('throttle:60,1');
    Route::post('listings/{externalId}/inquiries', [ListingInquiryController::class, 'store'])
        ->middleware('throttle:listing-inquiry')
        ->whereNumber('externalId');
    Route::post('consultants/{externalId}/comments', [ConsultantCommentController::class, 'store'])
        ->middleware('throttle:consultant-comment')
        ->whereNumber('externalId');
});
