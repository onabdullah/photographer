<?php

namespace App\Http\Requests;

use App\Models\LiveChatConversation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLiveChatConversationStateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user('admin') ?? $this->user();

        return (bool) $user && $user->can('live_chat.manage');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => 'required|string|in:active,waiting,end,convert,spam,block,mute,unmute,unspam,restore',
            'status' => 'nullable|string|in:' . implode(',', LiveChatConversation::allStatuses()),
            'reason' => 'nullable|string|max:500',
        ];
    }
}
