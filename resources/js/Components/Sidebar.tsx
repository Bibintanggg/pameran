import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { router, usePage } from "@inertiajs/react"
import { currencyMap, formatCurrency } from "@/utils/formatCurrency"
import {
    Wallet,
    Activity,
    CreditCard,
    TrendingUp,
    SettingsIcon,
    EyeIcon,
    EyeClosedIcon,
    LogOut,
    User,
    ChevronDown,
} from "lucide-react"
import clsx from "clsx"
import { useActiveCard } from "@/context/ActiveCardContext"
import { useState, useRef, useEffect } from "react" // Import tambahan untuk dropdown

type SidebarProps = {
    auth: {
        user: {
            name: string
            avatar?: string
        }
    }
    activeCard?: {
        name?: string
        balance?: number
        currency?: string
    }
    EyesOpen: boolean
    setEyesOpen: (open: boolean) => void
    incomePerCard: Record<string | number, number>
    expensePerCard: Record<string | number, number>
}

export default function Sidebar({
    auth,
    activeCard,
    EyesOpen,
    setEyesOpen,
    incomePerCard,
    expensePerCard,
}: SidebarProps) {
    const { url } = usePage()
    const { activeCardId } = useActiveCard();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Handle klik di luar dropdown untuk menutupnya
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const navigateWithCard = (href: string) => {
        const urlObj = new URL(href, window.location.origin)
        if (activeCardId) {
            urlObj.searchParams.set("card", String(activeCardId))
        }
        router.visit(urlObj.pathname + urlObj.search)
    }

    const getAvatarUrl = () => {
    return auth.user.avatar ? `/storage/${auth.user.avatar}` : "/default-avatar.png"
}

    const getUserInitials = () => {
        const names = auth.user.name.split(" ")
        if (names.length >= 2) return names[0][0] + names[names.length - 1][0]
        return names[0][0]
    }

    const handleLogout = () => {
        router.post(route('logout'))
    }

    const linkClass = (href: string) =>
        clsx(
            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all w-full text-left",
            url.startsWith(href)
                ? "text-white bg-gradient-to-r from-[#9290FE] to-[#7A78D1] shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )

    return (
        <div className="w-80 bg-white shadow-sm border-r border-gray-100 flex flex-col">
            {/* Header */}
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

            {/* User Info dengan Dropdown */}
            <div className="p-6 border-b border-gray-100 relative" ref={dropdownRef}>
                <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <Avatar className="h-14 w-14 ring-4 ring-blue-50">
                        <AvatarImage src={getAvatarUrl()} alt={auth.user.name} />
                        <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                            {getUserInitials()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                            Hello {auth.user.name.split(" ")[0]}
                        </h3>
                        <p className="text-sm text-gray-500">{auth.user.name}</p>
                    </div>
                    <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-6 right-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false)
                                navigateWithCard(route("profile.edit"))
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Card Info */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">My Card</h3>
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm opacity-80 mb-2">
                            {activeCard?.name || "Select a card"}
                        </p>
                        <p className="text-3xl font-bold">
                            {EyesOpen
                                ? formatCurrency(
                                    activeCard?.balance ?? 0,
                                    currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
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

            {/* Financial Record */}
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">
                    Financial Record
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Income</span>
                        <span className="font-semibold text-green-600">
                            {formatCurrency(
                                incomePerCard[activeCardId] ?? 0,
                                currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Expense</span>
                        <span className="font-semibold text-red-500">
                            {formatCurrency(
                                expensePerCard[activeCardId] ?? 0,
                                currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-800">Balance</span>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(
                                (incomePerCard[activeCardId] ?? 0) -
                                (expensePerCard[activeCardId] ?? 0),
                                currencyMap[activeCard?.currency ?? 'indonesian_rupiah']
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={() => navigateWithCard("/home")}
                            className={linkClass("/home")}
                        >
                            <Activity className="h-5 w-5" />
                            Overview
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => navigateWithCard("/all-activity")}
                            className={linkClass("/all-activity")}
                        >
                            <TrendingUp className="h-5 w-5" />
                            Analytics
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => navigateWithCard("/cards")}
                            className={linkClass("/cards")}
                        >
                            <CreditCard className="h-5 w-5" />
                            Cards
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => navigateWithCard(route("profile.edit"))}
                            className={linkClass("/profile")}
                        >
                            <SettingsIcon className="h-5 w-5" />
                            Settings
                        </button>
                    </li>
                </ul>
            </nav>

            <footer className='flex flex-col leading-[0.50rem]'>
                <p className="flex justify-center pb-4 text-black/30">
                    © 2025 Bintang Yudha
                </p>
                <a href="https://instagram.com/bintang.ydha_" target="_blank" className="flex justify-center pb-4 text-black/30">
                    instagram? click on this text
                </a>
            </footer>
        </div>
    )
}
