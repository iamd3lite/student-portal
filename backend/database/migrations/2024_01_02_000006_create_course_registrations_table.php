<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();

            // Admin validation workflow for the whole submitted form.
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('note')->nullable();                  // admin note on rejection
            $table->foreignId('reviewed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            // DB-level guarantee: a student can register a given course only once.
            $table->unique(['student_id', 'course_id']);
            $table->index(['student_id', 'semester_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_registrations');
    }
};
