<?php

namespace App\Http\Controllers;

use App\Enum\Asset;
use App\Enum\Category;
use App\Enum\Currency;
use App\Enum\TransactionsType;
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
        $userId = Auth::id();
        $cards = Cards::where('user_id', Auth::id())->get();

        $transactions = Transactions::where('user_id', $userId)
            ->latest()
            ->get()
            ->map(function ($data) {
                return [
                    'id'               => $data->id,
                    'user_name'        => Auth::user()->name,
                    'type'             => $data->type,
                    'type_label'       => TransactionsType::from($data->type)->label(),
                    'amount'           => $data->amount,
                    'formatted_amount' => 'Rp ' . number_format($data->amount, 0, ',', '.'),
                    'notes'            => $data->notes,
                    'asset'            => $data->asset,
                    'asset_label'      => Asset::from($data->asset)->label(),
                    'category'         => $data->category,
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                    'transaction_date' => $data->created_at->format('d F Y'),
                ];
            });

        $currentIncome = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::INCOME->value)
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        $currentExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        $total = $currentIncome + $currentExpense;

        $incomeRateHigh = $total > 0 ? round(($currentIncome / $total) * 100, 2) : 0;
        $incomeRateLow  = $total > 0 ? round(($currentExpense / $total) * 100, 2) : 0;

        $expenseRateHigh = $incomeRateLow;
        $expenseRateLow  = $incomeRateHigh;

        //untuk review
        return Inertia::render('home/index', [
            'cards'         => $cards,
            'totalIncome'      => $currentIncome,
            'totalExpense'     => $currentExpense,
            'incomeRateHigh'   => $incomeRateHigh,
            'incomeRateLow'    => $incomeRateLow,
            'expenseRateHigh'  => $expenseRateHigh,
            'expenseRateLow'   => $expenseRateLow,
            'transactions' => $transactions
        ]);
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
