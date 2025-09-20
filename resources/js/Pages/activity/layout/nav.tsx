import BottomNavbar from "@/Components/BottomNavbar";
import { ChartContent } from "@/Components/ChartContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router, usePage } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function ActivityNavbar() {
    const { url } = usePage()

    const isActive = (path: string) => url.startsWith(path)

    return (
        <div className="flex items-center justify-center gap-7 text-lg font-medium mb-6">
            <button onClick={() => router.visit(route('all-activity'))}
                className={`pb-2 border-b-2 ${isActive("/all-activity")
                        ? "text-blue-500 border-blue-500"
                        : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}>
                All
            </button>
            <button onClick={() => router.visit(route('income.index'))}
            className={`pb-2 border-b-2 ${isActive("/activity/income")
                        ? "text-blue-500 border-blue-500"
                        : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}>
                Income
            </button>
            <button onClick={() => router.visit(route('expense.index'))}
            className={`pb-2 border-b-2 ${isActive("/activity/expense")
                        ? "text-blue-500 border-blue-500"
                        : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}>
                Expense
            </button>
        </div>
    )
}
