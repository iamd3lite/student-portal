<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->string('session', 20);                   // e.g. 2025/2026
            $table->unsignedTinyInteger('term');             // 1 = First, 2 = Second
            $table->string('name');                          // e.g. First Semester
            $table->boolean('is_current')->default(false);   // the active registration window
            $table->boolean('registration_open')->default(true);
            $table->timestamps();

            // A session cannot have two identical terms.
            $table->unique(['session', 'term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semesters');
    }
};
