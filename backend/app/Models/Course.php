<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'unit',
        'department_id',
        'semester_id',
        'level',
        'prerequisite',
        'capacity',
    ];

    protected function casts(): array
    {
        return [
            'unit' => 'integer',
            'level' => 'integer',
            'capacity' => 'integer',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(CourseRegistration::class);
    }

    /**
     * Number of students currently registered for this course.
     */
    public function registeredCount(): int
    {
        return $this->registrations()->count();
    }

    /**
     * Whether the course still has an open slot.
     */
    public function hasCapacity(): bool
    {
        return $this->registeredCount() < $this->capacity;
    }

    public function remainingCapacity(): int
    {
        return max(0, $this->capacity - $this->registeredCount());
    }
}
