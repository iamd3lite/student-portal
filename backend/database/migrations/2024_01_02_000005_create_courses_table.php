<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20);                        // e.g. CSC 301
            $table->string('title');
            $table->unsignedTinyInteger('unit')->default(3);   // credit units
            $table->foreignId('department_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->unsignedSmallInteger('level');             // 100, 200, ...
            $table->string('prerequisite')->nullable();
            $table->unsignedInteger('capacity')->default(120); // max students that can enrol
            $table->timestamps();

            // A course code is unique within a given semester.
            $table->unique(['code', 'semester_id']);
            $table->index(['department_id', 'semester_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
