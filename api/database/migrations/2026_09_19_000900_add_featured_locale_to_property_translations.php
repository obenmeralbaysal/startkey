<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Live Startkey shows a different featured carousel per language. Position and
 * inclusion are therefore stored on the translation, not only on the property.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_translations', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('featured_position')->default(0);
            $table->index(['locale', 'is_featured', 'featured_position']);
        });
    }

    public function down(): void
    {
        Schema::table('property_translations', function (Blueprint $table) {
            $table->dropIndex(['locale', 'is_featured', 'featured_position']);
            $table->dropColumn(['is_featured', 'featured_position']);
        });
    }
};
