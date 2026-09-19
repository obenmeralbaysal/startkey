<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CRM office and consultant rows for the public Ofisler / Danışmanlar templates.
 * Superadmin / Reonix will later write the same tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_offices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('short_slug', 80)->default('');
            $table->string('country_id', 40)->nullable();
            $table->string('city_id', 40)->nullable();
            $table->string('county_id', 40)->nullable();
            $table->string('city_label')->default('');
            $table->string('county_label')->default('');
            $table->string('latitude', 32)->default('');
            $table->string('longitude', 32)->default('');
            $table->unsignedInteger('list_rank')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'list_rank']);
            $table->index(['city_id', 'county_id']);
            $table->index('short_slug');
        });

        Schema::create('cms_office_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_office_id')->constrained('cms_offices')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('short_path');
            $table->string('name');
            $table->json('card')->nullable();
            $table->json('detail')->nullable();
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_office_id', 'locale']);
            $table->unique('url_path');
            $table->index('short_path');
        });

        Schema::create('cms_consultants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('slug')->default('');
            $table->string('office_id', 40)->nullable();
            $table->string('city_id', 40)->nullable();
            $table->string('first_name')->default('');
            $table->string('last_name')->default('');
            $table->boolean('has_full_detail')->default(true);
            $table->boolean('published')->default(true);
            $table->unsignedInteger('list_rank')->default(0);
            $table->timestamps();

            $table->index(['published', 'list_rank']);
            $table->index(['office_id', 'city_id']);
            $table->index(['first_name', 'last_name']);
        });

        Schema::create('cms_consultant_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_consultant_id')->constrained('cms_consultants')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('name');
            $table->string('role')->default('');
            $table->json('card')->nullable();
            $table->json('detail')->nullable();
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_consultant_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('consultant_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_consultant_id')->constrained('cms_consultants')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone')->default('');
            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('comment');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultant_comments');
        Schema::dropIfExists('cms_consultant_translations');
        Schema::dropIfExists('cms_consultants');
        Schema::dropIfExists('cms_office_translations');
        Schema::dropIfExists('cms_offices');
    }
};
