<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Options of the homepage search bar dropdowns (property types, process types,
 * countries, cities and counties). Rows are grouped per dropdown and optionally
 * linked to a parent option's external id, which is what the dependent dropdowns
 * filter on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lookup_items', function (Blueprint $table) {
            $table->id();
            $table->string('group', 40);
            $table->string('external_id', 40);
            $table->string('parent_external_id', 40)->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['group', 'external_id', 'parent_external_id'], 'lookup_items_identity_unique');
            $table->index(['group', 'parent_external_id', 'position'], 'lookup_items_lookup_index');
        });

        Schema::create('lookup_item_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lookup_item_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('label');
            $table->timestamps();

            $table->unique(['lookup_item_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lookup_item_translations');
        Schema::dropIfExists('lookup_items');
    }
};
