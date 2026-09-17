<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Homepage data that the public website reads from the API: the counter strip, the
 * featured portfolio carousel and the popular city cards. Each record keeps its
 * locale-dependent labels in a companion translation table so the API can answer in
 * Turkish, English and German.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_stats', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('icon');
            $table->unsignedBigInteger('value');
            $table->string('suffix')->default('');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index('position');
        });

        Schema::create('site_stat_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_stat_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->timestamps();

            $table->unique(['site_stat_id', 'locale']);
        });

        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('image');
            $table->string('rooms')->default('');
            $table->string('area')->default('');
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['is_featured', 'position']);
        });

        Schema::create('property_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('process_type');
            $table->string('ad_sub_type');
            $table->string('ad_type');
            $table->string('price');
            $table->string('title');
            $table->string('location');
            $table->string('detail_label');
            $table->timestamps();

            $table->unique(['property_id', 'locale']);
        });

        Schema::create('popular_cities', function (Blueprint $table) {
            $table->id();
            $table->string('city_code')->unique();
            $table->string('image');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index('position');
        });

        Schema::create('popular_city_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('popular_city_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->string('url_path');
            $table->timestamps();

            $table->unique(['popular_city_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('popular_city_translations');
        Schema::dropIfExists('popular_cities');
        Schema::dropIfExists('property_translations');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('site_stat_translations');
        Schema::dropIfExists('site_stats');
    }
};
