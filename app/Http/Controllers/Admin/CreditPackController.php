<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditPack;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CreditPackController extends Controller
{
    /* ─── Index ─────────────────────────────────────────────────── */

    public function index()
    {
        $creditPacks = CreditPack::orderBy('sort_order')->get()->map(fn (CreditPack $pack) => [
            'id'              => $pack->id,
            'credits'         => $pack->credits,
            'price'           => (float) $pack->price,
            'per_credit_cost' => $pack->per_credit_cost ? (float) $pack->per_credit_cost : null,
            'is_popular'      => (bool) $pack->is_popular,
            'is_active'       => (bool) $pack->is_active,
            'sort_order'      => $pack->sort_order,
        ])->values();

        $stats = [
            'total_packs'   => $creditPacks->count(),
            'active_packs'  => $creditPacks->where('is_active', true)->count(),
        ];

        return Inertia::render('Admin/Pages/CreditPacks/Index', [
            'creditPacks' => $creditPacks,
            'stats'       => $stats,
        ]);
    }

    /* ─── Store ──────────────────────────────────────────────────── */

    public function store(Request $request)
    {
        $data = $request->validate([
            'credits'         => ['required', 'integer', 'min:1'],
            'price'           => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'per_credit_cost' => ['nullable', 'numeric', 'min:0'],
            'is_popular'      => ['boolean'],
            'is_active'       => ['boolean'],
            'sort_order'      => ['nullable', 'integer', 'min:0'],
        ]);

        // Ensure only one popular pack
        if (!empty($data['is_popular'])) {
            CreditPack::where('is_popular', true)->update(['is_popular' => false]);
        }

        // Auto-calculate per_credit_cost if not provided
        if (empty($data['per_credit_cost']) && !empty($data['credits'])) {
            $data['per_credit_cost'] = round($data['price'] / $data['credits'], 4);
        }

        // Auto-assign sort_order if not provided
        if (!isset($data['sort_order'])) {
            $data['sort_order'] = CreditPack::max('sort_order') + 1 ?? 0;
        }

        $pack = CreditPack::create($data);

        return redirect()->route('admin.credit-packs.index')->with('success', "Credit pack '{$pack->credits} credits' created successfully.");
    }

    /* ─── Update ─────────────────────────────────────────────────── */

    public function update(Request $request, CreditPack $creditPack)
    {
        $data = $request->validate([
            'credits'         => ['required', 'integer', 'min:1'],
            'price'           => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'per_credit_cost' => ['nullable', 'numeric', 'min:0'],
            'is_popular'      => ['boolean'],
            'is_active'       => ['boolean'],
            'sort_order'      => ['nullable', 'integer', 'min:0'],
        ]);

        // Ensure only one popular pack
        if (!empty($data['is_popular']) && !$creditPack->is_popular) {
            CreditPack::where('is_popular', true)->update(['is_popular' => false]);
        }

        // Auto-calculate per_credit_cost if not provided
        if (empty($data['per_credit_cost']) && !empty($data['credits'])) {
            $data['per_credit_cost'] = round($data['price'] / $data['credits'], 4);
        }

        $creditPack->update($data);

        return redirect()->back()->with('success', "Credit pack updated successfully.");
    }

    /* ─── Destroy ────────────────────────────────────────────────── */

    public function destroy(CreditPack $creditPack)
    {
        $creditPack->delete();

        return redirect()->back()->with('success', "Credit pack deleted successfully.");
    }
}
