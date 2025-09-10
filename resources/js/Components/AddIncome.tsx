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
import { PlusIcon, PlusSquareIcon } from "lucide-react"

interface IncomeProps {
    label: string
}


export default function AddIncome({
    label
}: IncomeProps) {
    return (
        <div className="">
            <div className="flex items-center justify-center flex-col">
                <Dialog>
                <DialogTrigger asChild>

                <button className="flex flex-col items-center">
                    <PlusSquareIcon opacity={54} size={32} />
                    <p className="text-white text-sm font-semibold">{label}</p>
                </button>
            {/* <Dialog> */}

                </DialogTrigger>

                <DialogContent className="w-96 rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-start">Add {label}</DialogTitle>
                        <DialogDescription className="text-start">
                            Fill in the details below to create a new card, then click Save when you're done.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-3">
                        <div className="flex items-center gap-5">
                            <p>Select Currency</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full text-black/50 flex">Select Your Currency</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">

                                    <DropdownMenuLabel>Select Your Currency</DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            IDR - Indonesian Rupiah
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            THB - Baht Thailand
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            USD - Dollar AS
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-8">
                            <p>Card Number</p>
                            <input
                                type="number"
                                placeholder={`example. 6203... (min 10digit)`}
                                className="w-full border border-black/10 rounded p-2"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <button className="w-20 bg-red-600 text-white py-2 rounded-lg justify-end items-end">
                                Back
                            </button>

                            <button className="w-40 bg-slate-900 text-white py-2 rounded-lg justify-end items-end">
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
