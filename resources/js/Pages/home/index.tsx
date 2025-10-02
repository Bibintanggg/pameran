import AddCards from "@/Components/AddCards"
import AddConvert from "@/Components/AddConvert"
import AddExpense from "@/Components/AddExpense"
import AddIncome from "@/Components/AddIncome"
import BottomNavbar from "@/Components/BottomNavbar"
import CardBalance from "@/Components/CardBalance"
import CardIndex from "@/Components/CardIndex"
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { PageProps } from "@/types"
import { router, usePage } from "@inertiajs/react"
import {
    EyeClosedIcon,
    EyeIcon,
    SettingsIcon,
    LogInIcon,
    ChevronRight,
    Menu,
    CreditCard,
    TrendingUp,
    User,
    Wallet,
    DollarSign,
    Activity,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter,
    TrendingDown
} from "lucide-react"
import { useState, useMemo, ReactNode } from "react"
import { Transaction } from "@/types/transaction"
import { currencyMap, formatCurrency } from "@/utils/formatCurrency"
import TransactionsList from "@/Components/TransactionsList"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import Sidebar from "@/Components/Sidebar"
import { useActiveCard } from "@/context/ActiveCardContext" // Import context

type MonthlyData = { month: string; income: number; expense: number };
type YearlyData = { year: number; income: number; expense: number };

type QuickActionCardProps = {
    children: ReactNode
    gradient?: boolean;
    className?: string;
}

type MetricCardProps = {
    title: string;
    value: string | number;
    change: number;
    icon: ReactNode;
    trend?: "up" | "down";
    color?: "blue" | "green" | "orange";
};


export default function Home() {
    const {
        auth,
        cards,
        transactions,
        totalIncome,
        totalExpense,
        incomeRateHigh,
        incomeRateLow,
        expenseRateHigh,
        expenseRateLow,
    } = usePage().props as unknown as {
        auth: any;
        cards: {
            id: number;
            name: string;
            balance: number;
            currency: string
        }[];
        transactions: Transaction[];
        totalIncome: number;
        totalExpense: number;
        incomeRateHigh: number;
        incomeRateLow: number;
        expenseRateHigh: number;
        expenseRateLow: number;
    };

    const { incomePerCard, expensePerCard, ratesPerCard } = usePage().props as any;

    const { chartData: chartDataFromProps = { monthly: {}, yearly: {} } } = (usePage().props as unknown) as {
        chartData: {
            monthly: Record<number, MonthlyData[]>;
            yearly: Record<number, YearlyData[]>;
        };
    };

    const [EyesOpen, setEyesOpen] = useState(false)

    // context instead of local state
    const { activeCardId, setActiveCardId } = useActiveCard();

    const activeCard = cards.find((card) => card.id === activeCardId)
    const balance = activeCard ? activeCard.balance : 0;
    const activeRates =
        activeCardId !== null
            ? ratesPerCard?.[activeCardId] ?? { income_rate: 0, expense_rate: 0 }
            : { income_rate: 0, expense_rate: 0 };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t: any) => {
            if (t.type === 'income' || t.type === 'convert') {
                return t.to_cards_id === activeCardId;
            } else if (t.type === 'expense') {
                return t.from_cards_id === activeCardId;
            }
            return false;
        });
    }, [transactions, activeCardId]);

    // ava helper
    const getAvatarUrl = () => {
        if (!auth.user?.avatar) return "";

        if (auth.user.avatar.startsWith("http")) {
            return auth.user.avatar;
        }

        return `/storage/${auth.user.avatar}`;
    };

    const getUserInitials = () => {
        const names = auth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    //chart desktop
    const [chartMode, setChartMode] = useState<'monthly' | 'yearly'>('monthly');

    const selectedCardId = activeCardId ?? 0;

    const dataToMap =
        chartMode === "monthly"
            ? chartDataFromProps.monthly[selectedCardId] ?? []
            : chartDataFromProps.yearly[selectedCardId] ?? [];

    const chartData = dataToMap.map((item) => ({
        label:
            chartMode === "monthly"
                ? (item as MonthlyData).month
                : String((item as YearlyData).year),
        income: Number(item.income),
        expense: Number(item.expense),
    }));

    // Current date for desktop
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const QuickActionCard = ({ children, gradient = true, className = "" }: QuickActionCardProps) => (
        <div className={`${gradient
            ? "bg-gradient-to-br from-[#9290FE] to-[#7A78D1] text-white"
            : "bg-white text-gray-900 shadow-sm border border-gray-100"
            } rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    )

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
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile */}
            <div className="lg:hidden min-h-screen bg-gray-50">
                <div className="relative w-full max-w-sm mx-auto min-h-screen bg-white shadow-xl overflow-hidden">

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 pt-12 pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-11 w-11 ring-2 ring-white shadow-md">
                                    <AvatarImage
                                        src={getAvatarUrl()}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="font-semibold text-lg text-gray-900">Hi, {auth.user.name.split(' ')[0]}!</h1>
                                    <p className="text-sm text-gray-600">Welcome back</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.visit(route("profile.edit"))}
                                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                            >
                                <SettingsIcon className="h-5 w-5 text-gray-700" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 px-6 pb-20">

                        <div className="bg-white rounded-2xl p-6 -mt-8 mx-2 shadow-lg border border-gray-100 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Total Balance</p>
                                    <div className="flex items-center space-x-3">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {EyesOpen
                                                ? formatCurrency(
                                                    activeCard?.balance ?? 0,
                                                    currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                                )
                                                : "••••••••"}
                                        </h2>
                                        <button
                                            onClick={() => setEyesOpen(!EyesOpen)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {EyesOpen ? (
                                                <EyeIcon className="h-5 w-5 text-gray-600" />
                                            ) : (
                                                <EyeClosedIcon className="h-5 w-5 text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">My Cards</h3>
                                <AddCards label="Add Cards" triggerClassName="h-[3.5rem] w-42" />
                            </div>

                            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                                {cards && cards.length > 0 ? (
                                    cards.map((card) => (
                                        <div
                                            key={card.id}
                                            onClick={() => setActiveCardId(card.id)}
                                            className={`flex-shrink-0 p-4 rounded-xl transition-all duration-200 border-2 ${activeCardId === card.id
                                                ? "border-blue-500 bg-blue-50 shadow-md"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                                }`}
                                        >
                                            <CardIndex
                                                id={card.id}
                                                currency={card.name}
                                                balance={card.balance}
                                                eyesOpen={EyesOpen}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center w-full py-8">
                                        <p className="text-gray-500 text-sm">No cards available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-x-4 translate-y-4"></div>

                                <div className="relative z-10">
                                    <h3 className="text-white font-semibold text-lg mb-6">Financial Overview</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                                            <div className="flex items-center justify-center mb-3">
                                                <div className="p-2 bg-white/30 rounded-full">
                                                    <ArrowUpRight className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-white/80 text-xs font-medium mb-1">Income</p>
                                                <p className="text-white font-bold text-lg">
                                                    {formatCurrency(
                                                        activeCardId !== null ? incomePerCard[activeCardId] ?? 0 : 0,
                                                        currencyMap[activeCard?.currency ?? "indonesian_rupiah"]
                                                    )}
                                                </p>
                                            <div className="flex items-center justify-center mt-2">
                                                <TrendingUp className="h-3 w-3 text-green-300 mr-1" />
                                                <span className="text-green-300 text-xs">{activeRates.income_rate}%</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                                            <div className="flex items-center justify-center mb-3">
                                                <div className="p-2 bg-white/30 rounded-full">
                                                    <ArrowDownLeft className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-white/80 text-xs font-medium mb-1">Expense</p>
                                            <p className="text-white font-bold text-lg">
                                                {formatCurrency(
                                                    activeCardId !== null ? expensePerCard[activeCardId] ?? 0 : 0,
                                                    currencyMap[activeCard?.currency ?? "indonesian_rupiah"]
                                                )}
                                            </p>
                                            <div className="flex items-center justify-center mt-2">
                                                <TrendingDown className="h-3 w-3 text-red-300 mr-1" />
                                                <span className="text-red-300 text-xs">{activeRates.expense_rate}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center space-x-4">
                                        <div className="flex-1">
                                            <AddIncome label="Income" activeCardId={activeCardId ?? 0} />
                                        </div>
                                        <div className="flex-1">
                                            <AddExpense label="Expense" activeCardId={activeCardId ?? 0} />
                                        </div>
                                        <div className="flex-1">
                                            <AddConvert label="Convert" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                <button
                                    onClick={() => router.visit(route('all-activity'))}
                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    <span className="text-sm font-medium">View all</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                {filteredTransactions.length > 0 ? (
                                    <TransactionsList transactions={filteredTransactions.slice(0, 5)} />
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Activity className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-sm">No transactions yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Start by adding your first transaction</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-4"></div>
                    </div>

                    <BottomNavbar activeCardId={activeCardId}/>
                </div>
            </div>

            {/* desktop layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={activeCard}
                    {...(activeCardId !== null && { activeCardId })}
                    EyesOpen={EyesOpen}
                    setEyesOpen={setEyesOpen}
                    incomePerCard={incomePerCard}
                    expensePerCard={expensePerCard}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Hello {auth.user.name.split(' ')[0]}!
                                    </h1>
                                    <p className="text-gray-500 mt-1">Welcome back to your financial dashboard</p>
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
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Total Income"
                                    value={formatCurrency(
                                        activeCardId !== null ? incomePerCard[activeCardId] ?? 0 : 0,
                                        currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                    )}
                                    change={activeRates.income_rate}
                                    trend="up"
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Total Expense"
                                    value={formatCurrency(
                                        activeCardId !== null ? expensePerCard[activeCardId] ?? 0 : 0,
                                        currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                    )}
                                    change={activeRates.expense_rate}
                                    trend="up"
                                    color="orange"
                                    icon={<ArrowDownLeft className="w-6 h-6 text-orange-600" />}
                                />
                                <MetricCard
                                    title="Net Balance"
                                    value={formatCurrency(
                                        activeCardId !== null
                                            ? (incomePerCard[activeCardId] ?? 0) - (expensePerCard[activeCardId] ?? 0)
                                            : 0,
                                        currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                    )}
                                    change={+Math.min(
                                        Math.abs(activeRates.income_rate - activeRates.expense_rate),
                                        100
                                    ).toFixed(1)}
                                    trend="up"
                                    color="blue"
                                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                                />

                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">

                                    <QuickActionCard gradient={false}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Money Flow</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${chartMode === 'monthly' ? 'bg-gray-800 text-white' :
                                                        'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => setChartMode('monthly')}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${chartMode === 'yearly' ? 'bg-gray-800 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => setChartMode('yearly')}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80 w-full">
                                            <ResponsiveContainer width="100%" height={320}>
                                                <AreaChart data={chartData}>
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
                                    </QuickActionCard>

                                    <QuickActionCard gradient={false}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Transactions</h3>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="text-sm px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                    View all
                                                </button>
                                                <button onClick={() => router.visit(route('all-activity'))} className="text-sm px-3 py-1 text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    Show All
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {filteredTransactions.length > 0 ? (
                                                <TransactionsList transactions={filteredTransactions.slice(0, 8)} />
                                            ) : (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <Activity className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500">No transactions yet</p>
                                                    <p className="text-sm text-gray-400 mt-1">Start by adding your first transaction</p>
                                                </div>
                                            )}
                                        </div>
                                    </QuickActionCard>
                                </div>

                                <div className="space-y-6">
                                    <QuickActionCard gradient={false} className="overflow-y-auto h-96">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Available Card</h3>
                                            <button onClick={() => router.visit(route('cards.show'))} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                                View all
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {cards && cards.length > 0 ? (
                                                cards.map((card) => (
                                                    <button
                                                        key={card.id}
                                                        onClick={() => setActiveCardId(card.id)}
                                                        className={`w-full p-4 rounded-xl border transition-all ${activeCardId === card.id
                                                            ? 'border-[#9290FE] bg-[#9290FE]/5 shadow-sm'
                                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-left">
                                                                <p className="font-semibold text-gray-900">{card.name}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {formatCurrency(card.balance, currencyMap[card.currency ?? 'indonesian_rupiah'])}
                                                                </p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9290FE] to-[#7A78D1] flex items-center justify-center">
                                                                <CreditCard className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-center py-6">No cards available</p>
                                            )}
                                            {/* <AddCards label="Add Card" /> */}
                                        </div>
                                    </QuickActionCard>

                                    {activeCardId !== null && (
                                        <QuickActionCard gradient>
                                        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <AddIncome label="Add Income" activeCardId={activeCardId} />
                                            <AddExpense label="Add Expense" activeCardId={activeCardId} />
                                            <AddConvert label="Convert" />
                                        </div>
                                    </QuickActionCard>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
