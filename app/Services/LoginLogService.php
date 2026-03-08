<?php

namespace App\Services;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LoginLogService
{
    /**
     * Resolve location string from IP (non-blocking; returns 'Unknown' on failure).
     */
    public static function locationFromIp(string $ip): string
    {
        if (in_array($ip, ['127.0.0.1', '::1'], true)) {
            return 'Local';
        }
        try {
            $response = Http::timeout(2)->get("http://ip-api.com/json/{$ip}?fields=city,regionName,country");
            if ($response->successful()) {
                $data = $response->json();
                $parts = array_filter([$data['city'] ?? null, $data['regionName'] ?? null, $data['country'] ?? null]);
                return implode(', ', $parts) ?: 'Unknown';
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return 'Unknown';
    }

    public static function logSuccess(Request $request, User $user): void
    {
        $ip = $request->ip() ?? '0.0.0.0';
        $location = self::locationFromIp($ip);
        $risk = LoginLog::computeRisk($ip, LoginLog::STATUS_SUCCESS);

        LoginLog::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'status' => LoginLog::STATUS_SUCCESS,
            'location' => $location,
            'risk_percentage' => $risk,
        ]);

        $user->update(['last_login_at' => now()]);
    }

    public static function logFailed(Request $request, string $email): void
    {
        $ip = $request->ip() ?? '0.0.0.0';
        $location = self::locationFromIp($ip);
        $risk = LoginLog::computeRisk($ip, LoginLog::STATUS_FAILED);

        LoginLog::create([
            'user_id' => null,
            'email' => $email,
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'status' => LoginLog::STATUS_FAILED,
            'location' => $location,
            'risk_percentage' => $risk,
        ]);
    }
}
