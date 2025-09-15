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

interface ExpenseProps {
    label: string,
    activeCardId: number
}


export default function AddExpense({
    label,
    activeCardId
}: ExpenseProps) {
    const [date, setDate] = React.useState<Date>()
    const [asset, setAsset] = React.useState<string>("")
    const [category, setCategory] = React.useState<string>("")
    const [isOpen, setIsOpen] = React.useState(false)

    const {data, setData, post, processing, errors, reset} = useForm({
        'transaction_date': '',
        'amount': 0,
        'notes': '',
        'asset': 0,
        'category': 0,
        'type': 2, // expense
        'to_cards_id': activeCardId
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('transactions.store-expense'), {
            onSuccess: () => {
                setDate(undefined); 
                setIsOpen(false)
                reset();
            }
        })
    }

    //helper
    const getAssetLabel = (value: number) => {
            switch(value) {
                case 1: return "Cash";
                case 2: return "Transfer";
                default: return "Select Your Asset";
            }
        }
    
    const getCategoryLabel = (value: number) => {
        switch(value) {
            case 4 : return "Food & Drinks"
            case 5 : return "Transportation"
            case 7 : return "Health"
            case 8 : return "Shopping"
            case 9 : return "Savings & Investments"
            case 10 : return "Travel"
            default: return  "Pick your category"
        }
    }

    return (
        <div className="">
            <div className="flex items-center justify-center flex-col">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center">
                            <PlusSquareIcon opacity={54} size={32} />
                            <p className="text-white text-sm font-semibold">{label}</p>
                        </button>
                    </DialogTrigger>

                    <DialogContent className="w-96 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-start">Add Expense</DialogTitle>
                            <DialogDescription className="text-start">
                                Add your income details here, then click Save when finished.
                            </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-3" onSubmit={handleSubmit}>
                            <div className="flex gap-4 flex-col">
                                <div className="flex items-center gap-4">
                                <p className="w-24">Date*</p>
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
                                            setDate(d)
                                            setData('transaction_date', d ? d.toISOString().split("T")[0] : "")
                                        }} />
                                    </PopoverContent>
                                </Popover>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Amount*</p>
                                <input
                                    type="number"
                                    value={data.amount || ''}
                                    onChange={(e) => setData("amount", Number(e.target.value))}
                                    placeholder="example. 100000"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Notes</p>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Optional"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:justify-start placeholder:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Asset*</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                            {getAssetLabel(data.asset)}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        {/* <DropdownMenuLabel>Select Your Asset</DropdownMenuLabel> */}
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setData("asset", 1)}>Cash</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("asset", 2)}>Transfer</DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="w-24">Category*</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                            {getCategoryLabel(data.category)}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="start">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setData("category", 4)}>Food & Drinks</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", 5)}>Transportation</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", 7)}>Health</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", 8)}>Shopping</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", 9)}>Savings & Investments</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setData("category", 10)}>Travel</DropdownMenuItem>
                                            {/* <DropdownMenuItem onClick={() => setData("category")}>Others</DropdownMenuItem> */}
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <p>{errors.amount && (
                                    <span className="text-red-500 text-sm">{errors.amount}</span>
                                )}
                                </p>

                                <p>
                                    {errors.transaction_date && (
                                    <span className="text-red-500 text-sm">{errors.transaction_date}</span>
                                )}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <button 
                                type="button" 
                                onClick={() => setIsOpen(false)}
                                className="w-20 bg-red-600 text-white py-2 rounded-lg justify-end items-end">
                                    Back
                                </button>

                                <button 
                                type="submit" 
                                disabled={processing}
                                className="w-40 bg-slate-900 text-white py-2 rounded-lg justify-end items-end">
                                    {processing ? "Savings..." : "Save changes"}
                                </button>
                                </div>
                        </form>

                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
