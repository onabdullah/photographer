<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;

class MerchantController extends Controller
{
    public function updateCredits(Request $request, string $id)
    {
        $request->validate([
            'ai_credits_balance' => 'required|integer|min:0',
        ]);

        $merchant = Merchant::findOrFail($id);
        $merchant->ai_credits_balance = (int) $request->input('ai_credits_balance');
        $merchant->save();

        return redirect()->back();
    }
}
