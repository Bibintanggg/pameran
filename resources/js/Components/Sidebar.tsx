import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { router } from "@inertiajs/react"
import { currencyMap, formatCurrency } from "@/utils/formatCurrency"
import { Wallet, Activity, CreditCard, TrendingUp, SettingsIcon, EyeIcon, EyeClosedIcon } from "lucide-react"

type SidebarProps = {
    auth: {
        user: {
            name: string;
            avatar?: string;
        };
    };
    activeCard?: {
        name?: string;
        balance?: number;
        currency?: number;
    };
    activeCardId: string | number;
    EyesOpen: boolean;
    setEyesOpen: (open: boolean) => void;
    incomePerCard: Record<string | number, number>;
    expensePerCard: Record<string | number, number>;
};

export default function Sidebar({
    auth, activeCard, activeCardId, EyesOpen, setEyesOpen,
    incomePerCard, expensePerCard
}: SidebarProps) {
    const getAvatarUrl = () => {
        if (auth.user.avatar) return `/storage/${auth.user.avatar}`;
        return '/default-avatar.png';
    };

    const getUserInitials = () => {
        const names = auth.user.name.split(' ');
        if (names.length >= 2) return names[0][0] + names[names.length - 1][0];
        return names[0][0];
    };

    return (
        <div className="w-80 bg-white shadow-sm border-r border-gray-100 flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#9290FE] to-[#7A78D1] rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-gray-900">Finance Manager</h2>
                        <p className="text-xs text-gray-500">Financial Record</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-4 ring-blue-50">
                        <AvatarImage src={getAvatarUrl()} alt={auth.user.name} />
                        <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                            {getUserInitials()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">Hello {auth.user.name.split(' ')[0]}</h3>
                        <p className="text-sm text-gray-500">{auth.user.name}</p>
                    </div>
                </div>
            </div>

            {/* My Card Section */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">My Card</h3>
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm opacity-80 mb-2">{activeCard?.name || 'Select a card'}</p>
                        <p className="text-3xl font-bold">
                            {EyesOpen
                                ? formatCurrency(
                                    activeCard?.balance ?? 0,
                                    currencyMap[activeCard?.currency ?? 1]
                                )
                                : "••••••••"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setEyesOpen(!EyesOpen)}
                            className="text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        >
                            {EyesOpen ? (
                                <>
                                    <EyeIcon className="w-4 h-4 inline mr-1" />
                                    Hide
                                </>
                            ) : (
                                <>
                                    <EyeClosedIcon className="w-4 h-4 inline mr-1" />
                                    Show
                                </>
                            )}
                        </button>
                        <p className="text-xs opacity-60">•••• •••• •••• 8889</p>
                    </div>

                    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10"></div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white/5"></div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Financial Record</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Income</span>
                        <span className="font-semibold text-green-600">
                            {formatCurrency(incomePerCard[activeCardId] ?? 0, currencyMap[activeCard?.currency ?? 1])}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Expense</span>
                        <span className="font-semibold text-red-500">
                            {formatCurrency(expensePerCard[activeCardId] ?? 0, currencyMap[activeCard?.currency ?? 1])}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-800">Balance</span>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(
                                (incomePerCard[activeCardId] ?? 0) - (expensePerCard[activeCardId] ?? 0),
                                currencyMap[activeCard?.currency ?? 1]
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
                <ul className="space-y-2">
                    <li>
                        <a href="/home" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#9290FE] to-[#7A78D1] rounded-xl shadow-md">
                            <Activity className="h-5 w-5" />
                            Overview
                        </a>
                    </li>
                    <li>
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                            <CreditCard className="h-5 w-5" />
                            Cards
                        </a>
                    </li>
                    <li>
                        <a href="/all-activity" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                            <TrendingUp className="h-5 w-5" />
                            Analytics
                        </a>
                    </li>
                    <li>
                        <button
                            onClick={() => router.visit(route("profile.edit"))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <SettingsIcon className="h-5 w-5" />
                            Settings
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
