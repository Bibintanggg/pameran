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
import { useForm } from "@inertiajs/react"

interface IncomeProps {
    label: string
    activeCardId: number
}


export default function AddIncome({
    label,
    activeCardId
}: IncomeProps) {
    const [date, setDate] = React.useState<Date>()
    const [asset, setAsset] = React.useState<string>("")
    const [category, setCategory] = React.useState<string>("")
    const [amount, setAmount] = React.useState<number>(0)
    const [notes, setNotes] = React.useState<string>("")

    const {data, setData, post, processing, errors, reset} = useForm({
        'transaction_date': '',
        'amount': '',
        'notes': '',
        'asset': '',
        'category': '',
        'type': 1,
        'card_id': activeCardId
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('transactions.storeincome'), {
            ...data, 
            onSuccess: () => reset()
        })
    }

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

                        <form className="space-y-3" onSubmit={handleSubmit}>
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
                                            <span>{date ? date.toDateString() : "Pick a date"}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar 
                                        mode="single" 
                                        selected={date} 
                                        onSelect={(d) => {
                                            setDate(d),
                                            setData("transaction_date", d ? d.toISOString().split("T")[0] : "")
                                        }} />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Amount</p>
                                <input
                                    type="number"
                                    placeholder="example. 100000"
                                    value={data.amount}
                                    onChange={(e) => setData("amount", e.target.value)}
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Notes</p>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    placeholder="Optional"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:justify-start placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Asset</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                            {data.asset === "1" ? "Cash" : data.asset === "2" ? "Transfer" : "Select Your Asset"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        {/* <DropdownMenuLabel>Select Your Asset</DropdownMenuLabel> */}
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setData("asset", "1")}>Cash</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("asset", "2")}>Transfer</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Category</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                            {data.category || "Select Your Category Income"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setData("category", '1')}>Salary</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", '2')}>Allowance</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", '3')}>Bonus</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between">
                                <button className="w-20 bg-red-600 text-white py-2 rounded-lg justify-end items-end">
                                    Back
                                </button>

                                <button type="submit" className="w-40 bg-slate-900 text-white py-2 rounded-lg justify-end items-end">
                                    Save changes
                                </button>
                                </div>
                        </form>

                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
