import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/Components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Calendar } from "@/Components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover"

import { Button } from "./ui/button"
import { PlusIcon, PlusSquareIcon } from "lucide-react"
import { ChevronDownIcon } from "lucide-react"
import { Calendar as CalendarIcon } from "lucide-react"
import React from "react"

interface IncomeProps {
    label: string
}


export default function AddIncome({
    label
}: IncomeProps) {
    const [date, setDate] = React.useState<Date>()

    return (
        <div className="">
            <div className="flex items-center justify-center flex-col">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center">
                            <PlusSquareIcon opacity={54} size={32} />
                            <p className="text-white text-sm font-semibold">{label}</p>
                        </button>
                    </DialogTrigger>

                    <DialogContent className="w-96 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-start">Add Income</DialogTitle>
                            <DialogDescription className="text-start">
                                Add your income details here, then click Save when finished.
                            </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-3">
                            <div className="flex items-center gap-4">
                                <p className="w-24">Date</p>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            data-empty={!date}
                                            className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon />
                                            <span>Pick a date</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Amount</p>
                                <input
                                    type="number"
                                    placeholder="example. 100000"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Notes</p>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:justify-start placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Asset</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                            Select Your Asset
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        {/* <DropdownMenuLabel>Select Your Asset</DropdownMenuLabel> */}
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem>Cash</DropdownMenuItem>
                                            <DropdownMenuItem>Transfer</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Category</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex">
                                            Select Your Category Income
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem>Salary</DropdownMenuItem>
                                            <DropdownMenuItem>Allowance</DropdownMenuItem>
                                            <DropdownMenuItem>Bonus</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </form>

                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
