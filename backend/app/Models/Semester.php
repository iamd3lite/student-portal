<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Semester extends Model
{
    use HasFactory;

    protected $fillable = [
        'session',
        'term',
        'name',
        'is_current',
        'registration_open',
    ];

    protected function casts(): array
    {
        return [
            'term' => 'integer',
            'is_current' => 'boolean',
            'registration_open' => 'boolean',
        ];
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(CourseRegistration::class);
    }

    /**
     * The currently active semester (registration window).
     */
    public static function current(): ?self
    {
        return static::query()->where('is_current', true)->first();
    }
}
