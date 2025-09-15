import Cards from "@/Components/AddCards"
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
    PlusSquareIcon,
    MinusSquare,
    ChevronsRightLeftIcon,
    ChevronRight,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Transaction } from "@/types/transaction"
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import TransactionsList from "@/Components/TransactionsList"

export default function Home() {
    const { auth, 
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
            currency: number

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

    const [EyesOpen, setEyesOpen] = useState(false)
    const [activeCardId, setActiveCardId] = useState<number>(
        (cards && cards.length > 0) ? cards[0].id : 0
    )
    const activeCard = cards.find((card) => card.id === activeCardId)
    const balance = activeCard ? activeCard.balance : 0;
    const activeRates = ratesPerCard?.[activeCardId] ?? { income_rate: 0, expense_rate: 0 };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t: any) => t.to_cards_id === activeCardId);
    }, [transactions, activeCardId]);

    // helper get ava
    const getAvatarUrl = () => {
        if (auth.user.avatar) {
            return `/storage/${auth.user.avatar}`;
        }
        return '/default-avatar.png'; // fallback image
    };

    // helper user initials
    const getUserInitials = () => {
        const names = auth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
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
                                        currencyMap[activeCard?.currency ?? 1] // default IDR
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
                        <Cards label={"Cards"} />

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

                            <div className="flex items-center justify-between relative z-10 gap-1 lg:gap-2 ">
                                <div className="flex-1">
                                    <CardBalance
                                        currency={currencyMap[activeCard?.currency ?? 1]}
                                        type="Income"
                                        icon={<LogInIcon />}
                                        rate={activeRates.income_rate}   // rateHigh untuk income
                                        rateLow={activeRates.expense_rate}
                                        balance={incomePerCard[activeCardId] ?? 0}
                                    // rateLow={0}
                                    />
                                </div>
                                <div className="flex-1">
                                    <CardBalance
                                        currency={currencyMap[activeCard?.currency ?? 1]}
                                        type="Expense"
                                        icon={<LogInIcon />}
                                        rate={activeRates.expense_rate}
                                        rateLow={activeRates.income_rate}
                                        balance={expensePerCard[activeCardId] ?? 0}
                                    // rateLow={15}
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
                            <button className="flex items-center gap-2 text-sm text-blue-500">
                                <p>See details</p>
                                <ChevronRight />
                            </button>
                        </div>

                        <TransactionsList transactions={filteredTransactions} />
                    </div>
                </div>
            </div>
        </div>
    )
}