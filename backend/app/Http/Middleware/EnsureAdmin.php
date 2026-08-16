<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Allow the request only when the authenticated user is an Admin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Admin) {
            return response()->json([
                'message' => 'This action is only available to administrators.',
            ], 403);
        }

        return $next($request);
    }
}
