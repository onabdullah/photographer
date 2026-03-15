<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLiveChatSyncSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user('admin') ?? $this->user();

        if (! $user) {
            return false;
        }

        if (isset($user->role) && $user->role === 'super_admin') {
            return true;
        }

        return $user->can('live_chat.manage');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'realtime_enabled' => 'required|boolean',
            'auto_fallback_enabled' => 'required|boolean',
            'manual_refresh_interval_seconds' => 'required|integer|min:3|max:60',
            'auto_return_realtime' => 'required|boolean',
            'fallback_threshold_seconds' => 'required|integer|min:3|max:300',
            'recovery_threshold_seconds' => 'required|integer|min:3|max:300',
            'show_status_badge_agents' => 'required|boolean',
            'show_status_badge_customers' => 'required|boolean',
        ];
    }
}
