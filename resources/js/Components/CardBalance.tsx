import React from "react"

interface CardBalanceProps {
    currency: string
    balance: number
    type: 'Income' | 'Expense'
    icon: React.ReactNode
    rate: number
}

export default function CardBalance({
    currency,
    balance,
    type,
    icon,
    rate
}: CardBalanceProps) {
    return (
        <div>
            <div className='bg-white w-56 h-28 '>
            <h1>{currency} {balance.toLocaleString('id-ID')}</h1>
            <p>{type}</p>
            {icon}
            {rate}
            </div>
        </div>
    )
}