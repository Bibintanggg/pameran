<?php

namespace App\Http\Controllers;

use App\Enum\Category;
use App\Enum\TransactionsType;
use App\Models\Cards;
use App\Models\Transactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransactionsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $transactions = Transactions::with('cards')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('home/index', [
            'transactions' => $transactions,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function storeIncome(Request $request)
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
            'asset' => 'required|integer',
            'category' => 'nullable|integer',
            'type' => ['required ','integer', Rule::in(TransactionsType::values())],
            'card_id' => 'required|exists:cards,id',
        ]);

        
        if ($validated['type'] === TransactionsType::INCOME->value) {
            if (!in_array($validated['category'], [Category::SALLARY->value, Category::ALLOWANCE->value, Category::BONUS->value])) {
                return back()->withErrors(['category' => 'Invalid income category']);
            }
            Transactions::create([
                'user_id' => Auth::id(),
                'type' => 1,
                'to_card_id' => $validated['card_id'],
                'amount' => $validated['amount'],
                'asset' => $validated['asset'],
                'category' => $validated['category'],
                'notes' => $validated['notes'],
                'transaction_date' => $validated['transaction_date'],
            ]);
            
            // dd($validated);

            $card = Cards::find($validated['card_id']);
            $card->balance += $validated['amount'];
            $card->save();

            return redirect()->route('home.index')->with('succes', 'Transaksi ditambah');
        }
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
        //
    }
}
