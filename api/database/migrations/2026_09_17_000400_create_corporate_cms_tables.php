<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kurumsal CMS tables the public website reads and a future Superadmin will write:
 * static pages, article families (news / announcements / blogs), people and champions.
 * Locale-specific copy lives in companion translation tables so a new row can appear
 * in every language without a new Next.js page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_pages', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('published')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('cms_page_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_page_id')->constrained('cms_pages')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('heading')->default('');
            $table->longText('body_html');
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_page_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('cms_articles', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32);
            $table->unsignedBigInteger('external_id');
            $table->boolean('published')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['type', 'external_id']);
            $table->index(['type', 'published', 'position']);
        });

        Schema::create('cms_article_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_article_id')->constrained('cms_articles')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('title');
            $table->string('date_label')->default('');
            $table->string('category')->default('');
            $table->longText('body_html')->nullable();
            $table->string('image')->default('');
            $table->string('image_webp')->default('');
            $table->string('list_image')->default('');
            $table->string('list_image_webp')->default('');
            $table->unsignedInteger('list_width')->nullable();
            $table->unsignedInteger('list_height')->nullable();
            $table->string('share_label')->default('');
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_article_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('cms_people', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->unique();
            $table->string('image')->default('');
            $table->string('image_webp')->default('');
            $table->string('detail_image')->default('');
            $table->string('detail_image_webp')->default('');
            $table->string('email')->default('');
            $table->string('phone_href')->default('');
            $table->json('social')->nullable();
            $table->boolean('published')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('cms_person_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_person_id')->constrained('cms_people')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('name');
            $table->string('role')->default('');
            $table->string('phone_label')->default('');
            $table->string('email_label')->default('');
            $table->string('phone_field_label')->default('');
            $table->string('bio_heading')->default('');
            $table->longText('bio_html')->nullable();
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['cms_person_id', 'locale']);
            $table->unique('url_path');
        });

        Schema::create('cms_champion_groups', function (Blueprint $table) {
            $table->id();
            $table->boolean('published')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('cms_champion_group_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_champion_group_id')->constrained('cms_champion_groups')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('kicker')->default('');
            $table->string('title')->default('');
            $table->timestamps();

            $table->unique(['cms_champion_group_id', 'locale'], 'cms_champion_group_locale_unique');
        });

        Schema::create('cms_champion_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cms_champion_group_id')->constrained('cms_champion_groups')->cascadeOnDelete();
            $table->string('image');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['cms_champion_group_id', 'position']);
        });

        Schema::create('cms_list_pages', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32);
            $table->string('locale', 5);
            $table->string('url_path');
            $table->string('pager_base');
            $table->unsignedInteger('per_page')->default(9);
            $table->string('continue_label')->default('');
            $table->string('heading')->default('');
            $table->json('breadcrumb')->nullable();
            $table->json('meta')->nullable();
            $table->json('sidebar')->nullable();
            $table->timestamps();

            $table->unique(['type', 'locale']);
            $table->unique('url_path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_list_pages');
        Schema::dropIfExists('cms_champion_photos');
        Schema::dropIfExists('cms_champion_group_translations');
        Schema::dropIfExists('cms_champion_groups');
        Schema::dropIfExists('cms_person_translations');
        Schema::dropIfExists('cms_people');
        Schema::dropIfExists('cms_article_translations');
        Schema::dropIfExists('cms_articles');
        Schema::dropIfExists('cms_page_translations');
        Schema::dropIfExists('cms_pages');
    }
};
