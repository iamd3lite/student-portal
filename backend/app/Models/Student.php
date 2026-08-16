<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Student extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'matric_number',
        'email',
        'phone',
        'department_id',
        'level',
        'password',
        'photo_path',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'password' => 'hashed',
        ];
    }

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(CourseRegistration::class);
    }

    /**
     * All courses this student has registered (through the pivot).
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_registrations')
            ->withPivot(['status', 'note', 'semester_id', 'submitted_at', 'reviewed_at'])
            ->withTimestamps();
    }
}
