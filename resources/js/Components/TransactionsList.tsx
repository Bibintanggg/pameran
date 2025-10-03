import { usePage } from "@inertiajs/react";
import { Transaction } from "@/types/transaction";
import { formatCurrency, currencyMap } from "@/utils/formatCurrency";
import { PaginationComponent } from "./PaginationComponent";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

interface TransactionListProps {
    transactions: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    onPageChange: (page: number) => void;
}

export default function TransactionsList({ transactions, onPageChange }: TransactionListProps) {
    const { auth, cards } = usePage().props as any;

    const getCardName = (cardId: number | null) => {
        if (!cardId) return "N/A";
        const card = cards?.find((c: any) => c.id === cardId);
        return card?.name || "Unknown Card";
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'income':
                return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
            case 'expense':
                return <ArrowUpRight className="w-5 h-5 text-red-600" />;
            case 'convert':
                return <ArrowRight className="w-5 h-5 text-blue-600" />;
            default:
                return <Wallet className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'income':
                return 'bg-green-50 border-green-200 hover:bg-green-100';
            case 'expense':
                return 'bg-red-50 border-red-200 hover:bg-red-100';
            case 'convert':
                return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            default:
                return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
        }
    };

    const getAmountColor = (type: string) => {
        switch (type) {
            case 'income':
                return 'text-green-600';
            case 'expense':
                return 'text-red-600';
            case 'convert':
                return 'text-blue-600';
            default:
                return 'text-gray-900';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                {transactions.data.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions found</p>
                )}

                {transactions.data.map((transaction) => (
                    <div
                        key={transaction.id}
                        className={`flex justify-between p-4 rounded-lg border transition-all ${getTransactionColor(transaction.type)}`}
                    >
                        <div className="flex items-start gap-3 flex-1">
                            {/* Icon */}
                            <div className="mt-1">
                                {getTransactionIcon(transaction.type)}
                            </div>

                            {/* Transaction Details */}
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                {/* Header: User & Date */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-base text-gray-900">
                                        {auth.user.name.split(" ")[0]}
                                    </p>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 text-sm">
                                        {transaction.transaction_date}
                                    </span>
                                </div>

                                {/* Card Information */}
                                <div className="flex items-center gap-2 text-sm">
                                    {transaction.type === 'convert' ? (
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <span className="font-medium">
                                                {getCardName(transaction.from_cards_id)}
                                            </span>
                                            <ArrowRight className="w-3 h-3" />
                                            <span className="font-medium">
                                                {getCardName(transaction.to_cards_id)}
                                            </span>
                                        </div>
                                    ) : transaction.type === 'income' ? (
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Wallet className="w-3 h-3" />
                                            <span className="font-medium">
                                                To: {getCardName(transaction.to_cards_id)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Wallet className="w-3 h-3" />
                                            <span className="font-medium">
                                                From: {getCardName(transaction.from_cards_id)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                {transaction.notes && (
                                    <p className="text-sm text-gray-600 truncate">
                                        {transaction.notes}
                                    </p>
                                )}

                                {/* Asset & Category */}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
                                        {transaction.asset_label}
                                    </span>
                                    <span className="px-2 py-1 bg-white rounded-md border border-gray-200">
                                        {transaction.category_label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount & Type */}
                        <div className="flex flex-col items-end justify-center ml-4">
                            <span className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                                {transaction.type === 'expense' ? '- ' : '+ '}
                                {formatCurrency(transaction.amount, currencyMap[transaction.currency])}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                                {transaction.type_label}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {transactions.data.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        Showing {transactions.from} to {transactions.to} of {transactions.total} results
                    </div>
                    <PaginationComponent
                        currentPage={transactions.current_page}
                        totalPages={transactions.last_page}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
