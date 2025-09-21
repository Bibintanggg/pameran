import { BarChart3, CreditCard, Home, PlusSquare, Settings, TrendingUp } from "lucide-react"
import { Link, usePage } from "@inertiajs/react"
// import Activity from "@/Pages/activity"

export default function BottomNavbar() {
    const { url } = usePage()

    const data = [
        { icon: <Home className="w-6 h-6" />, path: "/home" },
        { icon: <TrendingUp className="w-6 h-6" />, path: "/all-activity" },
        { icon: <PlusSquare className="w-6 h-6" />, path: "/tambah" },
        { icon: <CreditCard className="w-6 h-6" />, path: "/cards" },
        { icon: <Settings className="w-6 h-6" />, path: "/profile" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50 max-w-md mx-auto">
            <ul className="flex justify-around items-center h-16">
                {data.map((item, idx) => (
                    <li key={idx}>
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
                    </li>
                ))}
            </ul>
        </nav>
    )
}
