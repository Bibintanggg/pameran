"use client"
import BottomNavbar from "@/Components/BottomNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import Navbar from "./layout/nav";
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/Components/ui/chart"

export const description = "A pie chart with no separator"

export default function Activity() {
    // const [page, setPage] = useState('Income');
    const [toggleButton, setToggleButton] = useState('income');

    return (
        <div className="flex flex-col">
            <Navbar />


        </div>
    )
}
