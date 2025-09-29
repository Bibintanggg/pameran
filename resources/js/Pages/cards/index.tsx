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
    TrashIcon,
    AlertCircleIcon,
    CheckCircle2Icon,
    PopcornIcon
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
} from "@/Components/ui/dialog"
import EditCards from "@/Components/EditCards";
import CardComponent, { CardComponentRef } from "@/Components/CardComponent";

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
            id: number;
            name: string;
            email: string;
            avatar: string;
        };
    };
};

export default function Cards() {
    const { cards, statistics, auth } = usePage<Props>().props;

    const [eyesOpen, setEyesOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openDialogCardId, setOpenDialogCardId] = useState<number | null>(null);
    const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
    const cardComponentRefs = useRef<{ [key: number]: CardComponentRef | null }>({});

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const isOutsideAll = Object.values(dropdownRefs.current).every(ref => {
                return ref && !ref.contains(event.target as Node);
            });

            const isOutsideAllButtons = Object.values(buttonRefs.current).every(ref => {
                return ref && !ref.contains(event.target as Node);
            });

            if (isOutsideAll && isOutsideAllButtons && selectedCard) {
                setSelectedCard(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCard]);

    const formatAutoCurrency = (amount: number, currency?: string) => {
        const currencyKey = currency ?? 'as_dollar';
        return formatCurrency(amount, currencyMap[currencyKey]);
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

    const handleViewDetails = (cardId: number) => {
        setOpenDialogCardId(cardId);
        setSelectedCard(null);
    };

    const getCurrencyLabel = (value: string) => {
        switch (value) {
            case 'indonesian_rupiah': return "Indonesian Rupiah";
            case 'baht_thailand': return "Baht Thailand";
            case 'as_dollar': return 'AS Dollar';
            default: return "Indonesian Rupiah";
        }
    };

    // View Details Dialog Component
    const ViewDetailsDialog = () => {
        if (!openDialogCardId) return null;

        const card = cards.find(c => c.id === openDialogCardId);
        if (!card) return null;

        return (
            <Dialog open={!!openDialogCardId} onOpenChange={(open) => !open && setOpenDialogCardId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Card Details</DialogTitle>
                        <DialogDescription>
                            Details for {card.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Card Name:</Label>
                            <Input
                                className="col-span-3"
                                value={card.name}
                                readOnly
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Balance:</Label>
                            <Input
                                className="col-span-3"
                                value={formatAutoCurrency(card.balance, card.currency)}
                                readOnly
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Income:</Label>
                            <Input
                                className="col-span-3"
                                value={formatAutoCurrency(card.income || 0, card.currency)}
                                readOnly
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Expense:</Label>
                            <Input
                                className="col-span-3"
                                value={formatAutoCurrency(card.expense || 0, card.currency)}
                                readOnly
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Net:</Label>
                            <span className={`col-span-3 ${(card.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatAutoCurrency(card.net || 0, card.currency)}
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setOpenDialogCardId(null)}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

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
            <ViewDetailsDialog />

            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar />

                    <div className="flex-1 overflow-y-auto p-6">
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

                        <AddCards label="Add Cards" triggerClassName="h-[3.5rem]" />

                        {/* Mobile Cards Grid */}
                        <div className="space-y-4 mt-5">
                            {cards.length > 0 ? (
                                cards.map((card) => (
                                    <CardComponent
                                        key={card.id}
                                        ref={el => cardComponentRefs.current[card.id] = el}
                                        card={card}
                                        eyesOpen={eyesOpen}
                                        onViewDetails={handleViewDetails}
                                        onDeleteCard={handleDeleteCard}
                                        formatAutoCurrency={formatAutoCurrency}
                                        getCurrencyLabel={getCurrencyLabel}
                                        dropdownRefs={dropdownRefs}
                                        buttonRefs={buttonRefs}
                                        selectedCard={selectedCard}
                                        setSelectedCard={setSelectedCard}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">No cards found</p>
                                    <p className="mb-4">Add your first card to get started</p>
                                    <AddCards label="Add Card" triggerClassName="h-[3.5rem]" />
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
                    // activeCard={0}
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
                                    <AddCards label={"Add Card"} triggerClassName="h-[3.5rem] w-44 flex items-center gap-10" />
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
                                                <CardComponent
                                                    key={card.id}
                                                    ref={el => cardComponentRefs.current[card.id] = el}
                                                    card={card}
                                                    isDesktop={true}
                                                    eyesOpen={eyesOpen}
                                                    onViewDetails={handleViewDetails}
                                                    onDeleteCard={handleDeleteCard}
                                                    formatAutoCurrency={formatAutoCurrency}
                                                    getCurrencyLabel={getCurrencyLabel}
                                                    dropdownRefs={dropdownRefs}
                                                    buttonRefs={buttonRefs}
                                                    selectedCard={selectedCard}
                                                    setSelectedCard={setSelectedCard}
                                                />
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
                                                            <td className="py-4 font-semibold text-gray-900">
                                                                {eyesOpen ? formatAutoCurrency(card.balance, card.currency) : "****"}
                                                            </td>
                                                            <td className="py-4 text-green-600 font-medium">
                                                                {formatAutoCurrency(card.income || 0, card.currency)}
                                                            </td>
                                                            <td className="py-4 text-red-600 font-medium">
                                                                {formatAutoCurrency(card.expense || 0, card.currency)}
                                                            </td>
                                                            <td className={`py-4 font-medium ${(card.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatAutoCurrency(card.net || 0, card.currency)}
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center">
                                                                        <EditCards
                                                                            card={card}
                                                                            onClose={() => setSelectedCard(null)} />
                                                                    </div>
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
        </div>
    );
}
