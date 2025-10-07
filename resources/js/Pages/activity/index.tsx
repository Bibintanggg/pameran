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
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Activity as ActivityIcon,
    ChevronRight,
    CreditCard,
    RefreshCw,
    User,
    LogOut
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Transaction } from "@/types/transaction";
import { Card } from "@/types/card";
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import ActivityNavbar from "./layout/nav";
import { useActiveCard } from "@/context/ActiveCardContext"; // Import context
import { ErrorBoundary } from "@/Components/ErrorBoundary";
import SyncLoader from "react-spinners/SyncLoader";
import axios from "axios";
import { useClerk } from "@clerk/clerk-react";

type Props = {
    transactions: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
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
            avatar: string;
        }
    };
    incomePerCard: Record<number, number>;
    expensePerCard: Record<number, number>;
    startDate: string | null;
    endDate: string | null;
    activeCardId: number;
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
        expensePerCard,
        activeCardId: serverActiveCardId
    } = usePage().props as unknown as Props;


    const { activeCardId, setActiveCardId } = useActiveCard();
    const { signOut } = useClerk()
    // const { activeCardId: initialActiveCardId } = usePage().props as any;

    const [filter, setFilter] = useState<"all" | "income" | "expense">(initialFilter as "all" | "income" | "expense");
    const [chartMode, setChartMode] = useState<"monthly" | "yearly">(initialChartMode as "monthly" | "yearly");
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)


    const activeCard = cards.find((card) => card.id === activeCardId); // DARI CONTEXT CARD AKTIF

    // Filter transaksi berdasarkan kartu aktif
    // const filteredTransactions = useMemo(() => {
    //     // console.log('Filtering transactions for card:', activeCardId);
    //     if (!transactions.data) return [];

    //     return transactions.data.filter((t) => {
    //         // Gunakan cardId dari parameter, bukan bergantung sepenuhnya pada context
    //         const currentCardId = activeCardId;

    //         let matchesCard = false;
    //         if (currentCardId === 0) {
    //             matchesCard = true;
    //         } else {
    //             if (t.type === 'income' || t.type === 'convert') {
    //                 matchesCard = t.to_cards_id === currentCardId;
    //             } else if (t.type === 'expense') {
    //                 matchesCard = t.from_cards_id === currentCardId;
    //             }
    //         }

    //         if (!matchesCard) return false;

    //         if (filter === "all") return true;
    //         if (filter === "income") return t.type === "income" || t.type === "convert";
    //         if (filter === "expense") return t.type === "expense";
    //         return true;
    //     });
    // }, [transactions.data, activeCardId, filter]);

    const displayTransactions = transactions.data || [];

    // useEffect(() => {
    //     if (serverActiveCardId !== undefined && serverActiveCardId !== activeCardId) {
    //         setActiveCardId(serverActiveCardId);
    //     }
    // }, [serverActiveCardId, setActiveCardId, activeCardId]);

    // Data untuk chart berdasarkan kartu aktif
    const chartDataForActiveCard = useMemo(() => {
        if (activeCardId === 0) {
            // Gabungkan data untuk semua kartu
            const allMonthlyData: Record<string, { income: number; expense: number }> = {};
            const allYearlyData: Record<string, { income: number; expense: number }> = {};

            // Proses data bulanan
            Object.values(chartData.monthly).forEach(cardData => {
                cardData.forEach(item => {
                    if (!allMonthlyData[item.label]) {
                        allMonthlyData[item.label] = { income: 0, expense: 0 };
                    }
                    allMonthlyData[item.label].income += item.income;
                    allMonthlyData[item.label].expense += item.expense;
                });
            });

            // Proses data tahunan
            Object.values(chartData.yearly).forEach(cardData => {
                cardData.forEach(item => {
                    if (!allYearlyData[item.label]) {
                        allYearlyData[item.label] = { income: 0, expense: 0 };
                    }
                    allYearlyData[item.label].income += item.income;
                    allYearlyData[item.label].expense += item.expense;
                });
            });

            const monthlyResult = Object.entries(allMonthlyData).map(([label, data]) => ({
                label,
                income: data.income,
                expense: data.expense
            }));

            const yearlyResult = Object.entries(allYearlyData).map(([label, data]) => ({
                label,
                income: data.income,
                expense: data.expense
            }));

            return {
                monthly: monthlyResult,
                yearly: yearlyResult
            };
        } else {
            return {
                monthly: chartData.monthly[activeCardId ?? 0] || [],
                yearly: chartData.yearly[activeCardId ?? 0] || []
            };
        }
    }, [chartData, activeCardId]);

    const mergedChartData = useMemo(() => {
        return chartMode === "monthly"
            ? chartDataForActiveCard.monthly
            : chartDataForActiveCard.yearly;
    }, [chartDataForActiveCard, chartMode]);

    const calculatedTotalIncome = useMemo(() => {
        if (activeCardId === null) return 0;
        if (activeCardId === 0) return totalIncome;
        return incomePerCard[activeCardId] || 0;
    }, [activeCardId, totalIncome, incomePerCard]);

    const calculatedTotalExpense = useMemo(() => {
        if (activeCardId === null) return 0;
        if (activeCardId === 0) return totalExpense;
        return expensePerCard[activeCardId] || 0;
    }, [activeCardId, totalExpense, expensePerCard]);

    const calculatedIncomeRate = useMemo(() => {
        if (activeCardId === null) return 0;
        if (activeCardId === 0) return incomeRate;
        return ratesPerCard[activeCardId]?.income_rate || 0;
    }, [activeCardId, incomeRate, ratesPerCard]);

    const calculatedExpenseRate = useMemo(() => {
        if (activeCardId === null) return 0;
        if (activeCardId === 0) return expenseRate;
        return ratesPerCard[activeCardId]?.expense_rate || 0;
    }, [activeCardId, expenseRate, ratesPerCard]);

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
                        <span>{Math.abs(change)}%</span>
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

    const formatAutoCurrency = (amount: number, currencyId?: string) => {
        const currency = currencyMap[currencyId ?? (activeCard?.currency || 'indonesian_rupiah')];
        return formatCurrency(amount, currency);
    };

    const handleCardChange = (cardId: number) => {
        // console.log('Card changed to:', cardId, 'Previous:', activeCardId);
        if (isLoading || cardId === activeCardId) return;

        setIsLoading(true);
        // setActiveCardId(cardId);

        router.get(route('all-activity'), {
            filter,
            chartMode,
            activeCardId: cardId,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                setIsLoading(false)
                setActiveCardId(cardId);
            },
            onError: () => setIsLoading(false)
        });
    };

    const handleFilterChange = (newFilter: "all" | "income" | "expense") => {
        if (isLoading) return;

        setIsLoading(true);
        setFilter(newFilter);

        router.get(route('all-activity'), {
            filter: newFilter,
            chartMode,
            activeCardId: activeCardId,
            page: 1
        }, {
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleChartModeChange = (newMode: "monthly" | "yearly") => {
        if (isLoading) return;

        setIsLoading(true);
        setChartMode(newMode);

        router.get(route('all-activity'), {
            filter,
            chartMode: newMode,
            activeCardId: activeCardId,
            page: 1
        }, {
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const refreshData = () => {
        if (isLoading) return;

        setIsLoading(true);
        router.get(route('all-activity'), {
            filter,
            chartMode,
            activeCardId: activeCardId,
            page: transactions.current_page,
        }, {
            preserveState: false,
            onFinish: () => setIsLoading(false)
        });
    };

    const handlePageChange = (page: number) => {
        if (isLoading) return;

        setIsLoading(true);

        router.get(route('all-activity'), {
            page: page,
            filter,
            chartMode,
            activeCardId: activeCardId
            // end_date: endDate,
            // start_date: startDate,
        }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false),
            onError: () => setIsLoading(false)
        });
    };

    const [date, setDate] = React.useState<{ from: Date | undefined; to?: Date | undefined }>();

    const netBalance = calculatedTotalIncome - calculatedTotalExpense;
    const netBalanceTrend = netBalance >= 0 ? "up" : "down";
    const netBalanceChange = (calculatedIncomeRate - calculatedExpenseRate).toFixed(2);

    const handleLogout = async () => {
        await axios.post('/auth/clerk/logout')
        await signOut()
        window.location.href = "/"
    }

    // if (isLoading) {
    //     return (
    //         <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-100/50 to-gray-200/50 backdrop-blur-sm">
    //             <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 flex items-center justify-center flex-col">
    //                 <SyncLoader size={15} color="#10B981" />
    //                 <p className="text-gray-600 mt-4 text-center">Loading chart data...</p>
    //             </div>
    //         </div>
    //     );
    // }

    if (!transactions || !cards) {
        return <ErrorBoundary>
            <div className="text-center py-8 text-gray-500">
                <p>Something went wrong. Please try again later.</p>
            </div>
        </ErrorBoundary>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Analytics" />
            {/* Mobile Layout */}
            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar activeCardId={activeCardId} />

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Mobile Header */}
                        <div className="flex items-center justify-between mb-6 relative">
                            <div className="flex items-center gap-4" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <Avatar className="h-10 w-10 cursor-pointer">
                                    {auth.user.avatar ? (
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </div>

                            <div className="flex flex-col items-center">
                                <h1 className="text-xl font-semibold">Activity</h1>
                                <p className="text-sm text-gray-500">All Transactions</p>
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
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-700"}`}
                                >
                                    All Cards
                                </button>
                                {cards && cards.length > 0 ? (
                                    cards.map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => handleCardChange(card.id)}
                                            className={`min-w-max px-4 py-2 rounded-lg transition-colors ${activeCardId === card.id
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-700"}`}
                                        >
                                            {card.name}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No cards yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-3">
                            <div className="flex items-center justify-center mb-2">
                                <p className="text-xs font-medium text-gray-600 text-center">Net Balance</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                {formatAutoCurrency(netBalance, activeCard?.currency)}
                            </p>
                            <p className="text-xs text-green-600">{netBalanceChange}%</p>
                        </div>

                        <div className="flex flex-col gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-600">Total Income</p>
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-green-600">+{calculatedIncomeRate}%</p>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-600">Total Expense</p>
                                    <ArrowDownLeft className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    {formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                </p>
                                <p className="text-xs text-red-600">+{calculatedExpenseRate}%</p>
                            </div>
                        </div>

                        {/* Mobile Chart */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Overview</h3>
                                <div className="flex gap-2">
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}
                                        onClick={() => handleChartModeChange('monthly')}
                                        disabled={isLoading}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        className={`text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600'
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
                                            formatter={(value: any, name: string) => [
                                                formatAutoCurrency(value, activeCard?.currency),
                                                name === 'income' ? 'Income' : 'Expense'
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
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Transactions</h3>
                                    <p className="text-sm text-gray-500">
                                        Showing {transactions.total} transactions
                                    </p>
                                </div>
                                <button
                                    className="text-blue-500 text-sm"
                                >
                                    View all
                                </button>
                                <button onClick={() => window.location.href = route("activity.export")}
                                    className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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

                                                    router.get(route('all-activity'), {
                                                        filter,
                                                        chartMode,
                                                        page: 1,
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
                            <div className="max-h-60 overflow-y-auto">
                                {transactions.data.length > 0 ? (
                                    <TransactionsList
                                        transactions={transactions}
                                        onPageChange={handlePageChange}
                                        activeCardId={activeCardId}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No transactions found for the current filter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                </div>

            </div>

            {isDropdownOpen && (
                <div className="fixed top-20 left-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                    <button
                        onClick={() => {
                            setIsDropdownOpen(false)
                            router.visit(route("profile.edit"))
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </button>
                    <button
                        onClick={() => {
                            setIsDropdownOpen(false)
                            handleLogout()
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 rounded-b-lg"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={activeCard}
                    {...(activeCardId !== null && { activeCardId })}
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
                                    <p className="text-gray-500 mt-1">Complete financial statistics {activeCardId === 0 ? "across all cards" : `for ${activeCard?.name}`}</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Total Income"
                                    value={formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                    change={calculatedIncomeRate}
                                    trend="up"
                                    color="green"
                                    icon={<ArrowUpRight className="w-6 h-6 text-green-600" />}
                                />
                                <MetricCard
                                    title="Total Expense"
                                    value={formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                    change={calculatedExpenseRate}
                                    trend="up"
                                    color="orange"
                                    icon={<ArrowDownLeft className="w-6 h-6 text-orange-600" />}
                                />
                                <MetricCard
                                    title="Net Balance"
                                    value={formatAutoCurrency(netBalance, activeCard?.currency)}
                                    change={netBalanceChange ? parseFloat(netBalanceChange) : 0}
                                    trend={netBalanceTrend}
                                    color="blue"
                                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {activeCardId === 0 ? "Complete Money Flow" : `Money Flow for ${activeCard?.name}`}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'monthly'
                                                        ? 'bg-gray-800 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    onClick={() => handleChartModeChange('monthly')}
                                                    disabled={isLoading}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${chartMode === 'yearly'
                                                        ? 'bg-gray-800 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                                                </div>
                                            )}
                                            <ResponsiveContainer width="100%" height={320}>
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
                                                        formatter={(value: any, name: string) => [
                                                            formatAutoCurrency(value, activeCard?.currency),
                                                            name === 'income' ? 'Income' : 'Expense'
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
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    All Transactions
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Showing {transactions.total} transactions
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="text-sm px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                    onClick={() => router.visit(route('transactions.index'))}
                                                >
                                                    View all
                                                </button>
                                                <button onClick={() => window.location.href = route("activity-income.export")}
                                                    className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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

                                                                    router.get(route('all-activity'), {
                                                                        filter,
                                                                        chartMode,
                                                                        page: 1,
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
                                            {transactions.data.length > 0 ? (
                                                <TransactionsList
                                                    transactions={transactions}
                                                    onPageChange={handlePageChange}
                                                    activeCardId={activeCardId}
                                                />
                                            ) : (
                                                <div className="text-center py-12 text-gray-500">
                                                    <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg font-medium">No transactions found</p>
                                                    <p>Try changing the filter or adding new transactions.</p>
                                                </div>
                                            )}
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
                                                    {formatAutoCurrency(calculatedTotalIncome, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <ArrowDownLeft className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-orange-900">Total Expense</span>
                                                </div>
                                                <span className="font-semibold text-orange-900">
                                                    {formatAutoCurrency(calculatedTotalExpense, activeCard?.currency)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium text-blue-900">Net Balance</span>
                                                </div>
                                                <span className={`font-semibold ${netBalance >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                                                    {formatAutoCurrency(netBalance, activeCard?.currency)}
                                                </span>
                                            </div>

                                            {/* Statistics Summary */}
                                            <div className="border-t pt-4 mt-4">
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Income Rate</p>
                                                        <p className="font-semibold text-green-600">{calculatedIncomeRate}%</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 mb-1">Expense Rate</p>
                                                        <p className="font-semibold text-orange-600">{calculatedExpenseRate}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cards Overview</h3>
                                        <div className="space-y-3">
                                            {cards.length > 0 ? (
                                                cards.map(card => {
                                                    const cardIncome = incomePerCard[card.id] || 0;
                                                    const cardExpense = expensePerCard[card.id] || 0;
                                                    const cardRates = ratesPerCard[card.id] || { income_rate: 0, expense_rate: 0 };

                                                    return (
                                                        <div
                                                            key={card.id}
                                                            className={`p-3 rounded-lg transition-colors cursor-pointer ${activeCardId === card.id
                                                                ? 'bg-blue-50 border border-blue-200'
                                                                : 'bg-gray-50 hover:bg-gray-100'
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
                                                            <div className="flex items-end justify-between text-sm flex-col">
                                                                <div className="flex items-center gap-1">
                                                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                                                    <span className="text-green-600">
                                                                        {formatAutoCurrency(cardIncome, card.currency)}
                                                                    </span>
                                                                    <span className="text-gray-400">
                                                                        ({cardRates.income_rate}%)
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <ArrowDownLeft className="h-3 w-3 text-orange-500" />
                                                                    <span className="text-orange-600">
                                                                        {formatAutoCurrency(cardExpense, card.currency)}
                                                                    </span>
                                                                    <span className="text-gray-400">
                                                                        ({cardRates.expense_rate}%)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Net balance per card */}
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-gray-500">Net:</span>
                                                                    <span className={`font-medium ${(cardIncome - cardExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {formatAutoCurrency(cardIncome - cardExpense, card.currency)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-center py-4 text-gray-500">
                                                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No cards found</p>
                                                    <button
                                                        onClick={() => router.visit(route('cards.create'))}
                                                        className="text-blue-500 text-sm hover:underline mt-1"
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
                                                        <span className="text-gray-500">Transactions:</span>
                                                        <span className="font-medium">{transactions.total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
