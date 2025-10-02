<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClerkAuthController extends Controller
{
    public function syncUser(Request $request)
    {
        Log::info('Clerk sync started', ['clerk_user_id' => $request->input('clerk_user_id')]);

        $clerkUserId = $request->input('clerk_user_id');

        if (!$clerkUserId) {
            Log::error('Clerk user ID missing');
            return response()->json(['error' => 'Clerk user ID required'], 400);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('CLERK_SECRET_KEY'),
            ])->get("https://api.clerk.com/v1/users/{$clerkUserId}");

            if ($response->failed()) {
                Log::error('Clerk API failed', ['response' => $response->body()]);
                return response()->json(['error' => 'Invalid Clerk user', 'details' => $response->body()], 401);
            }

            $clerkUser = $response->json();

            Log::info('Clerk user data', ['clerk_user' => $clerkUser]);

            $email = $clerkUser['email_addresses'][0]['email_address'] ?? null;

            if (!$email) {
                return response()->json(['error' => 'Email not found in Clerk user'], 400);
            }

            // Ambil phone number atau set default
            $phoneNumber = null;
            if (!empty($clerkUser['phone_numbers']) && isset($clerkUser['phone_numbers'][0]['phone_number'])) {
                $phoneNumber = $clerkUser['phone_numbers'][0]['phone_number'];
            }

            // Cek apakah user dengan clerk_id sudah ada
            $user = User::where('clerk_id', $clerkUserId)->first();

            if ($user) {
                $user->update([
                    'email' => $email,
                    'name' => trim(($clerkUser['first_name'] ?? '') . ' ' . ($clerkUser['last_name'] ?? '')),
                    'phone_number' => $phoneNumber,
                    'avatar' => $clerkUser['profile_image_url'] ?? null,
                ]);
            } else {
                // Cek apakah user dengan email sudah ada (tanpa clerk_id)
                $user = User::where('email', $email)->first();

                if ($user) {
                    // User ada tapi belum punya clerk_id, update dengan clerk_id
                    $user->update([
                        'clerk_id' => $clerkUserId,
                        'name' => trim(($clerkUser['first_name'] ?? '') . ' ' . ($clerkUser['last_name'] ?? '')),
                        'phone_number' => $phoneNumber,
                        'avatar' => $clerkUser['profile_image_url'] ?? null,
                    ]);
                } else {
                    // User baru, buat dari awal
                    $user = User::create([
                        'clerk_id' => $clerkUserId,
                        'email' => $email,
                        'name' => trim(($clerkUser['first_name'] ?? '') . ' ' . ($clerkUser['last_name'] ?? '')),
                        'phone_number' => $phoneNumber,
                        'avatar' => $clerkUser['profile_image_url'] ?? null,
                        'password' => Hash::make(Str::random(32)),
                    ]);
                }
            }

            Log::info('User created/updated', ['user_id' => $user->id]);

            // Login user ke Laravel session
            Auth::login($user, true);

            Log::info('User logged in', ['auth_id' => Auth::id()]);

            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('Sync error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Sync failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }
}
