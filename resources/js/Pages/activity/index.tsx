import BottomNavbar from "@/Components/BottomNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function Activity() {
    // const [page, setPage] = useState('Income');
    const [toggleButton, setToggleButton] = useState('income');

    const toggleView = (view: string) => {
        setToggleButton(view)
    }

    const [active, setActive] = useState(false)

    // const dataButton = [
    //     {id: 1, name: "Income"}
    //     {id: 2, name: "Income"}
    //     {id: , name: "Income"}
    // ]

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
                    <button>
                        All
                    </button>
                    <button>
                        Income
                    </button>
                    <button>
                        Expense
                    </button>
                </div>
            </div>
        </div>
    )
}
