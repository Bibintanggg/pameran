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
        $transactions = Transactions::with(['fromCard', 'toCard'])
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
        // Hapus dd() untuk production
        // dd($request->all());

        // $allData = $request->all();
        //     if (!isset($allData['to_cards_id'])) {
        //         // Ambil dari activeCardId yang dikirim dari frontend
        //         $allData['to_cards_id'] = $request->input('activeCardId') ?? 1; // fallback ke 1
        //     }

        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
            'asset' => 'required|integer',
            'category' => 'required|integer',
            'type' => ['required','integer', Rule::in(TransactionsType::values())],
            'to_cards_id' => 'required|exists:cards,id',
        ]);

        if ($validated['type'] === TransactionsType::INCOME->value) {
            if (!in_array($validated['category'], [Category::SALLARY->value, Category::ALLOWANCE->value, Category::BONUS->value])) {
                return back()->withErrors(['category' => 'Invalid income category']);
            }

            // Buat transaksi
            Transactions::create([
                'user_id' => Auth::id(),
                'type' => $validated['type'],
                'to_cards_id' => $validated['to_cards_id'],
                'amount' => $validated['amount'],
                'asset' => $validated['asset'],
                'category' => $validated['category'],
                'notes' => $validated['notes'] ?? "",
                'transaction_date' => $validated['transaction_date'],
            ]);

            $card = Cards::find($validated['to_cards_id']); // Gunakan to_cards_id
            if ($card) {
                $card->balance += $validated['amount'];
                $card->save();
            }

            return redirect()->route('home.index')->with('success', 'Transaksi berhasil ditambahkan'); // ✅ Perbaiki typo 'succes' -> 'success'
        }

        return back()->withErrors(['type' => 'Invalid transaction type']);
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
