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
    Filter
} from "lucide-react"
import { useState, useMemo } from "react"
import { Transaction } from "@/types/transaction"
import { currencyMap, formatCurrency } from "@/utils/formatCurrency"
import TransactionsList from "@/Components/TransactionsList"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import Sidebar from "@/Components/Sidebar"
import { useActiveCard } from "@/context/ActiveCardContext" // Import context

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
            monthly: Record<number, { month: string; income: number; expense: number }[]>;
            yearly: Record<number, { year: number; income: number; expense: number }[]>;
        };
    };

    const [EyesOpen, setEyesOpen] = useState(false)

    // GANTI: Gunakan context instead of local state
    const { activeCardId, setActiveCardId } = useActiveCard();

    const activeCard = cards.find((card) => card.id === activeCardId)
    const balance = activeCard ? activeCard.balance : 0;
    const activeRates = ratesPerCard?.[activeCardId] ?? { income_rate: 0, expense_rate: 0 };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t: any) => t.to_cards_id === activeCardId);
    }, [transactions, activeCardId]);

    // ava helper
    const getAvatarUrl = () => {
        if (auth.user.avatar) {
            return `/storage/${auth.user.avatar}`;
        }
        return '/default-avatar.png';
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

    const chartData = (activeCardId && chartDataFromProps?.[chartMode]?.[activeCardId]
        ? chartDataFromProps[chartMode][activeCardId]
        : []
    ).map((item) => ({
        label: chartMode === "monthly" ? item.month : String(item.year),
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

    const QuickActionCard = ({ children, gradient = true, className = "" }) => (
        <div className={`${gradient
            ? "bg-gradient-to-br from-[#9290FE] to-[#7A78D1] text-white"
            : "bg-white text-gray-900 shadow-sm border border-gray-100"
            } rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    )

    const MetricCard = ({ title, value, change, icon, trend = "up", color = "blue" }) => (
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
            {/* mobile layout */}
            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar />

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage
                                        src={getAvatarUrl()}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col">
                                    <h1 className="font-semibold text-xl">Hi, {auth.user.name}</h1>
                                    <p className="text-sm text-gray-500">Welcome Back!</p>
                                </div>
                            </div>

                            <button onClick={() => router.visit(route("profile.edit"))}>
                                <SettingsIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        <div>
                            <p className="text-base text-gray-500">Wallet balance</p>
                            <div className="flex items-center gap-4">
                                <p className="text-4xl font-semibold">
                                    {EyesOpen
                                        ? formatCurrency(
                                            activeCard?.balance ?? 0,
                                            currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                        )
                                        : "••••••••"}
                                </p>
                                <button onClick={() => setEyesOpen(!EyesOpen)}>
                                    {EyesOpen ? (
                                        <EyeIcon className="h-6 w-6 text-gray-600" />
                                    ) : (
                                        <EyeClosedIcon className="h-6 w-6 text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 overflow-x-auto
                        scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AddCards label={"Cards"} />

                            {cards && cards.length > 0 ? (
                                cards.map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => setActiveCardId(card.id)}
                                        className={`transition rounded-lg ${activeCardId === card.id ? "" : ""
                                            }`}
                                    >
                                        <CardIndex
                                            id={card.id}
                                            currency={card.name}
                                            balance={card.balance}
                                            eyesOpen={EyesOpen}
                                        />
                                    </button>
                                ))
                            ) : (
                                <p className="text-gray-500">No cards yet</p>
                            )}
                        </div>

                        <div className="mt-8">
                            <div className="relative bg-[#9290FE] w-full h-44 rounded-2xl p-4 flex flex-col
                            justify-between overflow-hidden lg:w-full lg:h-56 md:h-52">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#7A78D1] rounded-full opacity-50 -translate-x-1/3 -translate-y-1/3"></div>
                                <div className="absolute bottom-6 left-0 space-y-2">
                                    <div className="w-16 h-2 bg-[#7A78D1] rounded-full"></div>
                                    <div className="w-20 h-2 bg-[#7A78D1] rounded-full"></div>
                                    <div className="w-14 h-2 bg-[#7A78D1] rounded-full"></div>
                                </div>

                                <div className="flex items-center justify-between relative z-10 gap-1 lg:gap-2">
                                    <div className="flex-1">
                                        <CardBalance
                                            currency={currencyMap[activeCard?.currency ?? 'indonesian_rupiah']}
                                            type="Income"
                                            icon={<LogInIcon />}
                                            rate={activeRates.income_rate}
                                            rateLow={activeRates.expense_rate}
                                            balance={incomePerCard[activeCardId] ?? 0}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <CardBalance
                                            currency={currencyMap[activeCard?.currency ?? 'indonesian_rupiah']}
                                            type="Expense"
                                            icon={<LogInIcon />}
                                            rate={activeRates.expense_rate}
                                            rateLow={activeRates.income_rate}
                                            balance={expensePerCard[activeCardId] ?? 0}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-6 text-white font-semibold relative z-10">
                                    <AddIncome label="Add Income" activeCardId={activeCardId} />
                                    <AddExpense label="Add Expense" activeCardId={activeCardId} />
                                    <AddConvert label="Convert" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-medium">Recent Activity</h1>
                                <button onClick={() => router.visit(route('all-activity'))} className="flex items-center gap-2 text-sm text-blue-500">
                                    <p>See details</p>
                                    <ChevronRight />
                                </button>
                            </div>

                            <TransactionsList transactions={filteredTransactions} />
                        </div>
                    </div>
                </div>
            </div>

            {/* desktop layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={activeCard}
                    activeCardId={activeCardId} // Pass dari context
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
                                    value={formatCurrency(incomePerCard[activeCardId] ?? 0, currencyMap[activeCard?.currency ?? 'indonesian_rupiah'])}
                                    change={activeRates.income_rate}
                                    trend="up"
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Total Expense"
                                    value={formatCurrency(expensePerCard[activeCardId] ?? 0, currencyMap[activeCard?.currency ?? 'indonesian_rupiah'])}
                                    change={activeRates.expense_rate}
                                    trend="up"
                                    color="orange"
                                    icon={<ArrowDownLeft className="w-6 h-6 text-orange-600" />}
                                />
                                <MetricCard
                                    title="Net Balance"
                                    value={formatCurrency(
                                        (incomePerCard[activeCardId] ?? 0) - (expensePerCard[activeCardId] ?? 0),
                                        currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                                    )}
                                    change={Math.abs(activeRates.income_rate - activeRates.expense_rate)}
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
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                                        chartMode === 'monthly' ? 'bg-gray-800 text-white' :
                                                        'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => setChartMode('monthly')}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                                        chartMode === 'yearly' ? 'bg-gray-800 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => setChartMode('yearly')}
                                                >
                                                    Yearly
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
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
                                    <QuickActionCard gradient={false} className="overflow-y-auto">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Available Card</h3>
                                            <button onClick={() => router.visit(route('cards.show'))} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                                View all
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {cards && cards.length > 0 ? (
                                                cards.slice(0, 3).map((card) => (
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

                                    <QuickActionCard gradient>
                                        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <AddIncome label="Add Income" activeCardId={activeCardId} />
                                            <AddExpense label="Add Expense" activeCardId={activeCardId} />
                                            <AddConvert label="Convert" />
                                        </div>
                                    </QuickActionCard>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
