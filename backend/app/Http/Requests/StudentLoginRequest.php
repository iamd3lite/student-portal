<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StudentLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'matric_number' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }
}
