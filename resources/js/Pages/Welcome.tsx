import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Activity, User, Menu, X, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Head } from '@inertiajs/react';

export default function FinanceLandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeCurrency, setActiveCurrency] = useState('IDR');

    const features = [
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Income Tracking",
            description: "Record all your income easily and in flexible categories."
        },
        {
            icon: <TrendingDown className="w-6 h-6" />,
            title: "Expense Management",
            description: "Manage your daily expenses and stay within budget"
        },
        {
            icon: <ArrowRightLeft className="w-6 h-6" />,
            title: "Multi-Currency",
            description: "Support IDR, THB, and USD with real-time conversion"
        },
        {
            icon: <Activity className="w-6 h-6" />,
            title: "Activity Analytics",
            description: "Interactive charts for annual and monthly financial monitoring"
        },
        {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Card Management",
            description: "Add and manage your multiple payment cards"
        },
        {
            icon: <User className="w-6 h-6" />,
            title: "Profile Customization",
            description: "Personalize your financial profile and preferences"
        }
    ];

    const currencies = [
        { code: 'IDR', symbol: 'Rp', name: 'Rupiah' },
        { code: 'THB', symbol: '฿', name: 'Baht' },
        { code: 'USD', symbol: '$', name: 'Dollar' }
    ];

    const chartData = [
        { month: 'Jan', income: 24000, expense: 15000 },
        { month: 'Feb', income: 28000, expense: 18000 },
        { month: 'Mar', income: 22000, expense: 14000 },
        { month: 'Apr', income: 32000, expense: 19000 },
        { month: 'May', income: 30000, expense: 20000 },
        { month: 'Jun', income: 35000, expense: 22000 },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Finance Manager"/>
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                FinanceManager
                            </span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</a>
                            <a href="#activity" className="text-gray-600 hover:text-blue-600 transition">Activity</a>
                            <a href="/login" className="text-gray-600 hover:text-blue-600 transition">Login</a>
                            <a href="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Register
                            </a>
                        </div>

                        <button
                            className="md:hidden text-gray-900"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 space-y-4">
                            <a href="#features" className="block text-gray-600 hover:text-blue-600 transition">Features</a>
                            <a href="#activity" className="block text-gray-600 hover:text-blue-600 transition">Activity</a>
                            <a href="/login" className="block text-gray-600 hover:text-blue-600 transition">Login</a>
                            <a href="/register" className="block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-center">
                                Register
                            </a>
                        </div>
                    )}
                </div>
            </nav>

            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                                Manage Financess
                                <span className="text-blue-600">
                                    {' '}Smarter
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600">
                                An all-in-one financial management platform with multi-currency, in-depth analytics, and real-time insights to optimize your finances.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition text-center">
                                    Get Started
                                </a>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
                                <div className="space-y-6">
                                    <div className="flex gap-2">
                                        {currencies.map((currency) => (
                                            <button
                                                key={currency.code}
                                                onClick={() => setActiveCurrency(currency.code)}
                                                className={`flex-1 px-4 py-2 rounded-lg transition font-medium ${activeCurrency === currency.code
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {currency.code}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                        <p className="text-sm text-gray-600 mb-2">Total Balance</p>
                                        <p className="text-4xl font-bold text-gray-900">
                                            {currencies.find(c => c.code === activeCurrency)?.symbol}
                                            {activeCurrency === 'IDR' ? '15,450,000' : activeCurrency === 'THB' ? '36,500' : '1,025'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-gray-600">Income</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-600">+23%</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingDown className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-gray-600">Expense</span>
                                            </div>
                                            <p className="text-2xl font-bold text-red-600">-12%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                            Complete Features for
                            <span className="text-blue-600">
                                {' '}your needs
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need to manage your finances in one platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition"
                            >
                                <div className="bg-blue-100 text-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="activity" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                            Activity &
                            <span className="text-blue-600">
                                {' '}Analytics
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            Visualize financial data with interactive charts
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Monthly Overview</h3>
                                <p className="text-gray-600 mt-1">Income vs Expense 2024</p>
                            </div>

                            {/* Area Chart */}
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorExpense)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Activity Details */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">Total Income</h4>
                                        <p className="text-2xl font-bold text-green-600">Rp 25,340,000</p>
                                    </div>
                                    <ChevronRight className="text-gray-400" />
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Salary</span>
                                        <span className="text-gray-900 font-medium">Rp 20,000,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Freelance</span>
                                        <span className="text-gray-900 font-medium">Rp 4,500,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Investment</span>
                                        <span className="text-gray-900 font-medium">Rp 840,000</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-red-100 p-3 rounded-lg">
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">Total Expense</h4>
                                        <p className="text-2xl font-bold text-red-600">Rp 12,680,000</p>
                                    </div>
                                    <ChevronRight className="text-gray-400" />
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Food & Dining</span>
                                        <span className="text-gray-900 font-medium">Rp 3,200,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Transportation</span>
                                        <span className="text-gray-900 font-medium">Rp 1,800,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shopping</span>
                                        <span className="text-gray-900 font-medium">Rp 4,500,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bills</span>
                                        <span className="text-gray-900 font-medium">Rp 3,180,000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cards Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                            Manage Your
                            <span className="text-blue-600">
                                {' '}Cards
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            Add and manage your payment cards 
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="relative group">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 h-48 flex flex-col justify-between text-white shadow-xl hover:shadow-2xl transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm opacity-80">Balance</p>
                                        <p className="text-2xl font-bold mt-1">Rp 8,450,000</p>
                                    </div>
                                    <CreditCard className="w-8 h-8 opacity-80" />
                                </div>
                                <div>
                                    <p className="text-sm opacity-80 mb-1">Card Number</p>
                                    <p className="font-mono">•••• •••• •••• 4532</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="relative group">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 h-48 flex flex-col justify-between text-white shadow-xl hover:shadow-2xl transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm opacity-80">Balance</p>
                                        <p className="text-2xl font-bold mt-1">฿ 12,580</p>
                                    </div>
                                    <CreditCard className="w-8 h-8 opacity-80" />
                                </div>
                                <div>
                                    <p className="text-sm opacity-80 mb-1">Card Number</p>
                                    <p className="font-mono">•••• •••• •••• 8821</p>
                                </div>
                            </div>
                        </div>

                        {/* Add New Card */}
                        <div className="bg-gray-50 rounded-2xl p-6 h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer group">
                            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 transition">
                                <CreditCard className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                            </div>
                            <p className="font-semibold text-gray-900">Add New Card</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-indigo-700">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Start Managing Your Finances Today
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join to manage your finances with FinanceManager
                    </p>
                    <a href="/register" className="inline-block bg-white text-blue-600 px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
                        Start 
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-blue-600 p-2 rounded-lg">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">FinanceManager</span>
                            </div>
                            <p className="text-gray-600">
                                A modern financial management platform for a more organized life.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-gray-900">Social Media</h4>
                            <ul className="space-y-2 text-gray-600">
                                <li><a href="https://instagram.com/bintang.ydha_" className="hover:text-blue-600 transition">Instagram</a></li>
                                <li><a href="https://www.linkedin.com/in/bintang-yudha-putra-purnomo-120117324/?locale=in_ID" className="hover:text-blue-600 transition">Linkedin</a></li>
                                {/* <li><a href="#" className="hover:text-blue-600 transition">Privacy</a></li> */}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
                        <p>&copy; 2024 FinanceFlow. All rights reserved. - Bintang Yudha</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}