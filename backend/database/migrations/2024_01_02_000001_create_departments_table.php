<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();          // e.g. CSC
            $table->string('name');                          // e.g. Computer Science
            $table->string('programme');                     // e.g. B.Sc. Computer Science
            $table->string('faculty')->nullable();           // e.g. Computing and Information Technology
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
