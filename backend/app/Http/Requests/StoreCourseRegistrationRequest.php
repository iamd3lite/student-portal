<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_ids' => ['required', 'array', 'min:1'],
            'course_ids.*' => ['integer', 'distinct', 'exists:courses,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'course_ids.required' => 'Select at least one course to register.',
            'course_ids.*.distinct' => 'You cannot submit the same course twice.',
            'course_ids.*.exists' => 'One or more selected courses do not exist.',
        ];
    }
}
