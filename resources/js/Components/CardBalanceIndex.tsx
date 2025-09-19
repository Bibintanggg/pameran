import { usePage } from "@inertiajs/react";
import CardBalance from "./CardBalance";
import { TrendingUp, TrendingDown } from "lucide-react";
import { currencyMap } from "@/utils/formatCurrency";

interface Card {
    id: number
    balance: number
    currency: string
}

interface PageProps {
    cards: Card[]
    incomeRateHigh: number
    incomeRateLow: number
    expenseRateHigh: number
    expenseRateLow: number
}
export default function CardBalanceIndex({ cards, incomeRateHigh, incomeRateLow, expenseRateHigh, expenseRateLow}: PageProps) {

    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex gap-4">
                    {cards.map((card: Card) => (
                        <CardBalance
                            key={card.id}
                            currency={currencyMap[card.currency]}
                            balance={card.balance}
                            type="Income"
                            icon={<TrendingUp />}
                            rate={incomeRateHigh}
                            rateLow={incomeRateLow}
                        />
                    ))}
                </div>
            </div>

            <div>
                <div className="flex gap-4">
                    {cards.map((card: Card) => (
                        <CardBalance
                            key={card.id}
                            currency={currencyMap[card.currency]}
                            balance={card.balance} // balance tiap card
                            type="Expense"
                            icon={<TrendingDown />}
                            rate={expenseRateHigh}
                            rateLow={expenseRateLow}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
