import { PlusIcon } from "lucide-react"
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
import { Button } from "./ui/button"
import React from "react"
import { useForm } from "@inertiajs/react"

interface CardsProps {
    label: string
    className?: string
}

export default function Cards({ label, className }: CardsProps) {
    const [wallet, setWallet] = React.useState<string>("")
    const {data, setData, post, processing, errors, reset} = useForm({
        'currency': 'indonesian_rupiah',
        'name': '',
        'card_number': '',
        'balance': ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('cards.store'), {
            onSuccess: () => {
                reset()
            }
        })
    }

    //helper
    const getCurrencyLabel = (value: string) => {
        switch(value) {
            case 'indonesian_rupiah' : return 'Rupiah'
            case 'baht_thailand' : return 'THB - Baht Thailand'
            case 'as_dollar' : return 'USD - Dollar AS'
        }
    }

    return (
        <div className="mt-5">
            <div className="w-40 h-16 bg-[#808080]/10 rounded-lg flex items-center 
            justify-between px-4">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center justify-center">
                        <p className="text-black text-lg font-semibold">{label}</p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="w-10 h-10 rounded-full bg-[#808080]/20 flex 
                            items-center justify-center">
                                <PlusIcon color="#215509" opacity={54} />
                            </button>
                        </DialogTrigger>

                        <DialogContent className="w-96 rounded-lg">
                            <DialogHeader>
                                <DialogTitle className="text-start">Add {label}</DialogTitle>
                                <DialogDescription className="text-start">
                                    Fill in the details below to create a new card, then click Save when you're done.
                                </DialogDescription>
                            </DialogHeader>

                            <form className="space-y-3" onSubmit={handleSubmit}>
                                <div className="flex items-center gap-5">
                                    <p>Select Currency</p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full text-black/50 flex justify-start">
                                            {getCurrencyLabel(data.currency)}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="start">

                                            {/* <DropdownMenuLabel>Select Your Currency</DropdownMenuLabel> */}
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => setData("currency", 'indonesian_rupiah')}>
                                                    IDR - Indonesian Rupiah
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setData("currency", 'baht_thailand')}>
                                                    THB - Baht Thailand
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setData("currency", 'as_dollar')}>
                                                    USD - Dollar AS
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-8">
                                    <p>Card Name</p>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder={`example. IDR, THB, etc`}
                                        className="w-full border border-black/10 rounded p-2"
                                    />
                                </div>

                                <div className="flex items-center gap-8">
                                    <p>Card Number</p>
                                    <input
                                        type="number"
                                        value={data.card_number}
                                        onChange={(e) => setData('card_number', e.target.value)}
                                        placeholder={`example. 6203... (min 10digit)`}
                                        className="w-full border border-black/10 rounded p-2"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                <button className="w-20 bg-red-600 text-white py-2 rounded-lg justify-end items-end">
                                    Back
                                </button>

                                <button
                                type="submit"
                                className="w-40 bg-slate-900 text-white py-2 rounded-lg justify-end items-end">
                                    {processing ? "Saving..." : "Saving changes"}
                                </button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}
