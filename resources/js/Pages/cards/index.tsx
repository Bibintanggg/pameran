"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import Sidebar from "@/Components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router, usePage } from "@inertiajs/react";
import {
    Settings,
    Plus,
    CreditCard,
    Eye,
    EyeOff,
    MoreVertical,
    Edit,
    Trash2,
    Copy,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    TrashIcon
} from "lucide-react";
import { useState } from "react";
import { currencyMap, formatCurrency } from "@/utils/formatCurrency";
import AddCards from "@/Components/AddCards";
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/Components/ui/alert-dialog";
import { Button } from "@/Components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog"
import EditCards from "@/Components/EditCards";

type Card = {
    id: number;
    name: string;
    card_number: string;
    balance: number;
    currency: string;
    type: string;
    color: string;
    income: number;
    expense: number;
    net: number;
};

type Statistics = {
    totalCards: number;
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    incomeGrowth: number;
    expenseGrowth: number;
    balanceGrowth: number;
};

type Props = {
    cards: Card[];
    statistics: Statistics;
    auth: {
        user: {
            name: string;
            avatar: string;
        }
    };
};

export default function Cards() {
    const { cards, statistics, auth } = usePage().props as Props;

    const [eyesOpen, setEyesOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpenDialog, setIsOpenDialog] = useState(false)

    const formatAutoCurrency = (amount: number, currencyId?: string) => {
        const currency = currencyMap[currencyId ?? 'as_dollar']; // fallback beneran ada
        return formatCurrency(amount, currency);
    };

    const getUserInitials = () => {
        const names = auth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    const refreshData = () => {
        if (isLoading) return;

        setIsLoading(true);
        router.get(route('cards.show'), {}, {
            preserveState: false,
            onFinish: () => setIsLoading(false)
        });
    };

    const handleDeleteCard = (cardId: number) => {
        router.delete(route('cards.destroy', { card: cardId }), {
            onSuccess: () => {
                setSelectedCard(null);
            }
        });
    };

    // const handleEditCard = (cardId: number) => {
    //     router.visit(route('cards.edit', cardId));
    // };

    const copyCardNumber = (cardNumber: string) => {
        navigator.clipboard.writeText(cardNumber);
    };

    const getCurrencyLabel = (value: string) => {
        switch (value) {
            case 'indonesian_rupiah': return "Indonesian Rupiah"
            case 'baht_thailand': return "Baht Thailand"
            case 'as_dollar': return 'AS Dollar'
            default: "Indonesian Rupiah"
        }
    }

    const CardComponent = ({ card, isDesktop = false }: { card: Card; isDesktop?: boolean }) => (
        <div className={`relative ${isDesktop ? 'h-48' : 'h-40'} rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            <div
                className="absolute inset-0 p-6 flex flex-col justify-between text-white"
                style={{ background: card.color }}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm opacity-80">{getCurrencyLabel(card.currency)}</p>
                        <h3 className="text-lg font-bold">{card.name}</h3>
                    </div>
                    <button
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCard(selectedCard === card.id ? null : card.id);
                        }}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                <div>
                    <p className="text-sm opacity-80 mb-2">{card.card_number}</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm opacity-80">Balance</p>
                            <p className="text-2xl font-bold">
                                {eyesOpen ? formatAutoCurrency(card.balance, card.currency) : "****"}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 opacity-60" />
                    </div>
                </div>
            </div>

            {selectedCard === card.id && (
                <div className="absolute top-12 right-6 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant={"link"} className="flex items-center"
                            onClick={() => setIsOpenDialog(true)}>
                                <Eye className="w-4 h-4" />
                                <p>View Details</p>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click save when you&apos;re
                                    done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="name-1">Name</Label>
                                    <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="username-1">Username</Label>
                                    <Input id="username-1" name="username" defaultValue="@peduarte" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                        // onClick={() => handleEditCard(card.id)}
                    >
                        <EditCards card={card}/>
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                        onClick={() => copyCardNumber(card.card_number)}
                    >
                        <Copy className="w-4 h-4" />
                        Copy Number
                    </button>
                    <hr className="my-2" />
                    <button
                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                        onClick={() => handleDeleteCard(card.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Card
                    </button>
                </div>
            )}
        </div>
    );

    const StatsCard = ({ title, amount, change, icon, isPositive, isAmount = true }: {
        title: string;
        amount: number;
        change: number;
        icon: React.ReactNode;
        isPositive: boolean;
        isAmount?: boolean;
    }) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                    {icon}
                </div>
                <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    <span className="ml-1">{change}%</span>
                </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">
                {isAmount ? formatAutoCurrency(amount) : amount.toString()}
            </p>
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
                                    {auth.user.avatar ? (
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-blue-500 text-white font-semibold">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold text-gray-900">My Cards</h2>
                                    <p className="text-sm text-gray-500">{statistics.totalCards} cards</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEyesOpen(!eyesOpen)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {eyesOpen ?
                                        <Eye className="h-5 w-5 text-gray-600" /> :
                                        <EyeOff className="h-5 w-5 text-gray-600" />
                                    }
                                </button>
                                <button
                                    onClick={refreshData}
                                    disabled={isLoading}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <button>
                                    <Settings className="h-6 w-6 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <hr className="w-full h-0.5 bg-gray-200 mb-6" />

                        {/* Mobile Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <StatsCard
                                title="Total Balance"
                                amount={statistics.totalBalance}
                                change={statistics.balanceGrowth}
                                icon={<Wallet className="w-5 h-5 text-blue-600" />}
                                isPositive={statistics.balanceGrowth >= 0}
                            />
                            <StatsCard
                                title="Net Income"
                                amount={statistics.netIncome}
                                change={statistics.incomeGrowth}
                                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                                isPositive={statistics.netIncome >= 0}
                            />
                        </div>

                        <AddCards label="Add Cards"
                            triggerClassName="h-[3.5rem]" />

                        {/* Mobile Cards Grid */}
                        <div className="space-y-4 mt-5">
                            {cards.length > 0 ? (
                                cards.map((card) => (
                                    <CardComponent key={card.id} card={card} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No cards found</p>
                                    <p className="mb-4">Add your first card to get started</p>
                                    <AddCards label="Add Card"
                                        triggerClassName="h-[3.5rem]" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={null}
                    activeCardId={0}
                    EyesOpen={eyesOpen}
                    setEyesOpen={setEyesOpen}
                    incomePerCard={{}}
                    expensePerCard={{}}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        My Cards
                                    </h1>
                                    <p className="text-gray-500 mt-1">Manage your payment cards and accounts</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setEyesOpen(!eyesOpen)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {eyesOpen ?
                                            <Eye className="h-5 w-5 text-gray-600" /> :
                                            <EyeOff className="h-5 w-5 text-gray-600" />
                                        }
                                        <span className="text-sm font-medium">
                                            {eyesOpen ? 'Hide' : 'Show'} Balance
                                        </span>
                                    </button>
                                    <button
                                        onClick={refreshData}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                                        <span className="text-sm font-medium">Refresh</span>
                                    </button>
                                    <AddCards label={"Add Card"}
                                        triggerClassName="h-[3.5rem] w-44 flex items-center gap-10" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {cards.length > 0 ? (
                                <>
                                    {/* Desktop Cards Grid */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-bold text-gray-900">Your Cards</h2>
                                            <p className="text-gray-500">{statistics.totalCards} cards total</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {cards.map((card) => (
                                                <CardComponent key={card.id} card={card} isDesktop={true} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card Details Section */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">Cards Overview</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left border-b border-gray-100">
                                                        <th className="pb-3 font-medium text-gray-600">Card Name</th>
                                                        {/* <th className="pb-3 font-medium text-gray-600">Type</th> */}
                                                        <th className="pb-3 font-medium text-gray-600">Balance</th>
                                                        <th className="pb-3 font-medium text-gray-600">Income</th>
                                                        <th className="pb-3 font-medium text-gray-600">Expense</th>
                                                        <th className="pb-3 font-medium text-gray-600">Net</th>
                                                        <th className="pb-3 font-medium text-gray-600">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cards.map((card) => (
                                                        <tr key={card.id} className="border-b border-gray-50">
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-10 h-6 rounded"
                                                                        style={{ background: card.color }}
                                                                    ></div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{card.name}</p>
                                                                        <p className="text-sm text-gray-500">{card.card_number}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            {/* <td className="py-4 text-gray-600">{card.currency}</td> */}
                                                            <td className="py-4 font-semibold text-gray-900">
                                                                {eyesOpen ? formatAutoCurrency(card.balance, card.currency) : "****"}
                                                            </td>
                                                            <td className="py-4 text-green-600 font-medium">
                                                                {formatAutoCurrency(card.income, card.currency)}
                                                            </td>
                                                            <td className="py-4 text-red-600 font-medium">
                                                                {formatAutoCurrency(card.expense, card.currency)}
                                                            </td>
                                                            <td className={`py-4 font-medium ${card.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatAutoCurrency(card.net, card.currency)}
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                        // onClick={() => handleEditCard(card.id)}
                                                                    >
                                                                        <EditCards card={card}/>
                                                                        {/* <Edit className="w-4 h-4 text-gray-600" /> */}
                                                                    </button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <button className="hover:bg-black/5 transition-all duration-300 ease-in-out rounded-full w-5 h-5 flex items-center justify-center">
                                                                                <TrashIcon size={15} color={"red"} />
                                                                            </button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This action cannot be undone. The card and its data will be permanently deleted.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction asChild>
                                                                                    <button
                                                                                        onClick={() => handleDeleteCard(card.id)}
                                                                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="max-w-md mx-auto">
                                        <CreditCard className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No cards found</h3>
                                        <p className="text-gray-500 mb-6">
                                            Get started by adding your first payment card or account to track your finances.
                                        </p>
                                        <AddCards
                                            label="Add your first cards"
                                            className="items-center flex justify-center gap-5"
                                            triggerClassName="h-16 w-72" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedCard && (
                <div
                    className="fixed inset-0 z-5"
                    onClick={() => setSelectedCard(null)}
                ></div>
            )}
        </div>
    );
}
