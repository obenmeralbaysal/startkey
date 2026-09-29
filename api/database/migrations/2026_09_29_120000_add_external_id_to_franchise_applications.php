<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('franchise_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('external_id')->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('franchise_applications', function (Blueprint $table) {
            $table->dropUnique(['franchise_applications_external_id_unique']);
            $table->dropColumn('external_id');
        });
    }
};
