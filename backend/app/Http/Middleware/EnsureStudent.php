<?php

namespace App\Http\Middleware;

use App\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudent
{
    /**
     * Allow the request only when the authenticated user is a Student.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Student) {
            return response()->json([
                'message' => 'This action is only available to students.',
            ], 403);
        }

        return $next($request);
    }
}
