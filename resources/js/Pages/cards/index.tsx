"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import Sidebar from "@/Components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
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
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import { useState } from "react";

export default function Cards() {
    const [eyesOpen, setEyesOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    // Static data untuk cards
    const staticCards = [
        {
            id: 1,
            name: "Main Wallet",
            card_number: "**** **** **** 1234",
            balance: 25000,
            currency: "USD",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            type: "Debit Card",
            income: 15000,
            expense: 8500
        },
        {
            id: 2,
            name: "Savings",
            card_number: "**** **** **** 5678",
            balance: 45000,
            currency: "USD",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            type: "Savings Account",
            income: 25000,
            expense: 3200
        },
        {
            id: 3,
            name: "Business Card",
            card_number: "**** **** **** 9012",
            balance: 18500,
            currency: "USD",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            type: "Business Account",
            income: 32000,
            expense: 15600
        },
        {
            id: 4,
            name: "Investment",
            card_number: "**** **** **** 3456",
            balance: 67500,
            currency: "USD",
            color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            type: "Investment Account",
            income: 45000,
            expense: 12800
        }
    ];

    const staticAuth = {
        user: {
            name: "John Doe",
            avatar: null
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getUserInitials = () => {
        const names = staticAuth.user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    const CardComponent = ({ card, isDesktop = false }) => (
        <div className={`relative ${isDesktop ? 'h-48' : 'h-40'} rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            <div 
                className="absolute inset-0 p-6 flex flex-col justify-between text-white"
                style={{ background: card.color }}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm opacity-80">{card.type}</p>
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
                                {eyesOpen ? formatCurrency(card.balance) : "****"}
                            </p>
                        </div>
                        <CreditCard className="w-8 h-8 opacity-60" />
                    </div>
                </div>
            </div>
            
            {/* Dropdown Menu */}
            {selectedCard === card.id && (
                <div className="absolute top-12 right-6 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Edit className="w-4 h-4" />
                        Edit Card
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Copy className="w-4 h-4" />
                        Copy Number
                    </button>
                    <hr className="my-2" />
                    <button className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600">
                        <Trash2 className="w-4 h-4" />
                        Delete Card
                    </button>
                </div>
            )}
        </div>
    );

    const StatsCard = ({ title, amount, change, icon, isPositive }) => (
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
            <p className="text-xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>
    );

    // Calculate totals
    const totalBalance = staticCards.reduce((sum, card) => sum + card.balance, 0);
    const totalIncome = staticCards.reduce((sum, card) => sum + card.income, 0);
    const totalExpense = staticCards.reduce((sum, card) => sum + card.expense, 0);
    const netIncome = totalIncome - totalExpense;

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
                                <div>
                                    <h2 className="font-semibold text-gray-900">My Cards</h2>
                                    <p className="text-sm text-gray-500">{staticCards.length} cards</p>
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
                                amount={totalBalance}
                                change={12.5}
                                icon={<Wallet className="w-5 h-5 text-blue-600" />}
                                isPositive={true}
                            />
                            <StatsCard 
                                title="Net Income"
                                amount={netIncome}
                                change={8.3}
                                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                                isPositive={true}
                            />
                        </div>

                        {/* Add Card Button */}
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 mb-6 flex items-center justify-center gap-3 transition-colors">
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Add New Card</span>
                        </button>

                        {/* Mobile Cards Grid */}
                        <div className="space-y-4">
                            {staticCards.map((card) => (
                                <CardComponent key={card.id} card={card} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={staticAuth}
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
                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                                        <Plus className="h-5 w-5" />
                                        <span className="font-medium">Add Card</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Desktop Cards Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Your Cards</h2>
                                    <p className="text-gray-500">{staticCards.length} cards total</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {staticCards.map((card) => (
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
                                                <th className="pb-3 font-medium text-gray-600">Type</th>
                                                <th className="pb-3 font-medium text-gray-600">Balance</th>
                                                <th className="pb-3 font-medium text-gray-600">Income</th>
                                                <th className="pb-3 font-medium text-gray-600">Expense</th>
                                                <th className="pb-3 font-medium text-gray-600">Net</th>
                                                <th className="pb-3 font-medium text-gray-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staticCards.map((card) => (
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
                                                    <td className="py-4 text-gray-600">{card.type}</td>
                                                    <td className="py-4 font-semibold text-gray-900">
                                                        {eyesOpen ? formatCurrency(card.balance) : "****"}
                                                    </td>
                                                    <td className="py-4 text-green-600 font-medium">
                                                        {formatCurrency(card.income)}
                                                    </td>
                                                    <td className="py-4 text-red-600 font-medium">
                                                        {formatCurrency(card.expense)}
                                                    </td>
                                                    <td className={`py-4 font-medium ${(card.income - card.expense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(card.income - card.expense)}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                                                <Edit className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                            <button className="p-1 hover:bg-red-50 rounded transition-colors">
                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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