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
        try {
            $userId = Auth::id();
            $filter = $request->query('filter', 'monthly');
            $activeCardId = $request->query('activeCardId');
            $currentYear = now()->year;

            $cards = Cards::where('user_id', $userId)
                ->select('id', 'name', 'balance', 'currency', 'card_number')
                ->get();

            $transactionsQuery = Transactions::where('user_id', $userId)
                ->with('toCard', 'fromCard');

            if ($activeCardId) {
                $transactionsQuery->where(function ($query) use ($activeCardId) {
                    $query->where('to_cards_id', $activeCardId)
                        ->orWhere('from_cards_id', $activeCardId);
                });
            }

            $transactions = $transactionsQuery->latest()
                ->get()
                ->map(function ($data) {
                    if ($data->type === TransactionsType::EXPENSE->value) {
                        $currency = $data->fromCard?->currency;
                    } else {
                        $currency = $data->toCard?->currency;
                    }

                    if ($currency instanceof Currency) {
                        $currency = $currency->value;
                    }

                    $currency ??= Currency::INDONESIAN_RUPIAH->value;
                    $currencySymbol = Currency::from($currency)->symbol();

                    $displayAmount = $data->type === TransactionsType::CONVERT->value
                        ? $data->converted_amount
                        : $data->amount;

                    return [
                        'id'               => $data->id,
                        'to_cards_id'      => $data->to_cards_id,
                        'from_cards_id'    => $data->from_cards_id,
                        'user_name'        => Auth::user()->name,
                        'type'             => $data->type,
                        'type_label'       => TransactionsType::from($data->type)->label(),
                        'amount'           => $displayAmount,
                        'formatted_amount' => $currencySymbol . ' ' . number_format($displayAmount, 0, ',', '.'),
                        'notes'            => $data->notes,
                        'currency'         => $currency,
                        'asset'            => $data->asset,
                        'asset_label'      => Asset::from($data->asset)->label(),
                        'category'         => $data->category,
                        'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                        'transaction_date' => $data->transaction_date->format('d F Y'),
                    ];
                });

            $currentIncomeQuery = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->whereDate('created_at', now()->toDateString());

            if ($activeCardId) {
                $currentIncomeQuery->where('to_cards_id', $activeCardId);
            }

            $incomePerCard = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw('to_cards_id, SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->groupBy('to_cards_id')
                ->pluck('total', 'to_cards_id')
                ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

            $expensePerCard = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::EXPENSE->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw('from_cards_id, SUM(CASE
    WHEN type = ? THEN amount
    WHEN type = ? THEN amount
    ELSE 0 END) as total', [
                    TransactionsType::EXPENSE->value,
                    TransactionsType::CONVERT->value
                ])
                ->groupBy('from_cards_id')
                ->pluck('total', 'from_cards_id')
                ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

            $currentIncome = $currentIncomeQuery->selectRaw('SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
                ->value('total') ?? 0;

            $currentExpenseQuery = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::EXPENSE->value,
                    TransactionsType::CONVERT->value
                ])
                ->whereDate('created_at', now()->toDateString());

            if ($activeCardId) {
                $currentExpenseQuery->where('from_cards_id', $activeCardId);
            }

            $currentExpense = $currentExpenseQuery->selectRaw('SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN amount
        ELSE 0 END) as total', [
                TransactionsType::EXPENSE->value,
                TransactionsType::CONVERT->value
            ])
                ->value('total') ?? 0;

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

            // Updated monthly data query to handle both income (to_cards_id) and expense (from_cards_id)
            $monthlyIncomeData = Transactions::where('user_id', $userId)
                ->whereYear('transaction_date', $currentYear)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw(
                    'to_cards_id as card_id,
        MONTH(transaction_date) as month,
        SUM(CASE
            WHEN type = ? THEN amount
            WHEN type = ? THEN converted_amount
            ELSE 0
        END) as income',
                    [
                        TransactionsType::INCOME->value,
                        TransactionsType::CONVERT->value
                    ]
                )
                ->groupBy('to_cards_id', 'month')
                ->get();

            $monthlyExpenseData = Transactions::where('user_id', $userId)
                ->whereYear('transaction_date', $currentYear)
                ->whereIn('type', [
                    TransactionsType::EXPENSE->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw(
                    'from_cards_id as card_id,
        MONTH(transaction_date) as month,
        SUM(CASE
            WHEN type = ? THEN amount
            WHEN type = ? THEN amount
            ELSE 0
        END) as expense',
                    [
                        TransactionsType::EXPENSE->value,
                        TransactionsType::CONVERT->value
                    ]
                )
                ->groupBy('from_cards_id', 'month')
                ->get();

            $monthlyData = collect();

            foreach ($monthlyIncomeData as $data) {
                if (!$monthlyData->has($data->card_id)) {
                    $monthlyData->put($data->card_id, collect());
                }

                $existing = $monthlyData->get($data->card_id)->firstWhere('month', $data->month);
                if ($existing) {
                    $existing->income = $data->income;
                } else {
                    $monthlyData->get($data->card_id)->push((object)[
                        'month' => $data->month,
                        'income' => $data->income,
                        'expense' => 0
                    ]);
                }
            }

            foreach ($monthlyExpenseData as $data) {
                if (!$monthlyData->has($data->card_id)) {
                    $monthlyData->put($data->card_id, collect());
                }

                $existing = $monthlyData->get($data->card_id)->firstWhere('month', $data->month);
                if ($existing) {
                    $existing->expense = $data->expense;
                } else {
                    $monthlyData->get($data->card_id)->push((object)[
                        'month' => $data->month,
                        'income' => 0,
                        'expense' => $data->expense
                    ]);
                }
            }

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

            $yearlyIncomeData = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw(
                    'to_cards_id as card_id,
        YEAR(transaction_date) as year,
        SUM(CASE
            WHEN type = ? THEN amount
            WHEN type = ? THEN converted_amount
            ELSE 0
        END) as income',
                    [
                        TransactionsType::INCOME->value,
                        TransactionsType::CONVERT->value
                    ]
                )
                ->groupBy('to_cards_id', 'year')
                ->get();

            $yearlyExpenseData = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::EXPENSE->value,
                    TransactionsType::CONVERT->value
                ])
                ->selectRaw(
                    'from_cards_id as card_id,
        YEAR(transaction_date) as year,
        SUM(CASE
            WHEN type = ? THEN amount
            WHEN type = ? THEN amount
            ELSE 0
        END) as expense',
                    [
                        TransactionsType::EXPENSE->value,
                        TransactionsType::CONVERT->value
                    ]
                )
                ->groupBy('from_cards_id', 'year')
                ->get();

            $yearlyData = collect();

            foreach ($yearlyIncomeData as $data) {
                if (!$yearlyData->has($data->card_id)) {
                    $yearlyData->put($data->card_id, collect());
                }

                $existing = $yearlyData->get($data->card_id)->firstWhere('year', $data->year);
                if ($existing) {
                    $existing->income = $data->income;
                } else {
                    $yearlyData->get($data->card_id)->push((object)[
                        'year' => $data->year,
                        'income' => $data->income,
                        'expense' => 0
                    ]);
                }
            }

            // Process yearly expense data
            foreach ($yearlyExpenseData as $data) {
                if (!$yearlyData->has($data->card_id)) {
                    $yearlyData->put($data->card_id, collect());
                }

                $existing = $yearlyData->get($data->card_id)->firstWhere('year', $data->year);
                if ($existing) {
                    $existing->expense = $data->expense;
                } else {
                    $yearlyData->get($data->card_id)->push((object)[
                        'year' => $data->year,
                        'income' => 0,
                        'expense' => $data->expense
                    ]);
                }
            }

            $yearlyChartData = $yearlyData->map(function ($dataPerCard) {
                return $dataPerCard->map(fn($data) => [
                    'year' => $data->year,
                    'income' => $data->income ?? 0,
                    'expense' => $data->expense ?? 0,
                ]);
            });
        } catch (\Exception $e) {
            return back()->with('error', 'Something went wrong. Please try again.');
        }

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
            'activeCardId'     => $activeCardId,
            'chartData'    => [
                'monthly' => $monthlyChartData,
                'yearly'  => $yearlyChartData,
            ],
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => Auth::user()->avatar,
                ]
            ]
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
        try {
            $validated = $request->validate([
                'currency' => ["required", 'string', Rule::in(Currency::values())],
                'name' => 'required|string|max:30',
                'card_number' => 'nullable|string|max:16',
                'balance' => 'nullable|numeric||min:0'
            ]);

            Cards::create([
                'user_id' => Auth::id(),
                'currency' => $validated['currency'],
                'name' => $validated['name'],
                'card_number' => $validated['card_number'],
                'balance' => $validated['balance'] ?? 0
            ]);

            return back()->with('success', 'Cards berhasil ditambahkan');
        } catch (\Exception $e) {
            return back()->with('error', 'Something went wrong. Please try again.');
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
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cards $card)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:30',
                'card_number' => 'required|string|max:16',
                // 'balance' => 'nullable|numeric|min:0'
            ]);

            $card->update([
                'name' => $validated['name'],
                'card_number' => $validated['card_number'],
                // 'balance' => $validated['balance'] ?? $cards->balance
            ]);

            return back()->with('success', 'Cards berhasil diperbarui');
        } catch (\Exception $e) {
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $card = Cards::where('id', $id)

                ->where('user_id', Auth::id())
                ->firstOrFail();

            $card->delete();

            // return redirect()->route('card.index')->with('success', 'Card berhasil dihapus');
            return back()->with('success', 'Cards berhasil dihapus');
        } catch (\Exception $e) {
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }
}
