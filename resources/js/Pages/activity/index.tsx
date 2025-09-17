"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import TransactionsList from "@/Components/TransactionsList";
import Sidebar from "@/Components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router, usePage } from "@inertiajs/react";
import {
    SettingsIcon,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Activity as ActivityIcon,
    TrendingUp,
    ChevronRight,
    CreditCard
} from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Transaction } from "@/types/transaction";
import { Card } from "@/types/card";
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import ActivityNavbar from "./layout/nav";

type Props = {
    transactions: Transaction[];
    cards: Card[];
    chartData: {
        monthly: Record<string, { label: string; income: number; expense: number }[]>;
        yearly: Record<string, { label: string; income: number; expense: number }[]>;
    };
    totalIncome: number;
    totalExpense: number;
    ratesPerCard: Record<string, { income_rate: number; expense_rate: number }>;
    incomeRate: number;
    expenseRate: number;
    filter: string;
    chartMode: string;
    auth: {
        user: {
            name: string;
            avatar: string | null;
        }
    };
    incomePerCard: Record<number, number>;
    expensePerCard: Record<number, number>;
};

interface MetricCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    trend?: "up" | "down";
    color?: "blue" | "green" | "orange";
}

export default function AllActivity() {
    const {
        transactions,
        cards,
        chartData,
        totalIncome,
        totalExpense,
        ratesPerCard,
        incomeRate,
        expenseRate,
        auth,
        filter: initialFilter,
        chartMode: initialChartMode,
        incomePerCard,
        expensePerCard
    } = usePage().props as unknown as Props;

    const [filter, setFilter] = useState<"all" | "income" | "expense">(initialFilter as "all" | "income" | "expense");
    const [chartMode, setChartMode] = useState<"monthly" | "yearly">(initialChartMode as "monthly" | "yearly");

    const filteredTransactions = transactions.filter((t) => {
        if (filter === "all") return true;
        if (filter === "income") return t.type_label === "Income";
        if (filter === "expense") return t.type_label === "Expense";
        return true;
    });

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

    const MetricCard = ({ title, value, change, icon, trend = "up", color = "blue" }: MetricCardProps) => (
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
                            <ArrowDownLeft className="w-4 h-4 mr-1" />
                        )}
                        <span>{change}%</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color === 'blue' ? 'bg-blue-50' :
                    color === 'green' ? 'bg-green-50' : 'bg-orange-50'
                    }`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const mergedChartData = Object.values(chartData[chartMode]).flat();

    const formatAutoCurrency = (amount: number, currencyId?: number) => {
        const currency = currencyMap[currencyId ?? 1];
        return formatCurrency(amount, currency);
    };

    const incomePerCardSafe = incomePerCard ?? {};

    const handleFilterChange = (newFilter: "all" | "income" | "expense") => {
        setFilter(newFilter);
        router.get(route('all-activity'), { 
            filter: newFilter,
            chartMode 
        }, { preserveState: true });
    };

    const handleChartModeChange = (newMode: "monthly" | "yearly") => {
        setChartMode(newMode);
        router.get(route('all-activity'), { 
            filter,
            chartMode: newMode 
        }, { preserveState: true });
    };

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
                                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center">
                                <h1 className="text-xl font-semibold">Activity</h1>
                                <p className="text-sm text-gray-500">Statistics</p>
                            </div>

                            <button>
                                <SettingsIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        <hr className="w-full h-0.5 bg-gray-200 mb-6" />

                        {/* Activity Navigation */}
                        <ActivityNavbar />

                        {/* Mobile Statistics Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-600">Total Income</p>
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatAutoCurrency(totalIncome)}
                                </p>
                                <p className="text-xs text-green-600">+{incomeRate}%</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-600">Total Expense</p>
                                    <ArrowDownLeft className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatAutoCurrency(totalExpense)}
                                </p>
                                <p className="text-xs text-red-600">+{expenseRate}%</p>
                            </div>
                        </div>

                        {/* Mobile Chart */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Overview</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${chartMode === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('monthly')}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${chartMode === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('yearly')}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mergedChartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorIncome)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#F59E0B"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorExpense)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Mobile Transactions */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">All Transactions</h3>
                                <button className="text-blue-500 text-sm">View all</button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <TransactionsList transactions={filteredTransactions} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={cards[0]}
                    activeCardId={cards[0]?.id || 0}
                    EyesOpen={false}
                    setEyesOpen={() => { }}
                    incomePerCard={incomePerCard}
                    expensePerCard={expensePerCard}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Activity Overview
                                    </h1>
                                    <p className="text-gray-500 mt-1">Complete financial statistics across all cards</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Today</p>
                                        <p className="font-semibold text-gray-900">{currentDate}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Calendar className="w-5 h-5 text-gray-600" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Filter className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Activity Navigation */}
                            <div className="mt-6">
                                <ActivityNavbar />
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Desktop Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Total Income"
                                    value={formatAutoCurrency(totalIncome)}
                                    change={incomeRate}
                                    trend="up"
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Total Expense"
                                    value={formatAutoCurrency(totalExpense)}
                                    change={expenseRate}
                                    trend="up"
                                    color="orange"
                                    icon={<ArrowDownLeft className="w-6 h-6 text-orange-600" />}
                                />
                                <MetricCard
                                    title="Net Balance"
                                    value={formatAutoCurrency(totalIncome - totalExpense)}
                                    change={Math.abs(incomeRate - expenseRate)}
                                    trend={totalIncome - totalExpense >= 0 ? "up" : "down"}
                                    color="blue"
                                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Desktop Chart */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Complete Money Flow</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${chartMode === 'monthly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('monthly')}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${chartMode === 'yearly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('yearly')}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mergedChartData}>
                                                    <defs>
                                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="income"
                                                        stroke="#10B981"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorIncome)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="expense"
                                                        stroke="#F59E0B"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorExpense)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Desktop Transactions */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">All Transactions</h3>
                                            <div className="flex items-center gap-3">
                                                <button className="text-sm px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                    View all
                                                </button>
                                                <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    Filter
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            <TransactionsList transactions={filteredTransactions} />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Sidebar Content */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                                                    <span className="font-medium text-green-900">Total Income</span>
                                                </div>
                                                <span className="font-semibold text-green-900">
                                                    {formatAutoCurrency(totalIncome)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ArrowDownLeft className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-orange-900">Total Expense</span>
                                                </div>
                                                <span className="font-semibold text-orange-900">
                                                    {formatAutoCurrency(totalExpense)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium text-blue-900">Net Balance</span>
                                                </div>
                                                <span className="font-semibold text-blue-900">
                                                    {formatAutoCurrency(totalIncome - totalExpense)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cards Overview</h3>
                                        <div className="space-y-3">
                                            {cards.map(card => (
                                                <div key={card.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-900">{card.name}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatAutoCurrency(card.balance)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-green-600">
                                                            +{formatAutoCurrency(incomePerCard[card.id] || 0)}
                                                        </span>
                                                        <span className="text-orange-600">
                                                            -{formatAutoCurrency(expensePerCard[card.id] || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
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