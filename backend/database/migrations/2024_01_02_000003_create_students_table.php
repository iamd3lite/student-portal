<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('matric_number', 30)->unique();     // login identifier
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->foreignId('department_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedSmallInteger('level');             // 100, 200, ...
            $table->string('password');
            $table->string('photo_path')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['department_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
