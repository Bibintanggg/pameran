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

        $filter = $request->query('filter', 'all');
        $chartMode = $request->query('chartMode', 'monthly');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $activeCardId = $request->query('activeCardId');

        $cards = Cards::where('user_id', $userId)->get();

        $allTransactionsQuery = Transactions::where('user_id', $userId)
            ->with('toCard', 'fromCard'); // ambil semua transaksi user

        // filtering transaksi sesuai tanggal yang ada ges
        if ($startDate && $endDate) {
            $allTransactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $allTransactions = $allTransactionsQuery->latest()->get();

        // filtering transactionsList
        $filteredTransactions = $allTransactions->filter(function ($transaction) use ($activeCardId, $filter) {
            // filter berdasarkan card
            $matchesCard = true;
            if ($activeCardId && $activeCardId != 0) {
                if ($transaction->type === 'income' || $transaction->type === 'convert') {
                    $matchesCard = $transaction->to_cards_id == $activeCardId;
                } else if ($transaction->type === 'expense') {
                    $matchesCard = $transaction->from_cards_id == $activeCardId;
                }
            }

            if (!$matchesCard) return false;

            // Filter berdasarkan tipe
            if ($filter === 'income') {
                return in_array($transaction->type, [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ]);
            } elseif ($filter === 'expense') {
                return $transaction->type === TransactionsType::EXPENSE->value;
            }

            return true;
        });

        // Map filtered transactions untuk display
        $transactions = $filteredTransactions->map(function ($data) {
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
                'created_at'       => $data->created_at,
            ];
        });

        // hitung total dari semua transaksi (tidak difilter berdasarkan activeCardId)
        $totalIncome = $allTransactions->whereIn('type', [
            TransactionsType::INCOME->value,
            TransactionsType::CONVERT->value
        ])->sum(function ($transaction) {
            return $transaction->type === TransactionsType::CONVERT->value
                ? $transaction->converted_amount
                : $transaction->amount;
        });

        $totalExpense = $allTransactions->whereIn('type', [
            TransactionsType::EXPENSE->value,
            TransactionsType::CONVERT->value
        ])->sum(function ($transaction) {
            return $transaction->type === TransactionsType::CONVERT->value
                ? $transaction->amount  // untuk convert, expense adalah amount asli
                : $transaction->amount;
        });

        // hitung income/expense per card dari semua data
        $incomePerCard = collect();
        $expensePerCard = collect();

        foreach ($allTransactions as $transaction) {
            if (in_array($transaction->type, [TransactionsType::INCOME->value, TransactionsType::CONVERT->value])) {
                $cardId = $transaction->to_cards_id;
                $amount = $transaction->type === TransactionsType::CONVERT->value
                    ? $transaction->converted_amount
                    : $transaction->amount;

                $incomePerCard[$cardId] = ($incomePerCard[$cardId] ?? 0) + $amount;
            }

            if (in_array($transaction->type, [TransactionsType::EXPENSE->value, TransactionsType::CONVERT->value])) {
                $cardId = $transaction->from_cards_id;
                $amount = $transaction->amount; // untuk expense dan convert, selalu gunakan amount asli

                $expensePerCard[$cardId] = ($expensePerCard[$cardId] ?? 0) + $amount;
            }
        }

        // Hitung rates per card
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

        // Chart data untuk semua cards (tidak difilter)
        $currentYear = now()->year;

        // Monthly data untuk semua cards
        $monthlyIncomeData = $allTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear &&
                    in_array($transaction->type, [TransactionsType::INCOME->value, TransactionsType::CONVERT->value]);
            })
            ->groupBy('to_cards_id')
            ->map(function ($transactions) {
                return $transactions->groupBy(function ($transaction) {
                    return $transaction->transaction_date->month;
                })->map(function ($monthTransactions) {
                    return $monthTransactions->sum(function ($transaction) {
                        return $transaction->type === TransactionsType::CONVERT->value
                            ? $transaction->converted_amount
                            : $transaction->amount;
                    });
                });
            });

        $monthlyExpenseData = $allTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear &&
                    in_array($transaction->type, [TransactionsType::EXPENSE->value, TransactionsType::CONVERT->value]);
            })
            ->groupBy('from_cards_id')
            ->map(function ($transactions) {
                return $transactions->groupBy(function ($transaction) {
                    return $transaction->transaction_date->month;
                })->map(function ($monthTransactions) {
                    return $monthTransactions->sum('amount');
                });
            });

        // Format monthly chart data
        $monthlyChartData = collect();
        foreach ($cards as $card) {
            $cardId = $card->id;
            $monthlyChartData[$cardId] = collect(range(1, 12))->map(function ($month) use ($monthlyIncomeData, $monthlyExpenseData, $cardId) {
                return [
                    'month' => Carbon::create()->month($month)->format('M'),
                    'income' => $monthlyIncomeData->get($cardId, collect())->get($month, 0),
                    'expense' => $monthlyExpenseData->get($cardId, collect())->get($month, 0),
                    'label' => Carbon::create()->month($month)->format('M'),
                ];
            });
        }

        // Yearly data untuk semua cards
        $yearlyIncomeData = $allTransactions
            ->filter(function ($transaction) {
                return in_array($transaction->type, [TransactionsType::INCOME->value, TransactionsType::CONVERT->value]);
            })
            ->groupBy('to_cards_id')
            ->map(function ($transactions) {
                return $transactions->groupBy(function ($transaction) {
                    return $transaction->transaction_date->year;
                })->map(function ($yearTransactions) {
                    return $yearTransactions->sum(function ($transaction) {
                        return $transaction->type === TransactionsType::CONVERT->value
                            ? $transaction->converted_amount
                            : $transaction->amount;
                    });
                });
            });

        $yearlyExpenseData = $allTransactions
            ->filter(function ($transaction) {
                return in_array($transaction->type, [TransactionsType::EXPENSE->value, TransactionsType::CONVERT->value]);
            })
            ->groupBy('from_cards_id')
            ->map(function ($transactions) {
                return $transactions->groupBy(function ($transaction) {
                    return $transaction->transaction_date->year;
                })->map(function ($yearTransactions) {
                    return $yearTransactions->sum('amount');
                });
            });

        // Format yearly chart data
        $yearlyChartData = collect();
        $allYears = $allTransactions->pluck('transaction_date')
            ->map(fn($date) => $date->year)
            ->unique()
            ->sort()
            ->values();

        foreach ($cards as $card) {
            $cardId = $card->id;
            $yearlyChartData[$cardId] = $allYears->map(function ($year) use ($yearlyIncomeData, $yearlyExpenseData, $cardId) {
                return [
                    'year' => $year,
                    'income' => $yearlyIncomeData->get($cardId, collect())->get($year, 0),
                    'expense' => $yearlyExpenseData->get($cardId, collect())->get($year, 0),
                    'label' => (string) $year,
                ];
            });
        }

        // Calculate rates
        $totalTransactions = $totalIncome + $totalExpense;
        $incomeRate = $totalTransactions > 0 ? round(($totalIncome / $totalTransactions) * 100, 2) : 0;
        $expenseRate = $totalTransactions > 0 ? round(($totalExpense / $totalTransactions) * 100, 2) : 0;

        return Inertia::render('activity/index', [
            'transactions' => $transactions->values(), // Reset keys
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
                    'avatar' => Auth::user()->avatar,
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

        $filter = $request->query('filter', 'all');
        $chartMode = $request->query('chartMode', 'monthly');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $activeCardId = $request->query('activeCardId', 0);

        $cards = Cards::where('user_id', $userId)->get();

        // Query dasar untuk expense transactions
        $expenseTransactionsQuery = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->with(['toCard', 'fromCard']);

        // Filter berdasarkan card jika dipilih
        if ($activeCardId && $activeCardId != 0) {
            $expenseTransactionsQuery->where('from_cards_id', $activeCardId);
        }

        // Filter tanggal jika ada
        if ($startDate && $endDate) {
            $expenseTransactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        // Dapatkan transactions yang sudah difilter
        $filteredTransactions = $expenseTransactionsQuery->latest()->get();

        // Query untuk semua transactions (untuk chart dan analytics)
        $allExpenseTransactionsQuery = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->with(['toCard', 'fromCard']);

        if ($startDate && $endDate) {
            $allExpenseTransactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $allExpenseTransactions = $allExpenseTransactionsQuery->get();

        // Format transactions dengan currency yang benar
        $transactions = $filteredTransactions->map(function ($data) {
            // Prioritaskan currency dari from_card (card yang mengeluarkan expense)
            $currency = $data->fromCard?->currency;
            if ($currency instanceof Currency) {
                $currency = $currency->value;
            }

            // Fallback ke to_card currency jika from_card tidak ada
            if (!$currency) {
                $currency = $data->toCard?->currency;
                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }
            }

            $currency ??= Currency::INDONESIAN_RUPIAH->value;
            $currencySymbol = Currency::from($currency)->symbol();

            return [
                'id'               => $data->id,
                'to_cards_id'      => $data->to_cards_id,
                'from_cards_id'    => $data->from_cards_id,
                'user_name'        => Auth::user()->name,
                'type'             => $data->type,
                'type_label'       => TransactionsType::from($data->type)->label(),
                'amount'           => $data->amount,
                'formatted_amount' => $currencySymbol . ' ' . number_format($data->amount, 0, ',', '.'),
                'notes'            => $data->notes,
                'currency'         => $currency,
                'asset'            => $data->asset,
                'asset_label'      => Asset::from($data->asset)->label(),
                'category'         => $data->category,
                'category_label'   => $data->category ? Category::from($data->category)->label() : 'Other',
                'transaction_date' => $data->transaction_date->format('d F Y'),
                'created_at'       => $data->created_at,
            ];
        });

        // Hitung total expense berdasarkan transactions yang difilter
        $totalExpense = $filteredTransactions->sum('amount');

        // Expense per card (gunakan all transactions untuk analytics card)
        $expensePerCard = $allExpenseTransactions
            ->groupBy('from_cards_id')
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        // Expense by category berdasarkan transactions yang difilter
        $expenseByCategory = $filteredTransactions
            ->groupBy('category')
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->mapWithKeys(function ($total, $category) {
                $categoryLabel = $category ? Category::from($category)->label() : 'Other';
                return [$categoryLabel => (float) $total];
            });

        // Data chart berdasarkan transactions yang difilter
        $currentYear = now()->year;
        $monthlyExpenseData = $filteredTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear;
            })
            ->groupBy(function ($transaction) {
                return $transaction->transaction_date->month;
            })
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            });

        $monthlyChartData = collect(range(1, 12))->map(function ($month) use ($monthlyExpenseData) {
            $expenseAmount = $monthlyExpenseData->get($month, 0);
            return [
                'month' => Carbon::create()->month($month)->format('M'),
                'expense' => $expenseAmount,
                'budget' => $expenseAmount > 0 ? $expenseAmount * 1.2 : 0,
                'label' => Carbon::create()->month($month)->format('M'),
            ];
        });

        $yearlyExpenseData = $filteredTransactions
            ->groupBy(function ($transaction) {
                return $transaction->transaction_date->year;
            })
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->sortKeys();

        $yearlyChartData = $yearlyExpenseData->map(function ($expenseAmount, $year) {
            return [
                'year' => $year,
                'expense' => $expenseAmount,
                'budget' => $expenseAmount > 0 ? $expenseAmount * 1.2 : 0,
                'label' => (string) $year,
            ];
        })->values();

        $currentYearExpense = $filteredTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear;
            })
            ->sum('amount');

        $avgMonthlyExpense = $currentYearExpense > 0 ? $currentYearExpense / 12 : 0;

        $previousYearExpense = $filteredTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === ($currentYear - 1);
            })
            ->sum('amount');

        $expenseGrowthRate = $previousYearExpense > 0
            ? (($currentYearExpense - $previousYearExpense) / $previousYearExpense) * 100
            : 0;

        $topCategories = $expenseByCategory->sortByDesc(function ($value) {
            return $value;
        })->take(5);

        return Inertia::render('activity/expense/index', [
            'transactions' => $transactions->values(),
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
            'activeCardId' => (int) $activeCardId, // Pastikan integer
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => Auth::user()->avatar,
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

        if ($activeCardId && !$cards->contains('id', $activeCardId)) {
            $activeCardId = 0; // Reset ke "All Cards" jika card tidak ditemukan
        }

        $transactionsQuery = Transactions::where('user_id', $userId)
            ->whereIn('type', [
                TransactionsType::INCOME->value,
                TransactionsType::CONVERT->value
            ])
            ->with('toCard');

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

        $incomeByCategoryPerCard = [];

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

        $avgMonthlyIncome = 0;

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);
            $monthsDiff = $start->diffInMonths($end) + 1;
            $avgMonthlyIncome = $totalIncome / $monthsDiff;
        } else {
            $avgMonthlyIncome = $totalIncome / 12;
        }

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
                    'avatar' => Auth::user()->avatar,
                ]
            ]
        ]);
    }
}
