<?php

namespace App\Http\Controllers;

use App\Enum\Asset;
use App\Enum\Category;
use App\Enum\Currency;
use App\Enum\TransactionsType;
use App\Models\Cards;
use App\Models\Transactions;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CardsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $filter = $request->query('filter', 'monthly'); // default bulanan
        $currentYear = now()->year;

        $cards = Cards::where('user_id', $userId)->get();

        $transactions = Transactions::where('user_id', $userId)
            ->with('toCard')
            ->latest()
            ->get()
            ->map(function ($data) {
                $currency = $data->toCard?->currency;
                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }

                $currency ??= Currency::INDONESIAN_RUPIAH->value;
                $currencySymbol = Currency::from($currency)->symbol();

                return [
                    'id'               => $data->id,
                    'to_cards_id'      => $data->to_cards_id,
                    'user_name'        => Auth::user()->name,
                    'type'             => $data->type,
                    'type_label'       => TransactionsType::from($data->type)->label(),
                    'amount'           => $data->amount,
                    'formatted_amount' => $currencySymbol . ' ' . number_format($data->amount, 0, ',', '.'),
                    'notes'            => $data->notes,
                    'currency'         => $data->toCard?->currency ?? 'IDR',
                    'asset'            => $data->asset,
                    'asset_label'      => Asset::from($data->asset)->label(),
                    'category'         => $data->category,
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                    'transaction_date' => $data->created_at->format('d F Y'),
                ];
            });

        $incomePerCard = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::INCOME->value)
            ->selectRaw('to_cards_id, SUM(amount) as total')
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        $expensePerCard = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw('to_cards_id, SUM(amount) as total')
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        $currentIncome = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::INCOME->value)
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        $currentExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        $ratesPerCard = collect();

        foreach ($incomePerCard->keys()->merge($expensePerCard->keys())->unique() as $cardId) {
            $income = $incomePerCard->get($cardId, 0);
            $expense = $expensePerCard->get($cardId, 0);
            $total = $income + $expense;

            $ratesPerCard[$cardId] = [
                'income_rate' => $total > 0 ? round(($income / $total) * 100, 2) : 0,
                'expense_rate' => $total > 0 ? round(($expense / $total) * 100, 2) : 0,
            ];
        }

        $total = $currentIncome + $currentExpense;
        $incomeRateHigh = $total > 0 ? round(($currentIncome / $total) * 100, 2) : 0;
        $incomeRateLow  = $total > 0 ? round(($currentExpense / $total) * 100, 2) : 0;
        $expenseRateHigh = $incomeRateLow;
        $expenseRateLow  = $incomeRateHigh;

        $monthlyData = Transactions::where('user_id', $userId)
            ->whereYear('transaction_date', $currentYear)
            ->selectRaw(
                'to_cards_id,
            MONTH(transaction_date) as month,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [TransactionsType::INCOME->value, TransactionsType::EXPENSE->value]
            )
            ->groupBy('to_cards_id', 'month')
            ->get()
            ->groupBy('to_cards_id');

        $monthlyChartData = $monthlyData->map(function ($dataPerCard) {
            return collect(range(1, 12))->map(function ($month) use ($dataPerCard) {
                $data = $dataPerCard->firstWhere('month', $month);
                return [
                    'month' => \Carbon\Carbon::create()->month($month)->format('M'),
                    'income' => $data->income ?? 0,
                    'expense' => $data->expense ?? 0,
                ];
            });
        });

        // Yearly data per card
        $yearlyData = Transactions::where('user_id', $userId)
            ->selectRaw(
                'to_cards_id,
            YEAR(transaction_date) as year,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [TransactionsType::INCOME->value, TransactionsType::EXPENSE->value]
            )
            ->groupBy('to_cards_id', 'year')
            ->get()
            ->groupBy('to_cards_id');

        $yearlyChartData = $yearlyData->map(function ($dataPerCard) {
            return $dataPerCard->map(fn($data) => [
                'year' => $data->year,
                'income' => $data->income ?? 0,
                'expense' => $data->expense ?? 0,
            ]);
        });

        return Inertia::render('home/index', [
            'cards'            => $cards,
            'totalIncome'      => $currentIncome,
            'totalExpense'     => $currentExpense,
            'incomeRateHigh'   => $incomeRateHigh,
            'incomeRateLow'    => $incomeRateLow,
            'expenseRateHigh'  => $expenseRateHigh,
            'expenseRateLow'   => $expenseRateLow,
            'transactions'     => $transactions,
            'incomePerCard'    => $incomePerCard,
            'expensePerCard'   => $expensePerCard,
            'ratesPerCard'     => $ratesPerCard,
            'filter'           => $filter,
            'chartData'    => [
                'monthly' => $monthlyChartData,
                'yearly'  => $yearlyChartData,
            ],
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
            'balance' => $validated['balance'] ?? 0
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
