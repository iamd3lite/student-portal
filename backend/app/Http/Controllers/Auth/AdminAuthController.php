<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminLoginRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Log an administrator in using only their name + admin ID,
     * matching the demo requirement. The admin must already exist
     * (seeded or created), so unknown IDs are rejected.
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $admin = Admin::where('admin_id', $data['admin_id'])
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($data['name'])])
            ->first();

        if (! $admin) {
            throw ValidationException::withMessages([
                'admin_id' => ['No administrator found with that name and admin ID.'],
            ]);
        }

        $token = $admin->createToken('admin-'.$admin->admin_id, ['admin'])->plainTextToken;

        return response()->json([
            'message' => 'Signed in as administrator.',
            'admin' => $admin,
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['admin' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }
}
