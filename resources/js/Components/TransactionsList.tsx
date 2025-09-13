import { usePage } from "@inertiajs/react";
import { Transaction } from "@/types/transaction";

interface TransactionListProps {
    transactions: Transaction[]
}

export default function TransactionsList({ transactions }: TransactionListProps) {
    const { auth } = usePage().props
    return (
        <div className="mt-4 flex flex-col gap-3">
            {transactions.length === 0 && <p className="text-gray-500">Belum ada transaksi</p>}
            {transactions.map((transaction) => (
                <div
                    key={transaction.id}
                    className="flex justify-between bg-gray-100 p-3 rounded-lg items-center"
                >
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{auth.user.name}</p>
                            <span className="text-gray-500 text-sm">{transaction.transaction_date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">Notes: {transaction.notes}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Asset: {transaction.asset_label}</span>
                            <span className="text-gray-500 text-sm">Category: {transaction.category_label}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="flex items-end flex-col">
                        <span className="font-medium">{transaction.formatted_amount}</span>
                        <span className="text-sm">{transaction.type_label}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
