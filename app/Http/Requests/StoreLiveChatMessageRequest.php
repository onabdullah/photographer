<?php

namespace App\Http\Requests;

use App\Models\LiveChatMessage;
use Illuminate\Foundation\Http\FormRequest;

class StoreLiveChatMessageRequest extends FormRequest
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
            'body' => 'nullable|string|max:4000|required_without:attachments',
            'message_type' => 'nullable|string|in:' . implode(',', [
                LiveChatMessage::TYPE_TEXT,
                LiveChatMessage::TYPE_ATTACHMENT,
                LiveChatMessage::TYPE_SYSTEM,
            ]),
            'is_internal_note' => 'nullable|boolean',
            'client_uid' => 'nullable|string|max:64',
            'attachments' => 'nullable|array|max:5|required_without:body',
            'attachments.*.name' => 'required|string|max:255',
            'attachments.*.size' => 'nullable|integer|min:0|max:26214400',
            'attachments.*.type' => 'nullable|string|max:120',
            'attachments.*.preview_url' => 'nullable|string|max:2048',
        ];
    }
}
