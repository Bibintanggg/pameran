<?php

namespace App\Http\Controllers;

use App\Enum\Asset;
use App\Enum\Category;
use App\Enum\Currency;
use App\Enum\TransactionsType;
use App\Exports\TransactionExport;
use App\Models\Cards;
use App\Models\Transactions;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class CardsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $filter = $request->query('filter', 'monthly');
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

                $displayAmount = $data->type === TransactionsType::CONVERT->value
                    ? $data->converted_amount
                    : $data->amount;

                return [
                    'id'               => $data->id,
                    'to_cards_id'      => $data->to_cards_id,
                    'user_name'        => Auth::user()->name,
                    'type'             => $data->type,
                    'type_label'       => TransactionsType::from($data->type)->label(),
                    'amount'           => $displayAmount,
                    'formatted_amount' => $currencySymbol . ' ' . number_format($displayAmount, 0, ',', '.'),
                    'notes'            => $data->notes,
                    'currency'         => $data->toCard?->currency ?? 'IDR',
                    'asset'            => $data->asset,
                    'asset_label'      => Asset::from($data->asset)->label(),
                    'category'         => $data->category,
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                    'transaction_date' => $data->transaction_date->format('d F Y'),
                ];
            });

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
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw('to_cards_id, SUM(amount) as total')
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        $currentIncome = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->whereDate('created_at', now()->toDateString())
            ->selectRaw('SUM(CASE 
            WHEN type = ? THEN amount 
            WHEN type = ? THEN converted_amount 
            ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->value('total') ?? 0;

        $currentExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        // Rest of the code remains the same...
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

        // Monthly dan yearly data sudah benar
        $monthlyData = Transactions::where('user_id', $userId)
            ->whereYear('transaction_date', $currentYear)
            ->selectRaw(
                'to_cards_id,
            MONTH(transaction_date) as month,
            SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 
            END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value,
                    TransactionsType::EXPENSE->value
                ]
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

        $yearlyData = Transactions::where('user_id', $userId)
            ->selectRaw(
                'to_cards_id,
            YEAR(transaction_date) as year,
            SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 
            END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value,
                    TransactionsType::EXPENSE->value
                ]
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

    public function allActivity(Request $request)
    {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all'); // all, income, expense
        $chartMode = $request->query('chartMode', 'monthly'); // monthly, yearly
        $startDate = $request->query('start_date'); // startdet
        $endDate = $request->query('end_date'); // enddet

        $cards = Cards::where('user_id', $userId)->get();

        $transactionsQuery = Transactions::where('user_id', $userId)
            ->with('toCard');

        // Filter transactions
        if ($filter === 'income') {
            $transactionsQuery->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);
        } elseif ($filter === 'expense') {
            $transactionsQuery->where('type', TransactionsType::EXPENSE->value);
        }

        if ($startDate && $endDate) {
            $transactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $transactions = $transactionsQuery->latest()
            ->get()
            ->map(function ($data) {
                $currency = $data->toCard?->currency;
                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }

                $currency ??= Currency::INDONESIAN_RUPIAH->value;
                $currencySymbol = Currency::from($currency)->symbol();

                // Handle converted amount for CONVERT transactions
                $displayAmount = $data->type === TransactionsType::CONVERT->value
                    ? $data->converted_amount
                    : $data->amount;

                return [
                    'id'               => $data->id,
                    'to_cards_id'      => $data->to_cards_id,
                    'user_name'        => Auth::user()->name,
                    'type'             => $data->type,
                    'type_label'       => TransactionsType::from($data->type)->label(),
                    'amount'           => $displayAmount,
                    'formatted_amount' => $currencySymbol . ' ' . number_format($displayAmount, 0, ',', '.'),
                    'notes'            => $data->notes,
                    'currency'         => $data->toCard?->currency ?? 'IDR',
                    'asset'            => $data->asset,
                    'asset_label'      => Asset::from($data->asset)->label(),
                    'category'         => $data->category,
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                    'transaction_date' => $data->transaction_date->format('d F Y'),
                    'created_at'       => $data->created_at,
                ];
            });

        $totalIncome = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->selectRaw('SUM(CASE 
            WHEN type = ? THEN amount 
            WHEN type = ? THEN converted_amount 
            ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->value('total') ?? 0;

        $totalExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->sum('amount');

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
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw('to_cards_id, SUM(amount) as total')
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

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

        $currentYear = now()->year;

        $monthlyData = Transactions::where('user_id', $userId)
            ->whereYear('transaction_date', $currentYear)
            ->selectRaw(
                'to_cards_id,
            MONTH(transaction_date) as month,
            SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 
            END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value,
                    TransactionsType::EXPENSE->value
                ]
            )
            ->groupBy('to_cards_id', 'month')
            ->get()
            ->groupBy('to_cards_id');

        $monthlyChartData = $monthlyData->map(function ($dataPerCard) {
            return collect(range(1, 12))->map(function ($month) use ($dataPerCard) {
                $data = $dataPerCard->firstWhere('month', $month);
                return [
                    'month' => Carbon::create()->month($month)->format('M'),
                    'income' => $data->income ?? 0,
                    'expense' => $data->expense ?? 0,
                    'label' => Carbon::create()->month($month)->format('M'),
                ];
            });
        });

        $yearlyData = Transactions::where('user_id', $userId)
            ->selectRaw(
                'to_cards_id,
            YEAR(transaction_date) as year,
            SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 
            END) as income,
            SUM(CASE WHEN type = ? THEN amount ELSE 0 END) as expense',
                [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value,
                    TransactionsType::EXPENSE->value
                ]
            )
            ->groupBy('to_cards_id', 'year')
            ->get()
            ->groupBy('to_cards_id');

        $yearlyChartData = $yearlyData->map(function ($dataPerCard) {
            return $dataPerCard->map(function ($data) {
                return [
                    'year' => $data->year,
                    'income' => $data->income ?? 0,
                    'expense' => $data->expense ?? 0,
                    'label' => (string) $data->year,
                ];
            });
        });

        // calculate income expense buat metrics
        $totalTransactions = $totalIncome + $totalExpense;
        $incomeRate = $totalTransactions > 0 ? round(($totalIncome / $totalTransactions) * 100, 2) : 0;
        $expenseRate = $totalTransactions > 0 ? round(($totalExpense / $totalTransactions) * 100, 2) : 0;

        return Inertia::render('activity/index', [
            'transactions' => $transactions,
            'cards' => $cards,
            'chartData' => [
                'monthly' => $monthlyChartData,
                'yearly' => $yearlyChartData,
            ],
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'ratesPerCard' => $ratesPerCard,
            'incomeRate' => $incomeRate,
            'expenseRate' => $expenseRate,
            'incomePerCard' => $incomePerCard,
            'expensePerCard' => $expensePerCard,
            'filter' => $filter,
            'chartMode' => $chartMode,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => null,
                ]
            ]
        ]);
    }
    public function exportAllActivity(Request $request)
    {
        $userId = Auth::id();

        $transactions = Transactions::where('user_id', $userId)
            ->with('toCard')
            ->get();

        return Excel::download(new TransactionExport($transactions), 'all-activity.xlsx');
    }

    public function exportIncomeActivity(Request $request)
    {
        $userId = Auth::id();

        $transactions = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->with('toCard')
            ->get();

        return Excel::download(new TransactionExport($transactions), 'income-activity.xlsx');
    }

    public function incomeActivity(Request $request)
    {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all'); // all, monthly, yearly
        $chartMode = $request->query('chartMode', 'monthly'); // monthly, yearly
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $cards = Cards::where('user_id', $userId)->get();

        $transactionsQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->with('toCard');

        if ($startDate && $endDate) {
            $transactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $transactions = $transactionsQuery->latest()
            ->get()
            ->map(function ($data) {
                $currency = $data->toCard?->currency;
                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }

                $currency ??= Currency::INDONESIAN_RUPIAH->value;
                $currencySymbol = Currency::from($currency)->symbol();

                // Handle converted amount for CONVERT transactions
                $displayAmount = $data->type === TransactionsType::CONVERT->value
                    ? $data->converted_amount
                    : $data->amount;

                return [
                    'id'               => $data->id,
                    'to_cards_id'      => $data->to_cards_id,
                    'user_name'        => Auth::user()->name,
                    'type'             => $data->type,
                    'type_label'       => TransactionsType::from($data->type)->label(),
                    'amount'           => $displayAmount,
                    'formatted_amount' => $currencySymbol . ' ' . number_format($displayAmount, 0, ',', '.'),
                    'notes'            => $data->notes,
                    'currency'         => $data->toCard?->currency ?? 'IDR',
                    'asset'            => $data->asset,
                    'asset_label'      => Asset::from($data->asset)->label(),
                    'category'         => $data->category,
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Transfer',
                    'transaction_date' => $data->transaction_date->format('d F Y'),
                    'created_at'       => $data->created_at,
                ];
            });

        // Total income
        $totalIncome = $transactionsQuery->clone()
            ->selectRaw('SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->value('total') ?? 0;

        // Income per card
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

        // Income by category
        $incomeByCategory = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->selectRaw('category, SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->groupBy('category')
            ->get()
            ->mapWithKeys(function ($item) {
                $categoryLabel = $item->category ? Category::from($item->category)->label() : 'Other';
                return [$categoryLabel => (float) $item->total];
            });

        // Monthly income data
        $currentYear = now()->year;
        $monthlyIncomeData = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->whereYear('transaction_date', $currentYear)
            ->selectRaw(
                'MONTH(transaction_date) as month,
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
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $monthlyChartData = collect(range(1, 12))->map(function ($month) use ($monthlyIncomeData) {
            $data = $monthlyIncomeData->get($month);
            return [
                'month' => Carbon::create()->month($month)->format('M'),
                'income' => $data->income ?? 0,
                'target' => ($data->income ?? 0) * 1.1, // 10% target for visualization
                'label' => Carbon::create()->month($month)->format('M'),
            ];
        });

        // Yearly income data
        $yearlyIncomeData = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->selectRaw(
                'YEAR(transaction_date) as year,
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
            ->groupBy('year')
            ->get()
            ->sortBy('year');

        $yearlyChartData = $yearlyIncomeData->map(function ($data) {
            return [
                'year' => $data->year,
                'income' => $data->income ?? 0,
                'target' => ($data->income ?? 0) * 1.1, // 10% target for visualization
                'label' => (string) $data->year,
            ];
        });

        // Calculate average monthly income
        $avgMonthlyIncome = $totalIncome > 0 ? $totalIncome / 12 : 0;

        // Calculate growth rate (compared to previous period)
        $previousPeriodIncome = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->whereYear('transaction_date', $currentYear - 1)
            ->selectRaw('SUM(CASE 
                WHEN type = ? THEN amount 
                WHEN type = ? THEN converted_amount 
                ELSE 0 END) as total', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->value('total') ?? 0;

        $growthRate = $previousPeriodIncome > 0
            ? (($totalIncome - $previousPeriodIncome) / $previousPeriodIncome) * 100
            : 0;

        return Inertia::render('activity/income/index', [
            'transactions' => $transactions,
            'cards' => $cards,
            'chartData' => [
                'monthly' => $monthlyChartData,
                'yearly' => $yearlyChartData,
            ],
            'incomeByCategory' => $incomeByCategory,
            'totalIncome' => $totalIncome,
            'avgMonthlyIncome' => $avgMonthlyIncome,
            'growthRate' => $growthRate,
            'incomePerCard' => $incomePerCard,
            'filter' => $filter,
            'chartMode' => $chartMode,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => null,
                ]
            ]
        ]);
    }

    public function expenseActivity(Request $request)
    {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all'); // all, monthly, yearly
        $chartMode = $request->query('chartMode', 'monthly'); // monthly, yearly
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $cards = Cards::where('user_id', $userId)->get();

        $transactionsQuery = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->with('toCard');

        if ($startDate && $endDate) {
            $transactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $transactions = $transactionsQuery->latest()
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
                    'category_label'   => $data->category ? Category::from($data->category)->label() : 'Other',
                    'transaction_date' => $data->transaction_date->format('d F Y'),
                    'created_at'       => $data->created_at,
                ];
            });

        // Total expense
        $totalExpense = $transactionsQuery->clone()
            ->sum('amount');

        // Expense per card
        $expensePerCard = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw('to_cards_id, SUM(amount) as total')
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        // Expense by category
        $expenseByCategory = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get()
            ->mapWithKeys(function ($item) {
                $categoryLabel = $item->category ? Category::from($item->category)->label() : 'Other';
                return [$categoryLabel => (float) $item->total];
            });

        // Monthly expense data
        $currentYear = now()->year;
        $monthlyExpenseData = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereYear('transaction_date', $currentYear)
            ->selectRaw(
                'MONTH(transaction_date) as month,
            SUM(amount) as expense'
            )
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $monthlyChartData = collect(range(1, 12))->map(function ($month) use ($monthlyExpenseData) {
            $data = $monthlyExpenseData->get($month);
            $expenseAmount = $data->expense ?? 0;
            return [
                'month' => Carbon::create()->month($month)->format('M'),
                'expense' => $expenseAmount,
                'budget' => $expenseAmount > 0 ? $expenseAmount * 1.2 : 0, // 20% buffer for budget visualization
                'label' => Carbon::create()->month($month)->format('M'),
            ];
        });

        // Yearly expense data
        $yearlyExpenseData = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->selectRaw(
                'YEAR(transaction_date) as year,
            SUM(amount) as expense'
            )
            ->groupBy('year')
            ->get()
            ->sortBy('year');

        $yearlyChartData = $yearlyExpenseData->map(function ($data) {
            $expenseAmount = $data->expense ?? 0;
            return [
                'year' => $data->year,
                'expense' => $expenseAmount,
                'budget' => $expenseAmount > 0 ? $expenseAmount * 1.2 : 0, // 20% buffer for budget visualization
                'label' => (string) $data->year,
            ];
        });

        // Calculate average monthly expense
        $avgMonthlyExpense = $totalExpense > 0 ? $totalExpense / 12 : 0;

        // Calculate expense growth rate (compared to previous year)
        $previousPeriodExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereYear('transaction_date', $currentYear - 1)
            ->sum('amount') ?? 0;

        $expenseGrowthRate = $previousPeriodExpense > 0
            ? (($totalExpense - $previousPeriodExpense) / $previousPeriodExpense) * 100
            : 0;

        // Calculate top spending categories
        $topCategories = $expenseByCategory->sortByDesc(function ($value) {
            return $value;
        })->take(5);

        return Inertia::render('activity/expense/index', [
            'transactions' => $transactions,
            'cards' => $cards,
            'chartData' => [
                'monthly' => $monthlyChartData,
                'yearly' => $yearlyChartData,
            ],
            'expenseByCategory' => $expenseByCategory,
            'topCategories' => $topCategories,
            'totalExpense' => $totalExpense,
            'avgMonthlyExpense' => $avgMonthlyExpense,
            'expenseGrowthRate' => $expenseGrowthRate,
            'expensePerCard' => $expensePerCard,
            'filter' => $filter,
            'chartMode' => $chartMode,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => null,
                ]
            ]
        ]);
    }

    public function exportExpenseActivity(Request $request)
    {
        $userId = Auth::id();

        $transactions = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->with('toCard')
            ->get();

        return Excel::download(new TransactionExport($transactions), 'expense-activity.xlsx');
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
            'currency' => ["required", 'string', Rule::in(Currency::values())],
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
