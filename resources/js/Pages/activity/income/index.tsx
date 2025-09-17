"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import {
    SettingsIcon,
    Calendar,
    Filter,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    Wallet,
    PlusCircle
} from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

export default function Income() {
    const [chartMode, setChartMode] = useState<'monthly' | 'yearly'>('monthly');

    // Static data untuk income saja
    const staticAuth = {
        user: {
            name: "John Doe",
            avatar: null
        }
    };

    const staticCards = [
        { id: 1, name: "Main Card", balance: 15000, income: 8500 },
        { id: 2, name: "Savings", balance: 25000, income: 12000 },
        { id: 3, name: "Business", balance: 8500, income: 14800 }
    ];

    // Income transactions saja
    const staticIncomeTransactions = [
        {
            id: 1,
            description: "Monthly Salary",
            amount: 5000,
            date: "2024-03-15",
            category: "Work",
            source: "Company ABC"
        },
        {
            id: 2,
            description: "Freelance Project",
            amount: 1200,
            date: "2024-03-14",
            category: "Freelance",
            source: "Client XYZ"
        },
        {
            id: 3,
            description: "Investment Returns",
            amount: 800,
            date: "2024-03-13",
            category: "Investment",
            source: "Stock Portfolio"
        },
        {
            id: 4,
            description: "Side Hustle",
            amount: 350,
            date: "2024-03-12",
            category: "Business",
            source: "Online Store"
        },
        {
            id: 5,
            description: "Bonus Payment",
            amount: 1500,
            date: "2024-03-11",
            category: "Work",
            source: "Company ABC"
        },
        {
            id: 6,
            description: "Rental Income",
            amount: 900,
            date: "2024-03-10",
            category: "Property",
            source: "Apartment Unit"
        }
    ];

    // Income chart data
    const staticIncomeChartData = [
        { label: "Jan", income: 4500, target: 5000 },
        { label: "Feb", income: 5200, target: 5000 },
        { label: "Mar", income: 6800, target: 5000 },
        { label: "Apr", income: 5500, target: 5000 },
        { label: "May", income: 7200, target: 5000 },
        { label: "Jun", income: 6100, target: 5000 }
    ];

    // Income categories breakdown
    const incomeByCategory = [
        { category: "Work", amount: 6500, percentage: 65, color: "#10B981" },
        { category: "Freelance", amount: 1200, percentage: 12, color: "#3B82F6" },
        { category: "Investment", amount: 800, percentage: 8, color: "#8B5CF6" },
        { category: "Business", amount: 850, percentage: 8.5, color: "#F59E0B" },
        { category: "Property", amount: 650, percentage: 6.5, color: "#EF4444" }
    ];

    const totalIncome = 35300;
    const monthlyGrowth = 15.2;
    const avgMonthlyIncome = 5883;

    const getUserInitials = () => {
        const names = staticAuth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const MetricCard = ({ title, value, change, icon, color = "green" }) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                    <div className="flex items-center text-sm text-green-600">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>+{change}%</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${color === 'green' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const ActivityNavbar = () => (
        <div className="flex items-center justify-center gap-7 text-lg font-medium mb-6">
            <button className="pb-2 border-b-2 text-gray-500 border-transparent hover:text-gray-700">
                All
            </button>
            <button className="pb-2 border-b-2 text-blue-500 border-blue-500">
                Income
            </button>
            <button className="pb-2 border-b-2 text-gray-500 border-transparent hover:text-gray-700">
                Expense
            </button>
        </div>
    );

    const IncomeTransactionsList = ({ transactions }) => (
        <div className="space-y-3">
            {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.category} • {transaction.source}</p>
                            <p className="text-xs text-gray-400">{transaction.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-green-600">
                            +{formatCurrency(transaction.amount)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

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
                                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center">
                                <h1 className="text-xl font-semibold text-green-600">Income</h1>
                                <p className="text-sm text-gray-500">Revenue Analysis</p>
                            </div>

                            <button>
                                <SettingsIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        <hr className="w-full h-0.5 bg-gray-200 mb-6" />

                        {/* Activity Navigation */}
                        <ActivityNavbar />

                        {/* Mobile Income Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-green-700">Total Income</p>
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-green-900">
                                    {formatCurrency(totalIncome)}
                                </p>
                                <p className="text-xs text-green-600">+{monthlyGrowth}%</p>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-blue-700">Avg Monthly</p>
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-lg font-bold text-blue-900">
                                    {formatCurrency(avgMonthlyIncome)}
                                </p>
                                <p className="text-xs text-blue-600">+8.5%</p>
                            </div>
                        </div>

                        {/* Income Categories */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Income by Category</h3>
                            <div className="space-y-3">
                                {incomeByCategory.map((category, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            ></div>
                                            <span className="text-sm font-medium text-gray-700">{category.category}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.amount)}</p>
                                            <p className="text-xs text-gray-500">{category.percentage}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Chart */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Income Trend</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                            chartMode === 'monthly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}
                                        onClick={() => setChartMode('monthly')}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                            chartMode === 'yearly' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}
                                        onClick={() => setChartMode('yearly')}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={staticIncomeChartData}>
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
                                            dataKey="target"
                                            stroke="#D1D5DB"
                                            strokeWidth={1}
                                            strokeDasharray="5 5"
                                            fill="none"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Mobile Income Transactions */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Recent Income</h3>
                                <button className="text-green-500 text-sm">View all</button>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <IncomeTransactionsList transactions={staticIncomeTransactions.slice(0, 4)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                {/* Static Sidebar */}
                <div className="w-80 bg-white shadow-sm border-r border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-green-500 text-white font-semibold">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold text-gray-900">{staticAuth.user.name}</h2>
                                <p className="text-sm text-green-600">Income Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Income Summary</h3>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                <p className="text-sm text-green-600">This Month</p>
                                <p className="text-2xl font-bold text-green-900">{formatCurrency(6850)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <p className="text-sm text-blue-600">Next Target</p>
                                <p className="text-2xl font-bold text-blue-900">{formatCurrency(7500)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-green-600">
                                        Income Analysis
                                    </h1>
                                    <p className="text-gray-500 mt-1">Track and analyze your income sources</p>
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
                                    value={formatCurrency(totalIncome)}
                                    change={monthlyGrowth}
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Average Monthly"
                                    value={formatCurrency(avgMonthlyIncome)}
                                    change={8.5}
                                    color="blue"
                                    icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                                />
                                <MetricCard
                                    title="Best Month"
                                    value={formatCurrency(7200)}
                                    change={22.3}
                                    color="green"
                                    icon={<DollarSign className="w-6 h-6 text-green-600" />}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Desktop Chart */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Income Flow Trend</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                                        chartMode === 'monthly' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                    onClick={() => setChartMode('monthly')}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                                        chartMode === 'yearly' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                    onClick={() => setChartMode('yearly')}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={staticIncomeChartData}>
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
                                                        dataKey="target"
                                                        stroke="#D1D5DB"
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        fill="none"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Desktop Income Transactions */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Income Transactions</h3>
                                            <div className="flex items-center gap-3">
                                                <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                                    Add Income
                                                </button>
                                                <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    Filter
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            <IncomeTransactionsList transactions={staticIncomeTransactions} />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Sidebar Content */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Income Categories</h3>
                                        <div className="space-y-4">
                                            {incomeByCategory.map((category, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-4 h-4 rounded-full"
                                                            style={{ backgroundColor: category.color }}
                                                        ></div>
                                                        <span className="font-medium text-gray-900">{category.category}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-semibold text-gray-900">
                                                            {formatCurrency(category.amount)}
                                                        </span>
                                                        <p className="text-xs text-gray-500">{category.percentage}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Income by Card</h3>
                                        <div className="space-y-3">
                                            {staticCards.map(card => (
                                                <div key={card.id} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-green-900">{card.name}</span>
                                                        <Wallet className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Income</span>
                                                        <span className="font-semibold text-green-600">
                                                            +{formatCurrency(card.income)}
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
