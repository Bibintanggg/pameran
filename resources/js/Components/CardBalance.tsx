import { TrendingDown, TrendingUp } from "lucide-react"
import React from "react"

interface CardBalanceProps {
    currency: string
    balance: number
    type: "Income" | "Expense"
    icon: React.ReactNode
    rate: number
    rateLow: number
}

export default function CardBalance({
    currency,
    balance,
    type,
    icon,
    rate,
    rateLow,
}: CardBalanceProps) {
    return (
        <div className="bg-white w-44 h-24 rounded-lg shadow-sm flex flex-col justify-between p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-3 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{rate}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-red-500">
                        <TrendingDown className="w-4 h-4" />
                        <span>{rateLow}%</span>
                    </div>
                </div>
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-[#215509]">
                    {icon}
                </div>
            </div>

            <div className="flex flex-col text-center">
                <h1 className="text-xl font-semibold">
                    {currency} {balance.toLocaleString("id-ID")}
                </h1>
                <p className="text-sm text-gray-500">{type}</p>
            </div>
        </div>
    )
}
