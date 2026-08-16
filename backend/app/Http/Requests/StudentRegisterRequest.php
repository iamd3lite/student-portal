<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StudentRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'matric_number' => ['required', 'string', 'max:30', 'unique:students,matric_number'],
            'email' => ['required', 'email', 'max:255', 'unique:students,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'level' => ['required', 'integer', 'in:100,200,300,400,500'],
            'password' => ['required', 'confirmed', Password::min(6)],
        ];
    }

    public function messages(): array
    {
        return [
            'matric_number.unique' => 'An account with this matric number already exists.',
            'email.unique' => 'An account with this email already exists.',
            'department_id.exists' => 'The selected department is invalid.',
            'level.in' => 'Level must be one of 100, 200, 300, 400 or 500.',
        ];
    }
}
