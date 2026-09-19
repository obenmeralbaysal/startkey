<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CRM listing rows that the public Portföylerimiz list/detail templates read.
 * Superadmin / Reonix will later write the same tables; the 68-listing seed is
 * only a captured sample until that source exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_listings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('ad_type_id', 40)->nullable();
            $table->string('process_type_id', 40)->nullable();
            $table->string('currency_id', 40)->nullable();
            $table->string('country_id', 40)->nullable();
            $table->string('city_id', 40)->nullable();
            $table->string('county_id', 40)->nullable();
            $table->string('district_id', 40)->nullable();
            $table->string('office_id', 40)->nullable();
            $table->string('consultant_id', 40)->nullable();
            $table->string('office_slug')->default('');
            $table->string('consultant_slug')->default('');
            $table->unsignedBigInteger('price_amount')->default(0);
            $table->unsignedInteger('clean_area')->default(0);
            $table->date('updated_on')->nullable();
            $table->string('latitude', 32)->default('');
            $table->string('longitude', 32)->default('');
            $table->unsignedInteger('list_rank')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'list_rank']);
            $table->index(['ad_type_id', 'process_type_id']);
            $table->index(['city_id', 'county_id']);
            $table->index(['office_id', 'consultant_id']);
            $table->index(['price_amount', 'updated_on']);
        });

        Schema::create('cms_listing_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_listing_id')->constrained('cms_listings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('title');
            $table->json('card')->nullable();
            $table->json('detail')->nullable();
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_listing_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('listing_inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_listing_id')->constrained('cms_listings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('subject')->default('');
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->default('');
            $table->text('message');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_inquiries');
        Schema::dropIfExists('cms_listing_translations');
        Schema::dropIfExists('cms_listings');
    }
};
