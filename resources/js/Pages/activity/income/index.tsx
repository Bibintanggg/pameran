"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import TransactionsList from "@/Components/TransactionsList";
import Sidebar from "@/Components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router, usePage } from "@inertiajs/react";
import { addDays, format } from "date-fns"
import { Calendar } from "@/Components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover"
import {
    SettingsIcon,
    Filter,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    Activity as ActivityIcon,
    ChevronRight,
    CreditCard,
    RefreshCw,
    Wallet,
    PlusCircle
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from "@/types/transaction";
import { Card } from "@/types/card";
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import ActivityNavbar from "../layout/nav";
import { useActiveCard } from "@/context/ActiveCardContext";

type Props = {
    transactions: Transaction[];
    cards: Card[];
    chartData: {
        monthly: { label: string; income: number; target: number }[];
        yearly: { label: string; income: number; target: number }[];
    };
    incomeByCategory: Record<string, number>;
    incomeByCategoryPerCard: Record<number, Record<string, number>>;
    totalIncome: number;
    avgMonthlyIncome: number;
    growthRate: number;
    incomePerCard: Record<number, number>;
    filter: string;
    chartMode: string;
    auth: {
        user: {
            name: string;
            avatar: string | null;
        }
    };
    startDate: string | null;
    endDate: string | null;
};

interface MetricCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    trend?: "up" | "down";
    color?: "blue" | "green" | "orange";
}

export default function Income() {
    const {
        transactions,
        cards,
        chartData,
        incomeByCategory,
        incomeByCategoryPerCard,
        totalIncome,
        avgMonthlyIncome,
        growthRate,
        incomePerCard,
        auth,
        filter: initialFilter,
        chartMode: initialChartMode
    } = usePage().props as unknown as Props;

    const { activeCardId, setActiveCardId } = useActiveCard();

    const [filter, setFilter] = useState<"all" | "monthly" | "yearly">(initialFilter as "all" | "monthly" | "yearly");
    const [chartMode, setChartMode] = useState<"monthly" | "yearly">(initialChartMode as "monthly" | "yearly");
    const [isLoading, setIsLoading] = useState(false);

    const activeCard = cards.find((card) => card.id === activeCardId);

    // Filter transaksi untuk income saja berdasarkan kartu aktif
    const filteredTransactions = useMemo(() => {
        const incomeTransactions = transactions.filter(t =>
            t.type_label === "Income" || t.type_label === "Convert"
        );

        if (activeCardId === 0) {
            return incomeTransactions;
        } else {
            return incomeTransactions.filter(t => t.to_cards_id === activeCardId);
        }
    }, [transactions, activeCardId]);

    // Data untuk chart berdasarkan kartu aktif
    const chartDataForActiveCard = useMemo(() => {
        if (activeCardId === 0) {
            return chartData;
        } else {
            // Untuk kartu spesifik, kita perlu memfilter data
            // Karena controller sudah menyediakan data per card, kita gunakan data yang ada
            return chartData;
        }
    }, [chartData, activeCardId]);

    const mergedChartData = useMemo(() => {
        return chartMode === "monthly"
            ? chartDataForActiveCard.monthly
            : chartDataForActiveCard.yearly;
    }, [chartDataForActiveCard, chartMode]);

    // Hitung total income berdasarkan kartu aktif
    const calculatedTotalIncome = useMemo(() => {
        if (activeCardId === 0) return totalIncome;
        return incomePerCard[activeCardId] || 0;
    }, [activeCardId, totalIncome, incomePerCard]);

    const activeCardIncomeByCategory = useMemo(() => {
        if (activeCardId === 0) {
            return incomeByCategory; // Untuk "All Cards", gunakan yang universal
        } else {
            return incomeByCategoryPerCard[activeCardId] || {};
        }
    }, [activeCardId, incomeByCategory, incomeByCategoryPerCard]);

    // Transform incomeByCategory untuk chart pie
    const categoryChartData = useMemo(() => {
        const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
        return Object.entries(activeCardIncomeByCategory).map(([category, amount], index) => ({
            name: category,
            value: amount,
            color: colors[index % colors.length]
        }));
    }, [activeCardIncomeByCategory]);

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

    const MetricCard = ({ title, value, change, icon, trend = "up", color = "green" }: MetricCardProps) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                    <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-500'
                        }`}>
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                            <TrendingUp className="w-4 h-4 mr-1" />
                        )}
                        <span>{Math.abs(change)}%</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color === 'green' ? 'bg-green-50' :
                        color === 'blue' ? 'bg-blue-50' : 'bg-orange-50'
                    }`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const formatAutoCurrency = (amount: number, currencyId?: number) => {
        const currency = currencyMap[currencyId ?? (activeCard?.currency || 'indonesian_rupiah')];
        return formatCurrency(amount, currency);
    };

    const handleChartModeChange = (newMode: "monthly" | "yearly") => {
        if (isLoading) return;

        setIsLoading(true);
        setChartMode(newMode);

        router.get(route('income.activity'), {
            filter,
            chartMode: newMode,
            activeCardId
        }, {
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const refreshData = () => {
        if (isLoading) return;

        setIsLoading(true);
        router.get(route('income.activity'), {
            filter,
            chartMode,
            activeCardId
        }, {
            preserveState: false,
            onFinish: () => setIsLoading(false)
        });
    };

    const [date, setDate] = React.useState<{ from: Date | undefined; to?: Date | undefined }>();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Layout */}
            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar />

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    {auth.user.avatar ? (
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-green-500 text-white font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center">
                                <h1 className="text-xl font-semibold text-green-600">Income</h1>
                                <p className="text-sm text-gray-500">Revenue Analysis</p>
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
                                    onClick={() => setActiveCardId(0)}
                                    className={`min-w-max px-4 py-2 rounded-lg transition-colors ${activeCardId === 0
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    All Cards
                                </button>
                                {cards && cards.length > 0 ? (
                                    cards.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => setActiveCardId(card.id)}
                                            className={`min-w-max px-4 py-2 rounded-lg transition-colors ${activeCardId === card.id
                                                    ? "bg-green-500 text-white"
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

                        {/* Mobile Income Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-green-700">Total Income</p>
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-green-900">
                                    {formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-green-600">+{growthRate.toFixed(1)}%</p>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-blue-700">Avg Monthly</p>
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-lg font-bold text-blue-900">
                                    {formatAutoCurrency(avgMonthlyIncome, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-blue-600">+8.5%</p>
                            </div>
                        </div>

                        {/* Income Categories */}
                        {Object.keys(activeCardIncomeByCategory).length > 0 && (
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Income by Category</h3>
                                <div className="space-y-3">
                                    {categoryChartData.map((category, index) => {
                                        const percentage = (category.value / calculatedTotalIncome) * 100;
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
                                <h3 className="text-lg font-semibold">Income Trend</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('monthly')}
                                        disabled={isLoading}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('yearly')}
                                        disabled={isLoading}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div className="h-48 relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                                        <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mergedChartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                                                name === 'income' ? 'Income' : 'Target'
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorIncome)"
                                        />
                                        {/* <Area
                                            type="monotone"
                                            dataKey="target"
                                            stroke="#D1D5DB"
                                            strokeWidth={1}
                                            strokeDasharray="5 5"
                                            fill="none"
                                        /> */}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Mobile Income Transactions */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Recent Income</h3>
                                    <p className="text-sm text-gray-500">
                                        Showing {filteredTransactions.length} income transactions
                                    </p>
                                </div>
                                <button
                                    className="text-green-500 text-sm"
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
                                        <p>No income transactions found.</p>
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
                    activeCard={activeCard}
                    activeCardId={activeCardId}
                    EyesOpen={false}
                    setEyesOpen={() => { }}
                    incomePerCard={incomePerCard}
                    expensePerCard={{}}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-green-600">
                                        Income Analysis
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        Track and analyze your income sources {activeCardId === 0 ? "across all cards" : `for ${activeCard?.name}`}
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
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Filter className="w-5 h-5 text-gray-600" />
                                        </button>
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
                                    title="Total Income"
                                    value={formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                    change={growthRate}
                                    trend="up"
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Average Monthly"
                                    value={formatAutoCurrency(avgMonthlyIncome, activeCard?.currency)}
                                    change={8.5}
                                    trend="up"
                                    color="blue"
                                    icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                                />
                                <MetricCard
                                    title="Growth Rate"
                                    value={`${growthRate.toFixed(1)}%`}
                                    change={Math.abs(growthRate)}
                                    trend={growthRate >= 0 ? "up" : "down"}
                                    color="green"
                                    icon={<DollarSign className="w-6 h-6 text-green-600" />}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Desktop Chart */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {activeCardId === 0 ? "Income Flow Trend" : `Income Trend for ${activeCard?.name}`}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('monthly')}
                                                    disabled={isLoading}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('yearly')}
                                                    disabled={isLoading}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80 relative">
                                            {isLoading && (
                                                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                                                    <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
                                                </div>
                                            )}
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mergedChartData}>
                                                    <defs>
                                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
                                                            name === 'income' ? 'Income' : ''
                                                        ]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="income"
                                                        stroke="#10B981"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorIncome)"
                                                    />
                                                    {/* <Area
                                                        type="monotone"
                                                        dataKey="target"
                                                        stroke="#D1D5DB"
                                                        color="black"
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        fill="none"
                                                    /> */}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Desktop Income Transactions */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Income Transactions</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Showing {filteredTransactions.length} income transactions
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
                                                    onClick={() => window.location.href = route("activity-income.export")}
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

                                                                    router.get(route('income.activity'), {
                                                                        filter,
                                                                        chartMode,
                                                                        activeCardId,
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
                                                    <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg font-medium">No income transactions found</p>
                                                    <p>Try adding new income transactions or changing the filter.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Sidebar Content */}
                                <div className="space-y-6">
                                    {/* Income Categories */}
                                    {Object.keys(activeCardIncomeByCategory).length > 0 && (
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Income Categories</h3>
                                            <div className="space-y-4">
                                                {categoryChartData.map((category, index) => {
                                                    const percentage = (category.value / calculatedTotalIncome) * 100;
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
                                                <div className="h-48">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={categoryChartData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={80}
                                                                dataKey="value"
                                                                nameKey="name"
                                                            >
                                                                {categoryChartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value: number, name: string, props: any) => {
                                                                    const categoryName = props.payload.name; // Ambil nama kategori
                                                                    const percentage = calculatedTotalIncome > 0
                                                                        ? ((value / calculatedTotalIncome) * 100).toFixed(1)
                                                                        : '0';

                                                                    return [
                                                                        <div key="tooltip-content">
                                                                            <div className="font-semibold">{categoryName}</div>
                                                                            <div>{formatAutoCurrency(value, activeCard?.currency)}</div>
                                                                            {/* <div className="text-xs text-gray-500">{percentage}% of total</div> */}
                                                                        </div>,
                                                                        
                                                                    ];
                                                                }}
                                                                contentStyle={{
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '8px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Income by Card */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Income by Card</h3>
                                        <div className="space-y-3">
                                            {cards.length > 0 ? (
                                                cards.map(card => {
                                                    const cardIncome = incomePerCard[card.id] || 0;
                                                    const isActive = activeCardId === card.id;

                                                    return (
                                                        <div
                                                            key={card.id}
                                                            className={`p-3 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                                                                }`}
                                                            onClick={() => setActiveCardId(card.id)}
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
                                                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                                                    <span className="text-green-600">Income</span>
                                                                </div>
                                                                <span className="font-semibold text-green-600">
                                                                    {formatAutoCurrency(cardIncome, card.currency)}
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
                                                        className="text-green-500 text-sm hover:underline mt-1"
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
                                                        <span className="text-gray-500">Income Sources:</span>
                                                        <span className="font-medium">{Object.keys(activeCardIncomeByCategory).length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Income Summary */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                                                    <span className="font-medium text-green-900">Total Income</span>
                                                </div>
                                                <span className="font-semibold text-green-900">
                                                    {formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium text-blue-900">Monthly Average</span>
                                                </div>
                                                <span className="font-semibold text-blue-900">
                                                    {formatAutoCurrency(avgMonthlyIncome, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <DollarSign className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-orange-900">Growth Rate</span>
                                                </div>
                                                <span className={`font-semibold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* Performance Indicators */}
                                            <div className="border-t pt-4 mt-4">
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Best Month</p>
                                                        <p className="font-semibold text-green-600">
                                                            {formatAutoCurrency(Math.max(...mergedChartData.map(d => d.income)), activeCard?.currency)}
                                                        </p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Transactions</p>
                                                        <p className="font-semibold text-blue-600">{filteredTransactions.length}</p>
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
