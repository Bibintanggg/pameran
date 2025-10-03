"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import TransactionsList from "@/Components/TransactionsList";
import Sidebar from "@/Components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Head, router, usePage } from "@inertiajs/react";
import { addDays, format } from "date-fns"
import { Calendar } from "@/Components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover"
import {
    SettingsIcon,
    Filter,
    ArrowDownLeft,
    TrendingDown,
    DollarSign,
    Activity as ActivityIcon,
    CreditCard,
    RefreshCw,
    Wallet,
    AlertTriangle,
    ShoppingCart,
    Receipt,
    Target
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from "@/types/transaction";
import { Card } from "@/types/card";
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import ActivityNavbar from '../layout/nav';
import { useActiveCard } from "@/context/ActiveCardContext";
import SyncLoader from "react-spinners/SyncLoader";
import { ErrorBoundary } from "@/Components/ErrorBoundary";

type Props = {
    transactions: Transaction[];
    cards: Card[];
    chartData: {
        monthly: { label: string; expense: number; budget?: number }[];
        yearly: { label: string; expense: number; budget?: number }[];
    };
    expenseByCategory: Record<string, number>;
    totalExpense: number;
    avgMonthlyExpense: number;
    monthlyAveragePerCard: Record<number, number>
    expenseGrowthRate: number;
    expensePerCard: Record<number, number>;
    filter: string;
    chartMode: string;
    auth: {
        user: {
            name: string;
            avatar: string;
        }
    };
    startDate: string | null;
    endDate: string | null;
    activeCardId?: number
    avgMonthlyExpenseGrowthRate: number;
};

interface MetricCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    trend?: "up" | "down";
    color?: "blue" | "red" | "orange";
}

export default function Expense() {
    const {
        transactions,
        cards,
        chartData,
        expenseByCategory,
        totalExpense,
        avgMonthlyExpense,
        monthlyAveragePerCard,
        expenseGrowthRate,
        expensePerCard,
        auth,
        filter: initialFilter,
        chartMode: initialChartMode,
        activeCardId: initialActiveCardId,
        avgMonthlyExpenseGrowthRate
    } = usePage().props as unknown as Props;

    const { activeCardId, setActiveCardId } = useActiveCard();

    const [filter, setFilter] = useState<"all" | "monthly" | "yearly">(initialFilter as "all" | "monthly" | "yearly");
    const [chartMode, setChartMode] = useState<"monthly" | "yearly">(initialChartMode as "monthly" | "yearly");
    const [isLoading, setIsLoading] = useState(false);

    const activeCard = activeCardId != null
        ? cards.find(card => card.id === activeCardId)
        : undefined;

    useEffect(() => {
        if (initialActiveCardId !== undefined && initialActiveCardId !== activeCardId) {
            setActiveCardId(initialActiveCardId);
        }
    }, [initialActiveCardId, activeCardId, setActiveCardId]);

    // Filter transaksi untuk expense saja berdasarkan kartu aktif
    const filteredTransactions = useMemo(() => {
        const expenseTransactions = transactions.filter(t =>
            t.type_label === "Expense"
        );

        if (activeCardId === 0) {
            return expenseTransactions;
        } else {
            return expenseTransactions.filter(t => t.from_cards_id === activeCardId);
        }
    }, [transactions, activeCardId]);

    // Data untuk chart berdasarkan kartu aktif
    const chartDataForActiveCard = useMemo(() => {
        if (activeCardId === 0) {
            return chartData;
        } else {
            return chartData;
        }
    }, [chartData, activeCardId]);

    const mergedChartData = useMemo(() => {
        return chartMode === "monthly"
            ? chartDataForActiveCard.monthly
            : chartDataForActiveCard.yearly;
    }, [chartDataForActiveCard, chartMode]);

    // Hitung total expense berdasarkan kartu aktif
    const safeCardId = activeCardId ?? 0
    const calculatedTotalExpense = useMemo(() => {
        return safeCardId === 0 ? totalExpense : expensePerCard[safeCardId] || 0;
    }, [safeCardId, totalExpense, expensePerCard]);

    const calculatedAvgMonthlyExpense = useMemo(() => {
        if (activeCardId === 0) {
            return avgMonthlyExpense;
        } else {
            return monthlyAveragePerCard[activeCardId ?? 0] || 0;
        }
    }, [avgMonthlyExpense, monthlyAveragePerCard, activeCardId]);

    const calculatedExpenseGrowthRate = useMemo(() => {
        return expenseGrowthRate;
    }, [expenseGrowthRate]);

    // Transform expenseByCategory untuk chart pie
    const categoryChartData = useMemo(() => {
        const colors = ['#EF4444', '#F59E0B', '#F97316', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'];
        return Object.entries(expenseByCategory).map(([category, amount], index) => ({
            name: category,
            value: amount,
            color: colors[index % colors.length]
        }));
    }, [expenseByCategory]);

    const getUserInitials = () => {
        const names = auth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const MetricCard = ({ title, value, change, icon, trend = "up", color = "red" }: MetricCardProps) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                    <div className={`flex items-center text-sm ${trend === 'up' ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {trend === 'up' ? (
                            <ArrowDownLeft className="w-4 h-4 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span>{Math.abs(change)}%</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color === 'red' ? 'bg-red-50' :
                    color === 'orange' ? 'bg-orange-50' : 'bg-blue-50'
                    }`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const formatAutoCurrency = (amount: number, currencyId?: number | string) => {
        // Jika ada currencyId yang explicit, gunakan itu
        if (currencyId) {
            const currency = currencyMap[currencyId];
            return formatCurrency(amount, currency);
        }

        // Jika tidak, gunakan currency dari active card
        if (activeCardId !== 0 && activeCard) {
            const currency = currencyMap[activeCard.currency];
            return formatCurrency(amount, currency);
        }

        // Fallback ke IDR
        return formatCurrency(amount, currencyMap['indonesian_rupiah']);
    };

    const handleChartModeChange = (newMode: "monthly" | "yearly") => {
        if (isLoading) return;

        setIsLoading(true);
        setChartMode(newMode);

        router.get(route('expense.index'), {
            filter,
            chartMode: newMode,
            activeCardId
        }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const refreshData = () => {
        if (isLoading) return;

        setIsLoading(true);
        router.get(route('expense.index'), {
            filter,
            chartMode,
            activeCardId
        }, {
            preserveState: false,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleCardChange = (cardId: number) => {
        if (isLoading) return;

        setActiveCardId(cardId);
        setIsLoading(true);

        router.get(route('expense.index'), {
            filter,
            chartMode,
            activeCardId: cardId
        }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const [date, setDate] = React.useState<{ from: Date | undefined; to?: Date | undefined }>();

    // Calculate budget analysis
    const monthlyBudget = 5000; // This could come from backend
    const budgetUtilization = (calculatedTotalExpense / (monthlyBudget * 12)) * 100;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-100/50 to-gray-200/50 backdrop-blur-sm">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 flex items-center justify-center flex-col">
                    <SyncLoader size={15} color="#DD0303" />
                    <p className="text-gray-600 mt-4 text-center">Loading expense data...</p>
                </div>
            </div>
        );
    }

    if (!transactions || !cards) {
        return <ErrorBoundary>
            <div className="text-center py-8 text-gray-500">
                <p>Something went wrong. Please try again later.</p>
            </div>
        </ErrorBoundary>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Expense" />
            {/* Mobile Layout */}
            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar activeCardId={activeCardId} />

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    {auth.user.avatar ? (
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-red-500 text-white font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center">
                                <h1 className="text-xl font-semibold text-red-600">Expenses</h1>
                                <p className="text-sm text-gray-500">Spending Analysis</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={refreshData}
                                    disabled={isLoading}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <button>
                                    <SettingsIcon className="h-6 w-6 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <hr className="w-full h-0.5 bg-gray-200 mb-6" />

                        <ActivityNavbar />

                        {/* Card Selection for Mobile */}
                        <div className="mb-4">
                            <div className="flex items-center gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <button
                                    onClick={() => handleCardChange(0)}
                                    className={`min-w-max px-4 py-2 rounded-lg transition-colors ${activeCardId === 0
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    All Cards
                                </button>
                                {cards && cards.length > 0 ? (
                                    cards.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => handleCardChange(card.id)}
                                            className={`min-w-max px-4 py-2 rounded-lg transition-colors ${activeCardId === card.id
                                                ? "bg-red-500 text-white"
                                                : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {card.name}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No cards yet</p>
                                )}
                            </div>
                        </div>

                        {/* Mobile Expense Stats */}
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-red-700">Total Expense</p>
                                    <ArrowDownLeft className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-lg font-bold text-red-900">
                                    {formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-red-600">{calculatedExpenseGrowthRate >= 0 ? '+' : ''}{calculatedExpenseGrowthRate.toFixed(1)}%</p>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-orange-700">Avg Monthly</p>
                                    <TrendingDown className="w-4 h-4 text-orange-500" />
                                </div>
                                <p className="text-lg font-bold text-orange-900">
                                    {formatAutoCurrency(calculatedAvgMonthlyExpense, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-orange-600">
                                    {avgMonthlyExpenseGrowthRate >= 0 ? '+' : ''}{avgMonthlyExpenseGrowthRate.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Budget Alert */}
                        {budgetUtilization > 80 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Budget Alert</p>
                                        <p className="text-xs text-yellow-700">
                                            You've used {budgetUtilization.toFixed(1)}% of your annual budget
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expense Categories */}
                        {Object.keys(expenseByCategory).length > 0 && (
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Expense by Category</h3>
                                <div className="space-y-3">
                                    {categoryChartData.map((category, index) => {
                                        const percentage = (category.value / calculatedTotalExpense) * 100;
                                        return (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    ></div>
                                                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatAutoCurrency(category.value, activeCard?.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mobile Chart */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Expense Trend</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('monthly')}
                                        disabled={isLoading}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('yearly')}
                                        disabled={isLoading}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div className="h-48 relative w-full">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                                        <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20">
                                            <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
                                        </div>
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={mergedChartData}>
                                        <defs>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 10 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value: any, name: string) => [
                                                formatAutoCurrency(value, activeCard?.currency),
                                                name === 'expense' ? 'Expense' : 'Budget'
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorExpense)"
                                        />
                                        {mergedChartData[0]?.budget && (
                                            <Area
                                                type="monotone"
                                                dataKey="budget"
                                                stroke="#D1D5DB"
                                                strokeWidth={1}
                                                strokeDasharray="5 5"
                                                fill="none"
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Mobile Expense Transactions */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Recent Expenses</h3>
                                    <p className="text-sm text-gray-500">
                                        Showing {filteredTransactions.length} expense transactions
                                    </p>
                                </div>
                                <button
                                    className="text-red-500 text-sm"
                                    onClick={() => router.visit(route('transactions.index'))}
                                >
                                    View all
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {filteredTransactions.length > 0 ? (
                                    <TransactionsList transactions={filteredTransactions.slice(0, 6)} />
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No expense transactions found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={activeCard ?? undefined}
                    activeCardId={activeCardId ?? undefined}
                    EyesOpen={false}
                    setEyesOpen={() => { }}
                    incomePerCard={{}}
                    expensePerCard={expensePerCard}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-red-600">
                                        Expense Analysis
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        Track and control your spending {activeCardId === 0 ? "across all cards" : `for ${activeCard?.name}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Today</p>
                                        <p className="font-semibold text-gray-900">{currentDate}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={refreshData}
                                            disabled={isLoading}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                        {/* <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Filter className="w-5 h-5 text-gray-600" />
                                        </button> */}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <ActivityNavbar />
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Desktop Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Total Expense"
                                    value={formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                    change={Math.abs(calculatedExpenseGrowthRate)}
                                    trend={calculatedExpenseGrowthRate >= 0 ? "up" : "down"}
                                    color="red"
                                    icon={<ArrowDownLeft className="w-6 h-6 text-red-600" />}
                                />
                                <MetricCard
                                    title="Monthly Average"
                                    value={formatAutoCurrency(calculatedAvgMonthlyExpense, activeCard?.currency)}
                                    change={Math.abs(avgMonthlyExpenseGrowthRate)}
                                    trend={avgMonthlyExpenseGrowthRate >= 0 ? "up" : "down"}
                                    color="orange"
                                    icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
                                />
                                <MetricCard
                                    title="Budget Used"
                                    value={`${budgetUtilization.toFixed(2)}%`}
                                    change={budgetUtilization.toFixed(3) as unknown as number}
                                    trend="up"
                                    color="red"
                                    icon={<Target className="w-6 h-6 text-red-600" />}
                                />
                            </div>

                            {/* Budget Alert Desktop */}
                            {budgetUtilization > 80 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                    <div className="flex items-center gap-4">
                                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-yellow-800">Budget Alert</h3>
                                            <p className="text-yellow-700">
                                                You've used {budgetUtilization.toFixed(1)}% of your annual budget. Consider reviewing your spending patterns.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Desktop Chart */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {activeCardId === 0 ? "Expense Flow Trend" : `Expense Trend for ${activeCard?.name}`}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('monthly')}
                                                    disabled={isLoading}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('yearly')}
                                                    disabled={isLoading}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80 relative w-full">
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                                                    <RefreshCw className="h-8 w-8 text-red-500 animate-spin" />
                                                </div>
                                            )}
                                            <ResponsiveContainer width="100%" height={320}>
                                                <AreaChart data={mergedChartData}>
                                                    <defs>
                                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="label"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value: any, name: string) => [
                                                            formatAutoCurrency(value, activeCard?.currency),
                                                            name === 'expense' ? 'Expense' : 'Budget'
                                                        ]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="expense"
                                                        stroke="#EF4444"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorExpense)"
                                                    />
                                                    {/* {mergedChartData[0]?.budget && (
                                                        <Area
                                                            type="monotone"
                                                            dataKey="budget"
                                                            stroke="#D1D5DB"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            fill="none"
                                                        />
                                                    )} */}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Desktop Expense Transactions */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Expense Transactions</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Showing {filteredTransactions.length} expense transactions
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="text-sm px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                    onClick={() => router.visit(route('transactions.index'))}
                                                >
                                                    View all
                                                </button>
                                                <button
                                                    onClick={() => window.location.href = route("expense.export")}
                                                    className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    Export
                                                </button>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                            {date?.from && date?.to ? (
                                                                <>
                                                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                                </>
                                                            ) : (
                                                                <>Filter</>
                                                            )}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            initialFocus
                                                            mode="range"
                                                            selected={date}
                                                            onSelect={(selected) => {
                                                                setDate(selected);

                                                                if (selected?.from && selected?.to) {
                                                                    setIsLoading(true);

                                                                    router.get(route('expense.index'), {
                                                                        filter,
                                                                        chartMode,
                                                                        start_date: selected.from.toISOString().split('T')[0],
                                                                        end_date: selected.to.toISOString().split('T')[0],
                                                                    }, {
                                                                        preserveState: true,
                                                                        onFinish: () => setIsLoading(false)
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {filteredTransactions.length > 0 ? (
                                                <TransactionsList transactions={filteredTransactions} />
                                            ) : (
                                                <div className="text-center py-12 text-gray-500">
                                                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg font-medium">No expense transactions found</p>
                                                    <p>Try adding new expense transactions or changing the filter.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Sidebar Content */}
                                <div className="space-y-6">
                                    {/* Expense Categories */}
                                    {Object.keys(expenseByCategory).length > 0 && (
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Categories</h3>
                                            <div className="space-y-4">
                                                {categoryChartData.map((category, index) => {
                                                    const percentage = (category.value / calculatedTotalExpense) * 100;
                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-4 h-4 rounded-full"
                                                                    style={{ backgroundColor: category.color }}
                                                                ></div>
                                                                <span className="font-medium text-gray-900">{category.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-semibold text-gray-900">
                                                                    {formatAutoCurrency(category.value, activeCard?.currency)}
                                                                </span>
                                                                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Category Chart */}
                                            <div className="mt-6">
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Distribution</h4>
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height={220}>
                                                        <PieChart>
                                                            <Pie
                                                                data={categoryChartData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={80}
                                                                dataKey="value"
                                                            >
                                                                {categoryChartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value: any) => [
                                                                    formatAutoCurrency(value, activeCard?.currency),
                                                                    'Amount'
                                                                ]}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Expense by Card */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Expense by Card</h3>
                                        <div className="space-y-3">
                                            {cards.length > 0 ? (
                                                cards.map(card => {
                                                    const cardExpense = expensePerCard[card.id] || 0;
                                                    const isActive = activeCardId === card.id;

                                                    return (
                                                        <div
                                                            key={card.id}
                                                            className={`p-3 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
                                                                }`}
                                                            onClick={() => handleCardChange(card.id)}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                                                    <span className="font-medium text-gray-900">{card.name}</span>
                                                                </div>
                                                                <span className="text-sm text-gray-500 font-medium">
                                                                    {formatAutoCurrency(card.balance, card.currency)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <ArrowDownLeft className="h-3 w-3 text-red-500" />
                                                                    <span className="text-red-600">Expense</span>
                                                                </div>
                                                                <span className="font-semibold text-red-600">
                                                                    {formatAutoCurrency(cardExpense, card.currency)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No cards found</p>
                                                    <button
                                                        onClick={() => router.visit(route('cards.create'))}
                                                        className="text-red-500 text-sm hover:underline mt-1"
                                                    >
                                                        Add your first card
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Stats */}
                                        {cards.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="grid grid-cols-1 gap-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Active Cards:</span>
                                                        <span className="font-medium">{cards.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Categories:</span>
                                                        <span className="font-medium">{Object.keys(expenseByCategory).length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expense Summary */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ArrowDownLeft className="w-5 h-5 text-red-600" />
                                                    <span className="font-medium text-red-900">Total Expense</span>
                                                </div>
                                                <span className="font-semibold text-red-900">
                                                    {formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <TrendingDown className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-orange-900">Monthly Average</span>
                                                </div>
                                                <span className="font-semibold text-orange-900">
                                                    {formatAutoCurrency(calculatedAvgMonthlyExpense, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <DollarSign className="w-5 h-5 text-yellow-600" />
                                                    <span className="font-medium text-yellow-900">Growth Rate</span>
                                                </div>
                                                <span className={`font-semibold ${calculatedExpenseGrowthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {calculatedExpenseGrowthRate >= 0 ? '+' : ''}{calculatedExpenseGrowthRate.toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* Performance Indicators */}
                                            <div className="border-t pt-4 mt-4">
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Highest Month</p>
                                                        <p className="font-semibold text-red-600">
                                                            {formatAutoCurrency(Math.max(...mergedChartData.map(d => d.expense || 0)), activeCard?.currency)}
                                                        </p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Transactions</p>
                                                        <p className="font-semibold text-orange-600">{filteredTransactions.length}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
