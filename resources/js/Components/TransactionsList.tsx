import { usePage } from "@inertiajs/react";
import { useState } from "react";
import { Transaction } from "@/types/transaction";
import { formatCurrency, currencyMap } from "@/utils/formatCurrency";
import { ChevronsRightLeftIcon } from "lucide-react"
import { PaginationComponent } from "./PaginationComponent";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Wallet, ChevronDown, ChevronUp } from "lucide-react";

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
    activeCardId?: number | null
}

export default function TransactionsList({ transactions, onPageChange, activeCardId }: TransactionListProps) {
    const { auth, cards } = usePage().props as any;
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

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
                return <ChevronsRightLeftIcon className="w-5 h-5 text-blue-600" />;
            default:
                return <Wallet className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'income':
                return 'bg-green-100 border-green-200 hover:bg-green-100';
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

    const getAmountPrefix = (transaction: Transaction): string => {
        if (transaction.type === 'convert') {
            if (activeCardId === transaction.to_cards_id) {
                return '+ ';
            } else if (activeCardId === transaction.from_cards_id) {
                return '- ';
            }
        }
        return transaction.type === 'expense' ? '- ' : '+ ';
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                {transactions.data.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions found</p>
                )}

                {transactions.data.map((transaction) => {
                    const isExpanded = expandedIds.includes(transaction.id);
                    const amountPrefix = getAmountPrefix(transaction)

                    return (
                        <div
                            key={transaction.id}
                            className={`flex flex-col rounded-lg border transition-all ${getTransactionColor(transaction.type)}`}
                        >
                            {/* Mobile Layout */}
                            <div
                                className="flex items-start gap-2 p-3 md:hidden cursor-pointer"
                                onClick={() => toggleExpand(transaction.id)}
                            >
                                {/* Icon */}
                                <div className="mt-0.5">
                                    {getTransactionIcon(transaction.type)}
                                </div>

                                {/* Transaction Details - Mobile Compact */}
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    {/* Header: User & Amount */}
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {auth.user.name.split(" ")[0]}
                                        </p>
                                        <span className={`font-bold text-base whitespace-nowrap ${getAmountColor(transaction.type)}`}>
                                            {amountPrefix}
                                            {formatCurrency(transaction.amount, currencyMap[transaction.currency])}
                                        </span>
                                    </div>

                                    {/* Card Info - Compact */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        {transaction.type === 'convert' ? (
                                            <>
                                                <span className="truncate max-w-[80px]">
                                                    {getCardName(transaction.from_cards_id)}
                                                </span>
                                                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate max-w-[80px]">
                                                    {getCardName(transaction.to_cards_id)}
                                                </span>
                                            </>
                                        ) : transaction.type === 'income' ? (
                                            <span className="truncate">
                                                To: {getCardName(transaction.to_cards_id)}
                                            </span>
                                        ) : (
                                            <span className="truncate">
                                                From: {getCardName(transaction.from_cards_id)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Date & Category */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{transaction.transaction_date}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="truncate">{transaction.category_label}</span>
                                    </div>
                                </div>

                                {/* Expand Icon */}
                                <div className="mt-0.5">
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Detail - Mobile */}
                            {isExpanded && (
                                <div className="px-3 pb-3 md:hidden border-t border-gray-200/50 pt-3 space-y-2">
                                    {/* Full Amount */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Full Amount:</span>
                                        <span className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                                            {amountPrefix}
                                            {formatCurrency(transaction.amount, currencyMap[transaction.currency])}
                                        </span>
                                    </div>

                                    {/* Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Type:</span>
                                        <span className="text-xs font-medium">{transaction.type_label}</span>
                                    </div>

                                    {/* Asset */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Asset:</span>
                                        <span className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200">
                                            {transaction.asset_label}
                                        </span>
                                    </div>

                                    {/* Notes */}
                                    {transaction.notes && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-500">Notes:</span>
                                            <p className="text-xs text-gray-700 bg-white p-2 rounded-md border border-gray-200">
                                                {transaction.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Desktop Layout */}
                            <div className="hidden md:flex items-start gap-3 p-4 flex-1">
                                {/* Icon */}
                                <div className="mt-1">
                                    {getTransactionIcon(transaction.type)}
                                </div>

                                {/* Transaction Details - Desktop */}
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

                                {/* Amount & Type - Desktop */}
                                <div className="flex flex-col items-end justify-center ml-4">
                                    <span className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                                        {amountPrefix}
                                        {formatCurrency(transaction.amount, currencyMap[transaction.currency])}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {transaction.type_label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {transactions.data.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="text-xs sm:text-sm text-gray-500">
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
