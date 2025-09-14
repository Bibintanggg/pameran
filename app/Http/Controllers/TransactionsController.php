<?php

namespace App\Http\Controllers;

use App\Enum\Category;
use App\Enum\TransactionsType;
use App\Models\Cards;
use App\Models\Transactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
            'type' => ['required', 'integer', Rule::in(TransactionsType::values())],
            'to_cards_id' => 'required|exists:cards,id',
        ]);

        if ($validated['type'] === TransactionsType::INCOME->value) {
            if (!in_array($validated['category'], [
                Category::SALLARY->value,
                Category::ALLOWANCE->value,
                Category::BONUS->value
            ])) {
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

            return redirect()->route('home.index')->with('success', 'Transaksi berhasil ditambahkan');
        }
        return back()->withErrors(['type' => 'Invalid transaction type']);
    }

    public function storeExpense(Request $request)
    {
        $data = $request->validate([
            'transaction_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
            'asset' => 'required|integer',
            'category' => 'required|integer',
            'type' => ['required', 'integer', Rule::in(TransactionsType::values())],
            'to_cards_id' => 'required|exists:cards,id'
        ]);

        // dd($data);
        if ($data['type'] === TransactionsType::EXPENSE->value) {
            if (!in_array($data['category'], [
                Category::FOOD_DRINKS->value,
                Category::TRANSPORTATION->value,
                Category::GROCERIES->value,
                Category::HEALTH->value,
                Category::SHOPPING->value,
                Category::SAVINGS_INVESTMENTS->value,
                Category::TRAVEL->value,
            ])) {
                return back()->withErrors(['category' => 'Invalid income category']);
            }

            Transactions::create([
                'user_id' => Auth::id(),
                'type' => $data['type'],
                'to_cards_id' => $data['to_cards_id'],
                'amount' => $data['amount'],
                'asset' => $data['asset'],
                'category' => $data['category'],
                'notes' => $data['notes'] ?? "",
                'transaction_date' => $data['transaction_date'],
            ]);

            $card = Cards::find($data['to_cards_id']); // Gunakan to_cards_id
            if ($card) {
                if ($card) {
                    if ($card->balance < $data['amount']) {
                        return back()->withErrors([
                            'amount' => 'The balance is insufficient to perform this transaction.',
                        ]);
                    }

                    $card->balance -= $data['amount'];
                    $card->save();
                }
            }


            return redirect()->route('home.index')->with('success', 'Transaksi berhasil ditambahkan');
        };
        return back()->withErrors(['type' => 'Invalid transaction type']);
    }

    public function storeConvert(Request $request)
    {
        $validated = $request->validate([
            'from_cards_id' => 'required|exists:cards,id',
            'to_cards_id' => 'required|exists:cards,id|different:from_cards_id',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:255',
        ], [
            'to_cards_id.different' => 'Source and destination cards must be different.',
            'amount.min' => 'Amount must be greater than 0.'
        ]);

        // Pastikan kedua kartu milik user yang sedang login
        $fromCard = Cards::where('id', $validated['from_cards_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $toCard = Cards::where('id', $validated['to_cards_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Cek apakah saldo mencukupi
        if ($fromCard->balance < $validated['amount']) {
            return back()->withErrors([
                'amount' => 'Insufficient balance in source card. Available: ' . number_format($fromCard->balance, 2),
            ]);
        }

        // Gunakan database transaction untuk memastikan konsistensi data
        DB::transaction(function () use ($validated, $fromCard, $toCard) {
            // Kurangi saldo dari kartu asal
            $fromCard->decrement('balance', $validated['amount']);

            // Tambah saldo ke kartu tujuan
            $toCard->increment('balance', $validated['amount']);

            // Buat record transaksi
            Transactions::create([
                'user_id' => Auth::id(),
                'type' => TransactionsType::CONVERT->value,
                'from_cards_id' => $fromCard->id,
                'to_cards_id' => $toCard->id,
                'amount' => $validated['amount'],
                'asset' => 2, // Sesuaikan dengan enum Asset Anda
                'rate' => null,
                'notes' => $validated['notes'],
                'transaction_date' => now()->toDateString(),
                'category' => null,
            ]);
        });

        return redirect()->back()->with('success', 'Convert transaction completed successfully!');
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
