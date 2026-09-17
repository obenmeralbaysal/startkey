<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Akademi (seminars/trainings) CMS rows, İletişim page payload, and the public
 * write tables for the two observed forms. Superadmin will later write the same
 * CMS tables; submissions are stored locally until a mail/CRM destination exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_page_translations', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('meta');
        });

        Schema::create('cms_trainings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('group', 32)->default('completed');
            $table->boolean('published')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['published', 'position']);
        });

        Schema::create('cms_training_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_training_id')->constrained('cms_trainings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('card_url_path')->default('');
            $table->string('title');
            $table->string('list_image')->default('');
            $table->json('info_lines')->nullable();
            $table->string('detail_label')->default('');
            $table->string('date_prefix')->default('');
            $table->string('date_value')->default('');
            $table->string('time_prefix')->default('');
            $table->string('time_value')->default('');
            $table->string('price_prefix')->default('');
            $table->string('price_value')->default('');
            $table->string('image')->default('');
            $table->string('location_heading')->default('');
            $table->string('location_value')->default('');
            $table->string('description_heading')->default('');
            $table->longText('description_html')->nullable();
            $table->string('form_heading')->default('');
            $table->json('form')->nullable();
            $table->string('related_heading')->default('');
            $table->json('related')->nullable();
            $table->string('page_heading')->default('');
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_training_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 5);
            $table->string('name');
            $table->string('surname');
            $table->string('email');
            $table->string('phone')->default('');
            $table->string('subject')->default('');
            $table->text('message');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        Schema::create('training_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_training_id')->constrained('cms_trainings')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('first_name')->default('');
            $table->string('last_name')->default('');
            $table->string('email');
            $table->string('phone')->default('');
            $table->unsignedTinyInteger('gender_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['cms_training_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_applications');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('cms_training_translations');
        Schema::dropIfExists('cms_trainings');

        Schema::table('cms_page_translations', function (Blueprint $table) {
            $table->dropColumn('payload');
        });
    }
};
