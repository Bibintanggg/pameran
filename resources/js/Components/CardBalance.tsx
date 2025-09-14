import { TrendingDown, TrendingUp } from "lucide-react"
import React from "react"
import { formatCurrency } from "@/utils/formatCurrency"

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
        <div className="bg-white w-36 md:w-44 lg:w-44 h-20 md:h-24 lg:h-28 rounded-lg shadow-sm 
        flex flex-col justify-between p-2 md:p-3">
            <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm text-gray-500">{type}</p>
                <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-gray-100 text-[#215509]">
                    {icon}
                </div>
            </div>

            <div className="flex flex-col text-center">
                <h1 className="text-md md:text-lg lg:text-xl font-semibold leading-tight">
                    {formatCurrency(balance, currency)}
                </h1>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-2 text-sm justify-center mx-auto">
                    <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-xs">{rate}%</span>
                    </div>
                    <div className="flex items-center text-red-500 gap-1">
                        <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-xs">{rateLow}%</span>
                    </div>
                </div>
            </div>
        </div>
    )
}