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
        try {
            $userId = Auth::id();

            $filter = $request->query('filter', 'all');
            $chartMode = $request->query('chartMode', 'monthly');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $activeCardId = $request->query('activeCardId', 0);
            $perPage = $request->query('per_page', 20);

            $cards = Cards::where('user_id', $userId)->get();

            // QUERY UNTUK SEMUA DATA (ANALYTICS)
            $allTransactionsQuery = Transactions::where('user_id', $userId)
                ->with('toCard', 'fromCard');

            // QUERY UNTUK PAGINATION
            $paginatedTransactionsQuery = Transactions::where('user_id', $userId)
                ->with('toCard', 'fromCard');

            // Filter date untuk kedua query
            if ($startDate && $endDate) {
                $allTransactionsQuery->whereBetween('transaction_date', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);

                $paginatedTransactionsQuery->whereBetween('transaction_date', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            }

            // Tapi JANGAN untuk analytics (biar income/expense semua card tetap ada)
            if ($activeCardId && $activeCardId != 0) {
                $paginatedTransactionsQuery->where(function ($query) use ($activeCardId) {
                    $query->where(function ($q) use ($activeCardId) {
                        $q->where('type', TransactionsType::INCOME->value)
                            ->where('to_cards_id', $activeCardId);
                    })->orWhere(function ($q) use ($activeCardId) {
                        $q->where('type', TransactionsType::CONVERT->value)
                            ->where('to_cards_id', $activeCardId)
                            ->orWhere('from_cards_id', $activeCardId);
                    })->orWhere(function ($q) use ($activeCardId) {
                        $q->where('type', TransactionsType::EXPENSE->value)
                            ->where('from_cards_id', $activeCardId);
                    });
                });
            }

            // Filter type untuk PAGINATION QUERY
            if ($filter === 'income') {
                $paginatedTransactionsQuery->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ]);
            } elseif ($filter === 'expense') {
                $paginatedTransactionsQuery->where('type', TransactionsType::EXPENSE->value);
            }

            // Filter type untuk ALL DATA QUERY (analytics)
            if ($filter !== 'all') {
                $allTransactionsQuery->where(function ($query) use ($filter) {
                    if ($filter === 'income') {
                        $query->whereIn('type', [
                            TransactionsType::INCOME->value,
                            TransactionsType::CONVERT->value
                        ]);
                    } elseif ($filter === 'expense') {
                        $query->where('type', TransactionsType::EXPENSE->value);
                    }
                });
            }

            // PAGINATION - Execute query dengan pagination
            $paginatedTransactions = $paginatedTransactionsQuery->latest()->paginate($perPage);

            // Format transactions untuk response
            $formattedTransactions = $paginatedTransactions->getCollection()->map(function ($data) use ($activeCardId) {
                if ($data->type === TransactionsType::CONVERT->value) {
                    if ($activeCardId == $data->to_cards_id) {
                        $currency = $data->toCard?->currency;
                        $displayAmount = $data->converted_amount;
                    } elseif ($activeCardId == $data->from_cards_id) {
                        $currency = $data->fromCard?->currency;
                        $displayAmount = $data->amount;
                    } else {
                        $currency = $data->toCard?->currency ?? $data->fromCard?->currency;
                        $displayAmount = $data->converted_amount;
                    }
                } elseif ($data->type === TransactionsType::EXPENSE->value) {
                    $currency = $data->fromCard?->currency;
                    $displayAmount = $data->amount;
                } else {
                    $currency = $data->toCard?->currency;
                    $displayAmount = $data->converted_amount;
                }

                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }

                $currency ??= Currency::INDONESIAN_RUPIAH->value;
                $currencySymbol = Currency::from($currency)->symbol();

                if ($data->type === TransactionsType::CONVERT->value) {
                    if ($activeCardId == $data->to_cards_id) {
                        $displayAmount = $data->converted_amount;
                    } elseif ($activeCardId == $data->from_cards_id) {
                        $displayAmount = $data->amount;
                    } else {
                        $displayAmount = $data->converted_amount;
                    }
                } else {
                    $displayAmount = $data->amount;
                }

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

            // Replace collection dengan data yang sudah diformat
            $paginatedTransactions->setCollection($formattedTransactions);

            // ANALYTICS - Ambil semua data untuk analytics
            $allTransactionsForAnalytics = $allTransactionsQuery->get();

            // Hitung total income dan expense untuk analytics
            $totalIncome = $allTransactionsForAnalytics
                ->whereIn('type', [TransactionsType::INCOME->value, TransactionsType::CONVERT->value])
                ->sum(function ($transaction) {
                    return $transaction->type === TransactionsType::CONVERT->value
                        ? $transaction->converted_amount
                        : $transaction->amount;
                });

            $totalExpense = $allTransactionsForAnalytics
                ->whereIn('type', [TransactionsType::EXPENSE->value, TransactionsType::CONVERT->value])
                ->sum(function ($transaction) {
                    return $transaction->type === TransactionsType::CONVERT->value
                        ? $transaction->amount
                        : $transaction->amount;
                });

            // Hitung income/expense per card
            $incomePerCard = collect();
            $expensePerCard = collect();

            foreach ($allTransactionsForAnalytics as $transaction) {
                if (in_array($transaction->type, [TransactionsType::INCOME->value, TransactionsType::CONVERT->value])) {
                    $cardId = $transaction->to_cards_id;
                    $amount = $transaction->type === TransactionsType::CONVERT->value
                        ? $transaction->converted_amount
                        : $transaction->amount;

                    $incomePerCard[$cardId] = ($incomePerCard[$cardId] ?? 0) + $amount;
                }

                if (in_array($transaction->type, [TransactionsType::EXPENSE->value, TransactionsType::CONVERT->value])) {
                    $cardId = $transaction->from_cards_id;
                    $amount = $transaction->amount;

                    $expensePerCard[$cardId] = ($expensePerCard[$cardId] ?? 0) + $amount;
                }
            }

            // Untuk "All Cards", hitung total dari semua cards
            if ($activeCardId == 0) {
                $incomePerCard[0] = $totalIncome;
                $expensePerCard[0] = $totalExpense;
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

            // CHART DATA - Monthly data
            $currentYear = now()->year;

            $monthlyIncomeData = $allTransactionsForAnalytics
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

            $monthlyExpenseData = $allTransactionsForAnalytics
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

            // Format monthly chart data - PER CARD
            $monthlyChartData = collect();

            // Data untuk "All Cards" (gabungan semua card)
            if ($activeCardId == 0 || !$activeCardId) {
                $allMonthlyData = collect(range(1, 12))->map(function ($month) use ($monthlyIncomeData, $monthlyExpenseData) {
                    $totalIncome = 0;
                    $totalExpense = 0;

                    foreach ($monthlyIncomeData as $cardData) {
                        $totalIncome += $cardData->get($month, 0);
                    }

                    foreach ($monthlyExpenseData as $cardData) {
                        $totalExpense += $cardData->get($month, 0);
                    }

                    return [
                        'month' => Carbon::create()->month($month)->format('M'),
                        'income' => $totalIncome,
                        'expense' => $totalExpense,
                        'label' => Carbon::create()->month($month)->format('M'),
                    ];
                });
                $monthlyChartData[0] = $allMonthlyData;
            }

            // Data untuk masing-masing card
            foreach ($cards as $card) {
                $cardId = $card->id;
                $monthlyChartData[$cardId] = collect(range(1, 12))->map(function ($month) use ($monthlyIncomeData, $monthlyExpenseData, $cardId) {
                    return [
                        'month' => $month,
                        'income' => $monthlyIncomeData->get($cardId, collect())->get($month, 0),
                        'expense' => $monthlyExpenseData->get($cardId, collect())->get($month, 0),
                        'label' => Carbon::create()->month($month)->format('M'),
                    ];
                });
            }

            // YEARLY DATA
            $yearlyIncomeData = $allTransactionsForAnalytics
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

            $yearlyExpenseData = $allTransactionsForAnalytics
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

            // Format yearly chart data - PER CARD
            $yearlyChartData = collect();
            $allYears = $allTransactionsForAnalytics->pluck('transaction_date')
                ->map(fn($date) => $date->year)
                ->unique()
                ->sort()
                ->values();

            // Data untuk "All Cards" (gabungan semua card)
            if ($activeCardId == 0 || !$activeCardId) {
                $allYearlyData = $allYears->map(function ($year) use ($yearlyIncomeData, $yearlyExpenseData) {
                    $totalIncome = 0;
                    $totalExpense = 0;

                    foreach ($yearlyIncomeData as $cardData) {
                        $totalIncome += $cardData->get($year, 0);
                    }

                    foreach ($yearlyExpenseData as $cardData) {
                        $totalExpense += $cardData->get($year, 0);
                    }

                    return [
                        'year' => $year,
                        'income' => $totalIncome,
                        'expense' => $totalExpense,
                        'label' => (string) $year,
                    ];
                });
                $yearlyChartData[0] = $allYearlyData;
            }

            // Data untuk masing-masing card
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

            // Calculate rates untuk analytics
            $totalTransactions = $totalIncome + $totalExpense;
            $incomeRate = $totalTransactions > 0 ? round(($totalIncome / $totalTransactions) * 100, 2) : 0;
            $expenseRate = $totalTransactions > 0 ? round(($totalExpense / $totalTransactions) * 100, 2) : 0;

            return Inertia::render('activity/index', [
                'transactions' => $paginatedTransactions, // Paginator instance dengan data yang sudah diformat
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
        } catch (\Exception $e) {
            // dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function exportAllActivity(Request $request)
    {
        try {
            $userId = Auth::id();

            $transactions = Transactions::where('user_id', $userId)
                ->with('toCard')
                ->get();

            return Excel::download(new TransactionExport($transactions), 'all-activity.xlsx');
        } catch (\Exception $e) {
            //  dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function exportIncomeActivity(Request $request)
    {
        try {
            $userId = Auth::id();

            $transactions = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->with('toCard')
                ->get();

            return Excel::download(new TransactionExport($transactions), 'income-activity.xlsx');
        } catch (\Exception $e) {
            //  dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function exportExpenseActivity(Request $request)
    {
        try {
            $userId = Auth::id();

            $transactions = Transactions::where('user_id', $userId)
                ->where('type', TransactionsType::EXPENSE->value)
                ->with('toCard')
                ->get();

            return Excel::download(new TransactionExport($transactions), 'expense-activity.xlsx');
        } catch (\Exception $e) {
            //  dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }
    }

    public function expenseActivity(Request $request)
{
    try {
        $userId = Auth::id();

        $filter = $request->query('filter', 'all');
        $chartMode = $request->query('chartMode', 'monthly');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $activeCardId = $request->query('activeCardId', 0);
        $perPage = $request->query('per_page', 20);

        $cards = Cards::where('user_id', $userId)->get();

        // QUERY UNTUK PAGINATION - INCLUDE CONVERT TRANSACTIONS (FROM_CARD ONLY)
        $expenseTransactionsQuery = Transactions::where('user_id', $userId)
            ->where(function ($query) {
                $query->where('type', TransactionsType::EXPENSE->value)
                    ->orWhere(function ($q) {
                        $q->where('type', TransactionsType::CONVERT->value);
                    });
            })
            ->with(['toCard', 'fromCard']);

        // Filter berdasarkan card jika dipilih
        if ($activeCardId && $activeCardId != 0) {
            $expenseTransactionsQuery->where(function ($query) use ($activeCardId) {
                $query->where(function ($q) use ($activeCardId) {
                    $q->where('type', TransactionsType::EXPENSE->value)
                        ->where('from_cards_id', $activeCardId);
                })->orWhere(function ($q) use ($activeCardId) {
                    $q->where('type', TransactionsType::CONVERT->value)
                        ->where('from_cards_id', $activeCardId);
                });
            });
        }

        // Filter tanggal jika ada
        if ($startDate && $endDate) {
            $expenseTransactionsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        // PAGINATE QUERY YANG SUDAH DIFILTER
        $paginatedTransactions = $expenseTransactionsQuery->latest()->paginate($perPage);

        $formattedTransactions = $paginatedTransactions->getCollection()->map(function ($data) use ($activeCardId) {
            // Untuk CONVERT, tentukan currency dan amount berdasarkan from_card
            if ($data->type === TransactionsType::CONVERT->value) {
                $currency = $data->fromCard?->currency;
                $displayAmount = $data->amount; // Amount yang dikirim (original amount)
                $categoryLabel = 'Convert';
            } else {
                // Untuk EXPENSE biasa
                $currency = $data->fromCard?->currency;
                $displayAmount = $data->amount;
                $categoryLabel = $data->category ? Category::from($data->category)->label() : 'Other';
            }

            if ($currency instanceof Currency) {
                $currency = $currency->value;
            }

            if (!$currency) {
                $currency = $data->toCard?->currency;
                if ($currency instanceof Currency) {
                    $currency = $currency->value;
                }
            }

            $currency ??= Currency::INDONESIAN_RUPIAH->value;
            $currencySymbol = Currency::from($currency)->symbol();

            // Tentukan type_label yang sesuai
            $typeLabel = $data->type === TransactionsType::CONVERT->value 
                ? 'Convert' 
                : TransactionsType::from($data->type)->label();

            return [
                'id'               => $data->id,
                'to_cards_id'      => $data->to_cards_id,
                'from_cards_id'    => $data->from_cards_id,
                'user_name'        => Auth::user()->name,
                'type'             => $data->type,
                'type_label'       => $typeLabel,
                'amount'           => $displayAmount,
                'formatted_amount' => $currencySymbol . ' ' . number_format($displayAmount, 0, ',', '.'),
                'notes'            => $data->notes,
                'currency'         => $currency,
                'asset'            => $data->asset,
                'asset_label'      => Asset::from($data->asset)->label(),
                'category'         => $data->category,
                'category_label'   => $categoryLabel,
                'transaction_date' => $data->transaction_date->format('d F Y'),
                'created_at'       => $data->created_at,
            ];
        });

        // REPLACE COLLECTION DENGAN DATA YANG SUDAH DIFORMAT
        $paginatedTransactions->setCollection($formattedTransactions);

        // ANALYTICS QUERY - INCLUDE CONVERT TRANSACTIONS (FROM_CARD ONLY)
        $analyticsQuery = Transactions::where('user_id', $userId)
            ->where(function ($query) {
                $query->where('type', TransactionsType::EXPENSE->value)
                    ->orWhere(function ($q) {
                        $q->where('type', TransactionsType::CONVERT->value);
                    });
            })
            ->with(['toCard', 'fromCard']);

        // TERAPKAN FILTER CARD JUGA PADA ANALYTICS
        if ($activeCardId && $activeCardId != 0) {
            $analyticsQuery->where(function ($query) use ($activeCardId) {
                $query->where(function ($q) use ($activeCardId) {
                    $q->where('type', TransactionsType::EXPENSE->value)
                        ->where('from_cards_id', $activeCardId);
                })->orWhere(function ($q) use ($activeCardId) {
                    $q->where('type', TransactionsType::CONVERT->value)
                        ->where('from_cards_id', $activeCardId);
                });
            });
        }

        if ($startDate && $endDate) {
            $analyticsQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $allExpenseTransactions = $analyticsQuery->get();

        $totalExpenseForDisplay = $paginatedTransactions->getCollection()->sum('amount');
        $totalExpenseForAnalytics = $allExpenseTransactions->sum('amount');

        // Group by category - untuk CONVERT gunakan category khusus
        $expenseByCategory = $allExpenseTransactions
            ->groupBy(function ($transaction) {
                if ($transaction->type === TransactionsType::CONVERT->value) {
                    return 'convert'; // Category khusus untuk convert
                }
                return $transaction->category;
            })
            ->map(function ($transactions) {
                return $transactions->sum('amount');
            })
            ->mapWithKeys(function ($total, $category) {
                if ($category === 'convert') {
                    $categoryLabel = 'Convert';
                } else {
                    $categoryLabel = $category ? Category::from($category)->label() : 'Other';
                }
                return [$categoryLabel => (float) $total];
            });

        $topCategories = $expenseByCategory->sortByDesc(function ($value) {
            return $value;
        })->take(5);

        // ✅ EXPENSE PER CARD - UNTUK SIDEBAR (INCLUDE CONVERT)
        $allCardsExpenseQuery = Transactions::where('user_id', $userId)
            ->where(function ($query) {
                $query->where('type', TransactionsType::EXPENSE->value)
                    ->orWhere(function ($q) {
                        $q->where('type', TransactionsType::CONVERT->value);
                    });
            });

        // Filter tanggal tetap diterapkan jika ada
        if ($startDate && $endDate) {
            $allCardsExpenseQuery->whereBetween('transaction_date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $allCardsExpenseTransactions = $allCardsExpenseQuery->get();

        // Hitung expense untuk SETIAP card dari semua transaksi (EXPENSE + CONVERT from_card)
        $expensePerCard = collect();
        foreach ($cards as $card) {
            $cardExpense = $allCardsExpenseTransactions
                ->where('from_cards_id', $card->id)
                ->sum(function ($transaction) {
                    // Untuk CONVERT, gunakan amount (bukan converted_amount)
                    return $transaction->amount;
                });
            $expensePerCard[$card->id] = (float) $cardExpense;
        }

        // Total untuk "All Cards"
        $expensePerCard[0] = (float) $allCardsExpenseTransactions->sum('amount');

        // ... (rest of the code untuk monthly average, chart data, etc. tetap sama)

        $monthlyAveragePerCard = [];
        $currentYear = now()->year;
        $currentMonth = now()->month;

        foreach ($cards as $card) {
            $cardTransactions = $allCardsExpenseTransactions->where('from_cards_id', $card->id);

            $currentYearExpense = $cardTransactions
                ->filter(function ($transaction) use ($currentYear) {
                    return $transaction->transaction_date->year === $currentYear;
                })
                ->sum(function ($transaction) {
                    return $transaction->amount;
                });

            $avgMonthlyExpense = $currentMonth > 0
                ? $currentYearExpense / $currentMonth
                : 0;

            $monthlyAveragePerCard[$card->id] = $avgMonthlyExpense;
        }

        // Calculate monthly average growth rate untuk All Cards
        $currentYearExpense = $allExpenseTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear;
            })
            ->sum(function ($transaction) {
                return $transaction->amount;
            });

        $avgMonthlyExpense = $currentMonth > 0
            ? $currentYearExpense / $currentMonth
            : 0;

        $previousYearExpense = $allExpenseTransactions
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === ($currentYear - 1);
            })
            ->sum(function ($transaction) {
                return $transaction->amount;
            });

        $previousAvgMonthlyExpense = $currentMonth > 0
            ? $previousYearExpense / $currentMonth
            : 0;

        if ($previousAvgMonthlyExpense > 0) {
            $avgMonthlyExpenseGrowthRate = (($avgMonthlyExpense - $previousAvgMonthlyExpense) / $previousAvgMonthlyExpense) * 100;
        } elseif ($avgMonthlyExpense > 0 && $previousAvgMonthlyExpense == 0) {
            $avgMonthlyExpenseGrowthRate = 100;
        } else {
            $avgMonthlyExpenseGrowthRate = 0;
        }

        // Untuk expense growth rate (total expense)
        $transactionsForAverage = $activeCardId && $activeCardId != 0
            ? $allExpenseTransactions->where('from_cards_id', $activeCardId)
            : $allExpenseTransactions;

        $currentYearExpenseForGrowth = $transactionsForAverage
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === $currentYear;
            })
            ->sum(function ($transaction) {
                return $transaction->amount;
            });

        $previousYearExpenseForGrowth = $transactionsForAverage
            ->filter(function ($transaction) use ($currentYear) {
                return $transaction->transaction_date->year === ($currentYear - 1);
            })
            ->sum(function ($transaction) {
                return $transaction->amount;
            });

        if ($previousYearExpenseForGrowth > 0) {
            $expenseGrowthRate = (($currentYearExpenseForGrowth - $previousYearExpenseForGrowth) / $previousYearExpenseForGrowth) * 100;
        } elseif ($currentYearExpenseForGrowth > 0 && $previousYearExpenseForGrowth == 0) {
            $expenseGrowthRate = 100;
        } else {
            $expenseGrowthRate = 0;
        }

        // Data chart berdasarkan CARD YANG AKTIF
        $monthlyExpenseData = $allExpenseTransactions
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

        // Yearly data untuk chart
        $yearlyExpenseData = $allExpenseTransactions
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

        return Inertia::render('activity/expense/index', [
            'transactions' => $paginatedTransactions,
            'cards' => $cards,
            'chartData' => [
                'monthly' => $monthlyChartData,
                'yearly' => $yearlyChartData,
            ],
            'expenseByCategory' => $expenseByCategory,
            'topCategories' => $topCategories,
            'totalExpense' => $totalExpenseForDisplay,
            'avgMonthlyExpense' => $avgMonthlyExpense,
            'monthlyAveragePerCard' => $monthlyAveragePerCard,
            'avgMonthlyExpenseGrowthRate' => $avgMonthlyExpenseGrowthRate,
            'expenseGrowthRate' => $expenseGrowthRate,
            'expensePerCard' => $expensePerCard,
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
    } catch (\Exception $e) {
        return back()->with('error', 'Something went wrong. Please try again.');
    }
}

    public function incomeActivity(Request $request)
    {
        try {
            $userId = Auth::id();

            $filter = $request->query('filter', 'all');
            $chartMode = $request->query('chartMode', 'monthly');
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $activeCardId = $request->query('activeCardId', 0);
            $perPage = $request->query('per_page', 20);

            $cards = Cards::where('user_id', $userId)->get();

            if ($activeCardId && !$cards->contains('id', $activeCardId)) {
                $activeCardId = 0; // Reset ke "All Cards" jika card tidak ditemukan
            }

            //  QUERY DENGAN PAGINATION - SAMA SEPERTI allActivity
            $transactionsQuery = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->with(['toCard', 'fromCard']);

            if ($activeCardId && $activeCardId !== 0) {
                $transactionsQuery->where('to_cards_id', $activeCardId);
            }

            if ($startDate && $endDate) {
                $transactionsQuery->whereBetween('transaction_date', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            }

            //  PAGINATE QUERY YANG SUDAH DIFILTER
            $paginatedTransactions = $transactionsQuery->latest()->paginate($perPage);

            //  MAP TRANSACTIONS UNTUK DISPLAY - SAMA SEPERTI allActivity
            $formattedTransactions = $paginatedTransactions->getCollection()->map(function ($data) {
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
                    'from_cards_id'    => $data->from_cards_id,
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

            //  REPLACE COLLECTION DENGAN DATA YANG SUDAH DIFORMAT
            $paginatedTransactions->setCollection($formattedTransactions);

            //  QUERY TERPISAH UNTUK ANALYTICS & CHART (tanpa pagination, semua data)
            $analyticsQuery = Transactions::where('user_id', $userId)
                ->whereIn('type', [
                    TransactionsType::INCOME->value,
                    TransactionsType::CONVERT->value
                ])
                ->with(['toCard', 'fromCard']);

            // if ($activeCardId && $activeCardId !== 0) {
            //     $analyticsQuery->where('to_cards_id', $activeCardId);
            // }

            if ($startDate && $endDate) {
                $analyticsQuery->whereBetween('transaction_date', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            }

            $allTransactionsForAnalytics = $analyticsQuery->get();

            // Hitung total income dari semua data analytics
            $totalIncome = $allTransactionsForAnalytics->sum(function ($transaction) {
                return $transaction->type === TransactionsType::CONVERT->value
                    ? $transaction->converted_amount
                    : $transaction->amount;
            });

            // Hitung income per card dari semua data analytics
            $incomePerCard = collect();
            foreach ($allTransactionsForAnalytics as $transaction) {
                $cardId = $transaction->to_cards_id;
                $amount = $transaction->type === TransactionsType::CONVERT->value
                    ? $transaction->converted_amount
                    : $transaction->amount;

                $incomePerCard[$cardId] = ($incomePerCard[$cardId] ?? 0) + $amount;
            }

            // Untuk "All Cards", hitung total dari semua cards
            if ($activeCardId == 0) {
                $incomePerCard[0] = $totalIncome;
            }

            // Income by category berdasarkan semua data analytics
            $incomeByCategory = $allTransactionsForAnalytics
                ->groupBy('category')
                ->map(function ($transactions) {
                    return $transactions->sum(function ($transaction) {
                        return $transaction->type === TransactionsType::CONVERT->value
                            ? $transaction->converted_amount
                            : $transaction->amount;
                    });
                })
                ->mapWithKeys(function ($total, $category) {
                    $categoryLabel = $category ? Category::from($category)->label() : 'Convert';
                    return [$categoryLabel => (float) $total];
                });

            // Income by category per card berdasarkan semua data analytics
            $incomeByCategoryPerCard = [];

            // Data untuk "All Cards"
            $incomeByCategoryPerCard[0] = $incomeByCategory->toArray();

            // Data untuk masing-masing card
            foreach ($cards as $card) {
                $cardCategories = $allTransactionsForAnalytics
                    ->where('to_cards_id', $card->id)
                    ->groupBy('category')
                    ->map(function ($transactions) {
                        return $transactions->sum(function ($transaction) {
                            return $transaction->type === TransactionsType::CONVERT->value
                                ? $transaction->converted_amount
                                : $transaction->amount;
                        });
                    })
                    ->mapWithKeys(function ($total, $category) {
                        $categoryLabel = $category ? Category::from($category)->label() : 'Convert';
                        return [$categoryLabel => (float) $total];
                    });

                $incomeByCategoryPerCard[$card->id] = $cardCategories->toArray();
            }

            // Chart data berdasarkan semua data analytics
            $currentYear = now()->year;

            // Monthly data untuk chart
            $monthlyIncomeData = $allTransactionsForAnalytics
                ->filter(function ($transaction) use ($currentYear) {
                    return $transaction->transaction_date->year === $currentYear;
                })
                ->groupBy(function ($transaction) {
                    return $transaction->transaction_date->month;
                })
                ->map(function ($transactions) {
                    return $transactions->sum(function ($transaction) {
                        return $transaction->type === TransactionsType::CONVERT->value
                            ? $transaction->converted_amount
                            : $transaction->amount;
                    });
                });

            $monthlyChartData = collect(range(1, 12))->map(function ($month) use ($monthlyIncomeData) {
                $incomeAmount = $monthlyIncomeData->get($month, 0);
                return [
                    'month' => Carbon::create()->month($month)->format('M'),
                    'income' => $incomeAmount,
                    'label' => Carbon::create()->month($month)->format('M'),
                ];
            });

            // Yearly data untuk chart
            $yearlyIncomeData = $allTransactionsForAnalytics
                ->groupBy(function ($transaction) {
                    return $transaction->transaction_date->year;
                })
                ->map(function ($transactions) {
                    return $transactions->sum(function ($transaction) {
                        return $transaction->type === TransactionsType::CONVERT->value
                            ? $transaction->converted_amount
                            : $transaction->amount;
                    });
                })
                ->sortKeys();

            $yearlyChartData = $yearlyIncomeData->map(function ($incomeAmount, $year) {
                return [
                    'year' => $year,
                    'income' => $incomeAmount,
                    'label' => (string) $year,
                ];
            })->values();

            // Calculate average monthly income
            $avgMonthlyIncome = 0;
            if ($startDate && $endDate) {
                $start = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);
                $monthsDiff = $start->diffInMonths($end) + 1;
                $avgMonthlyIncome = $totalIncome / $monthsDiff;
            } else {
                $avgMonthlyIncome = $totalIncome / 12;
            }

            // Calculate growth rate
            $previousYearIncome = $allTransactionsForAnalytics
                ->filter(function ($transaction) use ($currentYear) {
                    return $transaction->transaction_date->year === ($currentYear - 1);
                })
                ->sum(function ($transaction) {
                    return $transaction->type === TransactionsType::CONVERT->value
                        ? $transaction->converted_amount
                        : $transaction->amount;
                });

            $growthRate = $previousYearIncome > 0
                ? (($totalIncome - $previousYearIncome) / $previousYearIncome) * 100
                : ($totalIncome > 0 ? 100 : 0);

            $growthRate = round($growthRate, 1);
        } catch (\Exception $e) {
            // dd($e->getMessage(), $e->getTrace());
            return back()->with('error', 'Something went wrong. Please try again.');
        }

        return Inertia::render('activity/income/index', [
            'transactions' => $paginatedTransactions, //  GUNAKAN PAGINATOR INSTANCE
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
