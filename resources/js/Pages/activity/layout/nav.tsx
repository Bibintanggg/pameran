import BottomNavbar from "@/Components/BottomNavbar";
import { ChartContent } from "@/Components/ChartContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function ActivityNavbar() {
    return (
        <div className="flex items-center justify-center gap-7 text-lg font-medium mb-6">
            <button onClick={() => router.visit(route('activity.index'))} className="pb-2 border-b-2 text-blue-500 border-blue-500">
                All
            </button>
            <button onClick={() => router.visit(route('activity.income'))} className="pb-2 border-b-2 text-gray-500 border-transparent hover:text-gray-700">
                Income
            </button>
            <button className="pb-2 border-b-2 text-gray-500 border-transparent hover:text-gray-700">
                Expense
            </button>
        </div>
    )
}
