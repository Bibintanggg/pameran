import { ChevronsRightLeftIcon, PlusIcon } from "lucide-react"
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

interface ConvertProps {
    label: string
}

export default function AddConvert({
    label
}: ConvertProps) {
    // const [date, setDate] = React.useState<Date>()
    // const [asset, setAsset] = React.useState<string>("")
    const [wallet, setWallet] = React.useState<string>("")
    const [toWallet, setToWallet] = React.useState<string>("")
    return (
        <div className="">
            <div className="flex items-center justify-center flex-col">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center">
                            <ChevronsRightLeftIcon opacity={54} size={32} />
                            <p className="text-white text-sm font-semibold">{label}</p>
                        </button>
                    </DialogTrigger>

                    <DialogContent className="w-96 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-start">Add Converter</DialogTitle>
                            <DialogDescription className="text-start">
                                Add your converter details here, then click Save when finished.
                            </DialogDescription>
                        </DialogHeader>

                        <form className="space-y-3">
                            <div className="flex items-center gap-4">
                                {/* From */}
                                <div className="flex flex-col w-1/2">
                                    <label className="text-sm mb-1">From</label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                                {wallet || "From"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="start">
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => setWallet("IDR - Rupiah")}>
                                                    IDR - Indonesian Rupiah
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setWallet("THB - Baht Thailand")}>
                                                    THB - Baht Thailand
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setWallet("USD - Dollar AS ")}>
                                                    USD - Dollar AS
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* To */}
                                <div className="flex flex-col w-1/2">
                                    <label className="text-sm mb-1">To</label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                                {toWallet || "To"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="start">
                                            <DropdownMenuGroup>
                                                <DropdownMenuItem onClick={() => setToWallet("IDR - Rupiah")}>
                                                    IDR - Indonesian Rupiah
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setToWallet("THB - Baht Thailand")}>
                                                    THB - Baht Thailand
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setToWallet("USD - Dollar AS ")}>
                                                    USD - Dollar AS
                                                </DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>


                            <div className="flex items-center gap-4">
                                <p className="w-24">Amount</p>
                                <input
                                    type="number"
                                    placeholder="example.. 100000"
                                    className="flex-1 border border-black/10 rounded-lg p-2 placeholder:justify-start placeholder:text-sm"
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
