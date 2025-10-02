<?php

namespace App\Http\Controllers;

use App\Enum\Asset;
use App\Enum\Category;
// use App\Enum\Currency;
use App\Enum\TransactionsType;
use App\Models\Cards;
use App\Models\Transactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TransactionsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $transactions = Transactions::with(['fromCard', 'toCard'])
                ->where('user_id', Auth::id())
                ->latest()
                ->get();
        } catch (\Exception $e) {
             dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }

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
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'transaction_date' => 'required|date',
                'amount' => 'required|numeric|min:1',
                'notes' => 'nullable|string',
                'asset' => 'required|string',
                'category' => 'required|string',
                'type' => ['required', 'string', Rule::in(TransactionsType::values())],
                'to_cards_id' => 'required|exists:cards,id',
            ], [
                'amount.required' => 'Amount is required',
                'amount.min' => 'Amount must be greater than 0',
                'asset.required' => 'Asset is required',
                'category.required' => 'Category is required',
                'transaction_date.required' => 'Date is required',
                'to_cards_id.required' => 'Card destination is required',
            ]);

            $validIncomeCategories = [
                Category::SALLARY->value,
                Category::ALLOWANCE->value,
                Category::BUSINESS->value,
            ];

            if ($validated['type'] === TransactionsType::INCOME->value) {
                if (! in_array($validated['category'], $validIncomeCategories)) {
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
                    'notes' => $validated['notes'] ?? '',
                    'transaction_date' => $validated['transaction_date'],
                ]);

                $card = Cards::find($validated['to_cards_id']); // Gunakan to_cards_id
                if ($card) {
                    $card->balance += $validated['amount'];
                    $card->save();
                }

                DB::commit();

                return redirect()->back()->with('success', 'Transaksi berhasil ditambahkan');
            }

            return back()->withErrors(['type' => 'Invalid transaction type']);
        } catch (\Exception $e) {
             dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function storeExpense(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->validate([
                'transaction_date' => 'required|date',
                'amount' => 'required|numeric|min:1',
                'notes' => 'nullable|string',
                'asset' => 'required|string',
                'category' => 'required|string',
                'type' => ['required', 'string', Rule::in(TransactionsType::values())],
                'from_cards_id' => 'required|exists:cards,id',
            ]);

            // dd($data);
            if ($data['type'] === TransactionsType::EXPENSE->value) {
                if (!in_array($data['category'], [
                    Category::FOOD_DRINKS->value,
                    Category::TRANSPORTATION->value,
                    Category::HEALTH->value,
                    Category::TOPUP->value,
                    Category::SHOPPING->value,
                    Category::SAVINGS_INVESTMENTS->value,
                    Category::TRAVEL->value,
                ])) {
                    return back()->withErrors(['category' => 'Invalid income category']);
                }

                $card = Cards::findOrFail($data['from_cards_id']);

                if ($card->balance < $data['amount']) {
                    return back()->withErrors([
                        'amount' => 'Insufficient balance to perform this transaction.',
                    ]);
                };

                Transactions::create([
                    'user_id' => Auth::id(),
                    'type' => $data['type'],
                    'from_cards_id' => $data['from_cards_id'],
                    'amount' => $data['amount'],
                    'asset' => $data['asset'],
                    'category' => $data['category'],
                    'notes' => $data['notes'] ?? '',
                    'transaction_date' => $data['transaction_date'],
                ]);

                $card = Cards::find($data['from_cards_id']);
                if ($card) {
                        if ($card->balance < $data['amount']) {
                            return back()->withErrors([
                                'amount' => 'The balance is insufficient to perform this transaction.',
                            ]);
                        }

                        $card->balance -= $data['amount'];
                        $card->save();
                }
                DB::commit();

                return back()->with('success', 'Transaksi berhasil ditambahkan');
            }

            return back()->withErrors(['type' => 'Invalid transaction type']);
        } catch (\Exception $e) {
             dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function storeConvert(Request $request)
    {
        try {
            $request->validate([
                'from_cards_id' => 'required|exists:cards,id',
                'to_cards_id' => 'required|exists:cards,id|different:from_cards_id',
                'amount' => 'required|numeric|min:0.01',
                'converted_amount' => 'required|numeric|min:0.01',
                'rate' => 'required|numeric|min:0',
            ], [
                'to_cards_id.different' => 'Source and destination cards must be different.',
                'amount.min' => 'Amount must be greater than 0.',
            ]);

            $fromCard = Cards::findOrFail($request->from_cards_id);
            $toCard = Cards::findOrFail($request->to_cards_id);

            // Kurangi dari kartu asal
            $fromCard->balance -= $request->amount;
            $fromCard->save();

            // Tambah ke kartu tujuan (hasil konversi)
            $toCard->balance += $request->converted_amount;
            $toCard->save();

            Transactions::create([
                'user_id' => Auth::id(),
                'type' => TransactionsType::CONVERT->value,
                'from_cards_id' => $fromCard->id,
                'to_cards_id' => $toCard->id,
                'amount' => $request->amount,
                'converted_amount' => $request->converted_amount,
                'rate' => $request->rate,
                'notes' => $request->notes,
                'asset' => Asset::TRANSFER->value,
                'currency' => $toCard->currency,
                'transaction_date' => now(),
            ]);

            return back()->with('success', 'Conversion successful!');
        } catch (\Exception $e) {
             dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function getRate(Request $request)
    {
        $request->validate([
            'from_cards_id' => 'required|exists:cards,id',
            'to_cards_id' => 'required|exists:cards,id|different:from_cards_id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $fromCard = Cards::findOrFail($request->from_cards_id);
        $toCard = Cards::findOrFail($request->to_cards_id);

        if ($fromCard->balance < $request->amount) {
            return response()->json(['error' => 'Insufficient balance'], 400);
        }

        // Langsung pakai karena sudah instance Currency
        $fromCurrency = $fromCard->currency->toISO();
        $toCurrency = $toCard->currency->toISO();

        // Kalau currency sama, rate = 1
        if ($fromCurrency === $toCurrency) {
            return response()->json([
                'rate' => 1,
                'converted_amount' => $request->amount,
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
            ]);
        }

        try {
            $response = Http::timeout(10)->get('https://api.freecurrencyapi.com/v1/latest', [
                'apikey' => env('CURRENCY_API_KEY'),
                'currencies' => $toCurrency,
                'base_currency' => $fromCurrency,
            ]);

            if ($response->failed()) {
                // \Log::error('Currency API failed', [
                //     'status' => $response->status(),
                //     'body' => $response->body(),
                // ]);

                return response()->json(['error' => 'Failed to fetch exchange rate from API'], 500);
            }

            $data = $response->json();
            $rate = $data['data'][$toCurrency] ?? null;

            if (! $rate) {
                // \Log::error('Invalid rate response', ['data' => $data]);

                return response()->json(['error' => 'Invalid exchange rate'], 400);
            }

            return response()->json([
                'rate' => $rate,
                'converted_amount' => $request->amount * $rate,
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
            ]);
        } catch (\Exception $e) {
            // \Log::error('Currency conversion error: '.$e->getMessage());

            return response()->json(['error' => 'Failed to fetch exchange rate'], 500);
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
