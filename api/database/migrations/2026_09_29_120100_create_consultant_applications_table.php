<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultant_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_id')->nullable()->unique();
            $table->string('locale', 5);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone');
            $table->unsignedInteger('city_id');
            $table->unsignedInteger('county_id')->nullable();
            $table->unsignedBigInteger('office_id');
            $table->unsignedTinyInteger('position');
            $table->text('notes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultant_applications');
    }
};
