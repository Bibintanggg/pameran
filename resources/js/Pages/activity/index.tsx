import BottomNavbar from "@/Components/BottomNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { router } from "@inertiajs/react";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import Navbar from "./layout/nav";

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
            <Navbar/>
    )
}
