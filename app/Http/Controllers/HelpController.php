<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use Illuminate\Http\Request;

class HelpController extends Controller
{
    use GetsCurrentShop;

    public function help(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        return \Inertia\Inertia::render('Shopify/Help', [
            'shopName' => $shop->name ?? 'Shop',
        ]);
    }
}
