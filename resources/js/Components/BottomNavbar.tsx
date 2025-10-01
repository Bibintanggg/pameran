import { BarChart3, CreditCard, Home, PlusSquare, Settings, TrendingUp, X, ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react"
import { Link, usePage, router } from "@inertiajs/react"
import { useState } from "react"
import AddIncome from "@/Components/AddIncome"
import AddExpense from "@/Components/AddExpense"
import AddConvert from "@/Components/AddConvert"

export default function BottomNavbar({ activeCardId }: { activeCardId: number | null }) {
    const { url } = usePage()
    const [isMenuOpen, setIsMenuOpen] = useState(false)


    const data = [
        { icon: <Home className="w-6 h-6" />, path: "/home" },
        { icon: <TrendingUp className="w-6 h-6" />, path: "/all-activity" },
        { icon: <PlusSquare className="w-6 h-6" />, path: null, isModal: true },
        { icon: <CreditCard className="w-6 h-6" />, path: "/cards" },
        { icon: <Settings className="w-6 h-6" />, path: "/profile" },
    ]

    return (
        <>
            <nav className=" fixed bottom-0 left-0 right-0 bg-white border-t 
            border-gray-200 shadow-md z-[60] max-w-sm mx-auto">
                <ul className="flex justify-around items-center h-16">
                    {data.map((item, idx) => (
                        <li key={idx}>
                            {item.isModal ? (
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`flex flex-col items-center transition-all ${
                                        isMenuOpen
                                            ? "text-blue-500 transform rotate-45"
                                            : "text-gray-600 hover:text-blue-500"
                                    }`}
                                >
                                    {item.icon}
                                </button>
                            ) : (
                                item.path && (
                                    <Link
                                        href={item.path}
                                        className={`flex flex-col items-center ${
                                            url === item.path
                                                ? "text-blue-500"
                                                : "text-gray-600 hover:text-blue-500"
                                        }`}
                                    >
                                        {item.icon}
                                    </Link>
                                )
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-50"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {isMenuOpen && (
                <div className="fixed bottom-20 right-6 z-50 flex flex-col-reverse space-y-reverse space-y-3 max-w-sm">
                    <div
                        className="flex items-center space-x-3 animate-slide-in"
                        style={{ animationDelay: '0ms' }}
                    >
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                            Income
                        </span>
                        <div>
                            <AddIncome
                                label=""
                                activeCardId={activeCardId ?? 0}
                            />
                        </div>
                    </div>

                    <div
                        className="flex items-center space-x-3 animate-slide-in"
                        style={{ animationDelay: '50ms' }}
                    >
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                            Expense
                        </span>
                        <div>
                            <AddExpense
                                label=""
                                activeCardId={activeCardId ?? 0}
                            />
                        </div>
                    </div>

                    <div
                        className="flex items-center space-x-3 animate-slide-in"
                        style={{ animationDelay: '100ms' }}
                    >
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                            Convert
                        </span>
                        <div>
                            <AddConvert
                                label=""
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </>
    )
}
