<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Enum\Asset;
use Inertia\Inertia;
use App\Models\Cards;
use App\Enum\Category;
use App\Enum\Currency;
use App\Models\Transactions;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Enum\TransactionsType;
use App\Exports\TransactionExport;
use Illuminate\Support\Facades\Auth;

class ActivityController extends Controller
{
    public function allActivity(Request $request)
    {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all'); // all, income, expense
        $chartMode = $request->query('chartMode', 'monthly'); // monthly, yearly
        $startDate = $request->query('start_date'); // startdet
        $endDate = $request->query('end_date'); // enddet
        $activeCardId = $request->query('activeCardId'); // tambah parameter activeCardId

        $cards = Cards::where('user_id', $userId)->get();

        $transactionsQuery = Transactions::where('user_id', $userId)
            ->with('toCard', 'fromCard'); // Tambahkan fromCard relationship

        // Filter berdasarkan activeCardId
        if ($activeCardId) {
            $transactionsQuery->where(function ($query) use ($activeCardId) {
                $query->where('to_cards_id', $activeCardId)
                    ->orWhere('from_cards_id', $activeCardId);
            });
        }

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
                // Fix logic untuk currency
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

                // Handle converted amount for CONVERT transactions
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
                    'created_at'       => $data->created_at,
                ];
            });

        // Filter total income berdasarkan activeCardId
        $totalIncomeQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $totalIncomeQuery->where('to_cards_id', $activeCardId);
        }

        $totalIncome = $totalIncomeQuery->selectRaw('SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
            TransactionsType::INCOME->value,
            TransactionsType::CONVERT->value
        ])
            ->value('total') ?? 0;

        // Filter total expense berdasarkan activeCardId
        $totalExpenseQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::EXPENSE->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $totalExpenseQuery->where('from_cards_id', $activeCardId);
        }

        $totalExpense = $totalExpenseQuery->selectRaw('SUM(CASE
    WHEN type = ? THEN amount
    WHEN type = ? THEN amount
    ELSE 0 END) as total', [
            TransactionsType::EXPENSE->value,
            TransactionsType::CONVERT->value
        ])
            ->value('total') ?? 0;

        // Income per card (bisa difilter atau semua)
        $incomePerCardQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $incomePerCardQuery->where('to_cards_id', $activeCardId);
        }

        $incomePerCard = $incomePerCardQuery->selectRaw('to_cards_id, SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
            TransactionsType::INCOME->value,
            TransactionsType::CONVERT->value
        ])
            ->groupBy('to_cards_id')
            ->pluck('total', 'to_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        // Expense per card (bisa difilter atau semua)
        $expensePerCardQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::EXPENSE->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $expensePerCardQuery->where('from_cards_id', $activeCardId);
        }

        $expensePerCard = $expensePerCardQuery->selectRaw('from_cards_id, SUM(CASE
    WHEN type = ? THEN amount
    WHEN type = ? THEN amount
    ELSE 0 END) as total', [
            TransactionsType::EXPENSE->value,
            TransactionsType::CONVERT->value
        ])
            ->groupBy('from_cards_id')
            ->pluck('total', 'from_cards_id')
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

        // FIXED: Filter monthly data berdasarkan activeCardId
        $monthlyIncomeDataQuery = Transactions::where('user_id', $userId)
            ->whereYear('transaction_date', $currentYear)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $monthlyIncomeDataQuery->where('to_cards_id', $activeCardId);
        }

        $monthlyIncomeData = $monthlyIncomeDataQuery->selectRaw(
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

        $monthlyExpenseDataQuery = Transactions::where('user_id', $userId)
            ->whereYear('transaction_date', $currentYear)
            ->whereIn('type', [
                TransactionsType::EXPENSE->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $monthlyExpenseDataQuery->where('from_cards_id', $activeCardId);
        }

        $monthlyExpenseData = $monthlyExpenseDataQuery->selectRaw(
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

        // Combine monthly income and expense data by card
        $monthlyData = collect();

        // Process income data
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

        // Process expense data
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
                    'month' => Carbon::create()->month($month)->format('M'),
                    'income' => $data->income ?? 0,
                    'expense' => $data->expense ?? 0,
                    'label' => Carbon::create()->month($month)->format('M'),
                ];
            });
        });

        // FIXED: Filter yearly data berdasarkan activeCardId
        $yearlyIncomeDataQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $yearlyIncomeDataQuery->where('to_cards_id', $activeCardId);
        }

        $yearlyIncomeData = $yearlyIncomeDataQuery->selectRaw(
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

        $yearlyExpenseDataQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::EXPENSE->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId) {
            $yearlyExpenseDataQuery->where('from_cards_id', $activeCardId);
        }

        $yearlyExpenseData = $yearlyExpenseDataQuery->selectRaw(
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

        // Combine yearly income and expense data
        $yearlyData = collect();

        // Process yearly income data
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
            'activeCardId' => $activeCardId,
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

    public function exportExpenseActivity(Request $request)
    {
        $userId = Auth::id();

        $transactions = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->with('toCard')
            ->get();

        return Excel::download(new TransactionExport($transactions), 'expense-activity.xlsx');
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

    public function incomeActivity(Request $request)
    {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all');
        $chartMode = $request->query('chartMode', 'monthly');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $activeCardId = $request->query('activeCardId', 0); // Default ke 0

        $cards = Cards::where('user_id', $userId)->get();

        // Pastikan activeCardId valid
        if ($activeCardId && !$cards->contains('id', $activeCardId)) {
            $activeCardId = 0; // Reset ke "All Cards" jika card tidak ditemukan
        }

        // PERBAIKAN 1: Filter transaksi berdasarkan activeCardId SEJAK AWAL
        $transactionsQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->with('toCard');

        // Filter berdasarkan activeCardId
        if ($activeCardId && $activeCardId !== 0) {
            $transactionsQuery->where('to_cards_id', $activeCardId);
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

        // PERBAIKAN 2: Total income dengan filter activeCardId yang konsisten
        $totalIncomeQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId && $activeCardId !== 0) {
            $totalIncomeQuery->where('to_cards_id', $activeCardId);
        }

        if ($startDate && $endDate) {
            $totalIncomeQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $totalIncome = $totalIncomeQuery->selectRaw('SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
            TransactionsType::INCOME->value,
            TransactionsType::CONVERT->value
        ])->value('total') ?? 0;

        // Income per card (untuk sidebar) - SELALU hitung semua card
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

        // PERBAIKAN 3: Income by category berdasarkan activeCardId yang konsisten
        $incomeByCategoryQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId && $activeCardId !== 0) {
            $incomeByCategoryQuery->where('to_cards_id', $activeCardId);
        }

        if ($startDate && $endDate) {
            $incomeByCategoryQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $incomeByCategory = $incomeByCategoryQuery->selectRaw('category, SUM(CASE
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

        // Income by category per card - SELALU hitung untuk semua kemungkinan
        $incomeByCategoryPerCard = [];

        // Hitung untuk "All Cards" (card_id = 0)
        $allCardsCategoryQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($startDate && $endDate) {
            $allCardsCategoryQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $allCardsCategories = $allCardsCategoryQuery->selectRaw('category, SUM(CASE
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

        $incomeByCategoryPerCard[0] = $allCardsCategories->toArray();

        // Untuk setiap card, hitung income by category
        foreach ($cards as $card) {
            $cardCategoryQuery = Transactions::where('user_id', $userId)
                ->where('to_cards_id', $card->id)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ]);

            if ($startDate && $endDate) {
                $cardCategoryQuery->whereBetween('transaction_date', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            }

            $cardCategories = $cardCategoryQuery->selectRaw('category, SUM(CASE
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

            $incomeByCategoryPerCard[$card->id] = $cardCategories->toArray();
        }

        // PERBAIKAN 4: Monthly income data berdasarkan activeCardId yang konsisten
        $currentYear = now()->year;
        $monthlyIncomeDataQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->whereYear('transaction_date', $currentYear);

        if ($activeCardId && $activeCardId !== 0) {
            $monthlyIncomeDataQuery->where('to_cards_id', $activeCardId);
        }

        if ($startDate && $endDate) {
            $monthlyIncomeDataQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $monthlyIncomeData = $monthlyIncomeDataQuery->selectRaw(
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
                'target' => ($data->income ?? 0) * 1.1,
                'label' => Carbon::create()->month($month)->format('M'),
            ];
        });

        // PERBAIKAN 5: Yearly income data berdasarkan activeCardId yang konsisten
        $yearlyIncomeDataQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ]);

        if ($activeCardId && $activeCardId !== 0) {
            $yearlyIncomeDataQuery->where('to_cards_id', $activeCardId);
        }

        if ($startDate && $endDate) {
            $yearlyIncomeDataQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $yearlyIncomeData = $yearlyIncomeDataQuery->selectRaw(
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
                'target' => ($data->income ?? 0) * 1.1,
                'label' => (string) $data->year,
            ];
        });

        // PERBAIKAN 6: Average monthly income calculation
        $avgMonthlyIncome = 0;

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);
            $monthsDiff = $start->diffInMonths($end) + 1;
            $avgMonthlyIncome = $totalIncome / $monthsDiff;
        } else {
            $avgMonthlyIncome = $totalIncome / 12;
        }

        // PERBAIKAN 7: Growth rate calculation berdasarkan activeCardId
        $previousPeriodIncomeQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->whereYear('transaction_date', $currentYear - 1);

        if ($activeCardId && $activeCardId !== 0) {
            $previousPeriodIncomeQuery->where('to_cards_id', $activeCardId);
        }

        $previousPeriodIncome = $previousPeriodIncomeQuery->selectRaw('SUM(CASE
        WHEN type = ? THEN amount
        WHEN type = ? THEN converted_amount
        ELSE 0 END) as total', [
            TransactionsType::INCOME->value,
            TransactionsType::CONVERT->value
        ])->value('total') ?? 0;

        $growthRate = $previousPeriodIncome > 0
            ? (($totalIncome - $previousPeriodIncome) / $previousPeriodIncome) * 100
            : ($totalIncome > 0 ? 100 : 0);

        return Inertia::render('activity/income/index', [
            'transactions' => $transactions,
            'cards' => $cards,
            'chartData' => [
                'monthly' => $monthlyChartData,
                'yearly' => $yearlyChartData,
            ],
            'incomeByCategory' => $incomeByCategory,
            'incomeByCategoryPerCard' => $incomeByCategoryPerCard,
            'totalIncome' => $totalIncome,
            'avgMonthlyIncome' => $avgMonthlyIncome,
            'growthRate' => $growthRate,
            'incomePerCard' => $incomePerCard,
            'filter' => $filter,
            'chartMode' => $chartMode,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'activeCardId' => (int) $activeCardId,
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => null,
                ]
            ]
        ]);
    }
}
