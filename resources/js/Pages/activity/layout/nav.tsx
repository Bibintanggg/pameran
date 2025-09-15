import BottomNavbar from "@/Components/BottomNavbar";
import { ChartContent } from "@/Components/ChartContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const chartDataAll = [
        { browser: "Chrome", visitors: 275 },
        { browser: "Safari", visitors: 200 },
    ]
    const chartDataIncome = [
        { browser: "Income1", visitors: 150 },
        { browser: "Income2", visitors: 120 },
    ]
    const chartDataExpense = [
        { browser: "Expense1", visitors: 90 },
        { browser: "Expense2", visitors: 60 },
    ]
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                <BottomNavbar />

                <div className="flex flex-col p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex flex-col items-center leading-normal">
                            <h1 className="text-2xl font-semibold">Activity</h1>
                            <p className="text-sm font-medium text-black/50">Statistic</p>
                        </div>

                        <button onClick={() => router.visit(route("profile.edit"))}>
                            <SettingsIcon className="h-6 w-6 text-gray-600" />
                        </button>
                    </div>
                    <hr className="w-full h-0.5 bg-black/20 mt-2" />
                </div>

                <div className="flex items-center justify-center gap-7 text-lg font-medium">
                    <button
                        onClick={() => router.visit(route('activity.index'))}
                        className={`${route().current('activity.index') ? 'text-blue-500' : 'text-black'}`}
                    >
                        All
                    </button>

                    <button
                        onClick={() => router.visit(route('activity.income'))}
                        className={`${route().current('activity.income') ? 'text-blue-500' : 'text-black'}`}
                    >
                        Income
                    </button>

                    <button
                        onClick={() => router.visit(route('activity.expense'))}
                        className={`${route().current('activity.expense') ? 'text-blue-500' : 'text-black'}`}
                    >
                        Expense
                    </button>
                </div>

                <ChartContent data={chartDataAll} />
            </div>
        </div>
    )
}
