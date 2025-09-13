<?php

namespace App\Http\Controllers;

use App\Enum\Currency;
use App\Models\Cards;
use App\Models\Transactions;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CardsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $transactions = Transactions::with('cards')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        $cards = Cards::where('user_id', Auth::id())->get();

        return Inertia::render('home/index', [
            'auth' => [
                'user' => Auth::user(),
            ],
            'transactions' => $transactions,
            'cards' => $cards,
        ]);
    }

    public function indexBalance() 
    {
        
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'currency' => ["required", 'integer', Rule::in(Currency::values())],
            'name' => 'required|string|max:30',
            'card_number' => 'nullable|string|max:100',
            'balance' => 'nullable|numeric||min:0'
        ]);

        Cards::create([
            'user_id' => Auth::id(),
            'currency' => $validated['currency'],
            'name' => $validated['name'],
            'card_number' => $validated['card_number'],
            'balance' => 0
        ]);

        return redirect()->route('home.index')->with('success', 'Cards berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $card = Cards::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $card->delete();

        return redirect()->route('home.index')->with('success', 'Card berhasil dihapus');
    }
}
