<?php

namespace App\Http\Controllers;

use App\Enum\Currency;
use App\Enum\TransactionsType;
use App\Models\Cards;
use App\Models\Transactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShowCardsController extends Controller
{
    public function showCards(Request $request)
    {
        $userId = Auth::id();

        $cards = Cards::where('user_id', $userId)
            ->get()
            ->map(function ($card) {
                return [
                    'id' => $card->id,
                    'name' => $card->name,
                    'card_number' => $card->card_number ? 
                        '**** **** **** ' . substr($card->card_number, -4) : 
                        '**** **** **** ****',
                    'balance' => (float) $card->balance,
                    'currency' => $card->currency,
                    'type' => $this->getCardType($card->name),
                    'color' => $this->getCardGradient($card->id),
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
            ->selectRaw('from_cards_id, SUM(amount) as total')
            ->groupBy('from_cards_id')
            ->pluck('total', 'from_cards_id')
            ->mapWithKeys(fn($total, $cardId) => [(int) $cardId => (float) $total]);

        $cardsWithStats = $cards->map(function ($card) use ($incomePerCard, $expensePerCard) {
            $cardId = $card['id'];
            $income = $incomePerCard->get($cardId, 0);
            $expense = $expensePerCard->get($cardId, 0);
            
            return array_merge($card, [
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ]);
        });

        $totalBalance = $cardsWithStats->sum('balance');
        $totalIncome = $cardsWithStats->sum('income');
        $totalExpense = $cardsWithStats->sum('expense');
        $netIncome = $totalIncome - $totalExpense;

        $currentMonth = now();
        $previousMonth = now()->subMonth();

        $currentMonthIncome = Transactions::where('user_id', $userId)
            ->whereIn('type', [TransactionsType::INCOME->value, TransactionsType::CONVERT->value])
            ->whereMonth('transaction_date', $currentMonth->month)
            ->whereYear('transaction_date', $currentMonth->year)
            ->sum('amount');

        $previousMonthIncome = Transactions::where('user_id', $userId)
            ->whereIn('type', [TransactionsType::INCOME->value, TransactionsType::CONVERT->value])
            ->whereMonth('transaction_date', $previousMonth->month)
            ->whereYear('transaction_date', $previousMonth->year)
            ->sum('amount');

        $incomeGrowth = $previousMonthIncome > 0 ? 
            (($currentMonthIncome - $previousMonthIncome) / $previousMonthIncome) * 100 : 0;

        $currentMonthExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereMonth('transaction_date', $currentMonth->month)
            ->whereYear('transaction_date', $currentMonth->year)
            ->sum('amount');

        $previousMonthExpense = Transactions::where('user_id', $userId)
            ->where('type', TransactionsType::EXPENSE->value)
            ->whereMonth('transaction_date', $previousMonth->month)
            ->whereYear('transaction_date', $previousMonth->year)
            ->sum('amount');

        $expenseGrowth = $previousMonthExpense > 0 ? 
            (($currentMonthExpense - $previousMonthExpense) / $previousMonthExpense) * 100 : 0;

        return Inertia::render('cards/index', [
            'cards' => $cardsWithStats,
            'statistics' => [
                'totalCards' => $cardsWithStats->count(),
                'totalBalance' => $totalBalance,
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'netIncome' => $netIncome,
                'incomeGrowth' => round($incomeGrowth, 1),
                'expenseGrowth' => round($expenseGrowth, 1),
                'balanceGrowth' => 12.5, // Static for now, could be calculated
            ],
            'auth' => [
                'user' => [
                    'name' => Auth::user()->name,
                    'avatar' => Auth::user()->avatar,
                ]
            ]
        ]);
    }

    private function getCardType($cardName)
    {
        $name = strtolower($cardName);
        
        if (strpos($name, 'business') !== false) {
            return 'Business Account';
        } elseif (strpos($name, 'savings') !== false) {
            return 'Savings Account';
        } elseif (strpos($name, 'investment') !== false) {
            return 'Investment Account';
        } elseif (strpos($name, 'credit') !== false) {
            return 'Credit Card';
        } else {
            return 'Debit Card';
        }
    }

    private function getCardGradient($cardId)
    {
        $gradients = [
            1 => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            2 => 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            3 => 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            4 => 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            5 => 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            6 => 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            7 => 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            8 => 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        ];

        return $gradients[$cardId % 8 + 1] ?? $gradients[1];
    }
}