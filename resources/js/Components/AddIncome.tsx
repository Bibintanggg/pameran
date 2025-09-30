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
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"
import { Calendar } from "@/Components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover"
import { Button } from "./ui/button"
import { PlusSquareIcon } from "lucide-react"
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
    const [isOpen, setIsOpen] = React.useState(false)

    const { toast } = useToast()

    const { data, setData, post, processing, errors, reset } = useForm({
        'transaction_date': '',
        'amount': 0,
        'notes': '',
        'asset': '',
        'category': '',
        'type': 'income',
        'to_cards_id': activeCardId
    })

    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    React.useEffect(() => {
        setData("to_cards_id", activeCardId)
    }, [activeCardId])

    React.useEffect(() => {
        if (!isOpen) {
            reset()
            setDate(undefined);
        }
    }, [isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('transactions.storeincome'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                setDate(undefined);
                toast({
                    title: "Success!",
                    description: "Your income has been saved successfully.",
                })
            },
            onError: (errors) => {
                // console.log('Validation errors:', errors);
                toast({
                    title: "Error",
                    description: "Please check the required fields.",
                    variant: "destructive",
                })
            }
        })
    }

    const getAssetLabel = (value: string) => {
        switch (value) {
            case 'cash': return "Cash";
            case 'transfer': return "Transfer";
            default: return "Select Your Asset";
        }
    }

    const getCategoryLabel = (value: string) => {
        switch (value) {
            case 'sallary': return "Salary";
            case 'allowance': return "Allowance";
            case 'business': return "Business";
            default: return "Select Your Category Income";
        }
    }

    return (
        <div className="flex items-center justify-center flex-col">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <button className="flex flex-col items-center">
                        <PlusSquareIcon opacity={54} size={32} color={"white"} />
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
                            <p className="w-24">Date *</p>
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
                                            setDate(d);
                                            setData("transaction_date", d ? formatDate(d) : "");
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="w-24">Amount *</p>
                            <input
                                type="number"
                                placeholder="example. 100000"
                                value={data.amount || ''}
                                onChange={(e) => setData("amount", Number(e.target.value))}
                                className="flex-1 border border-black/10 rounded-lg p-2 placeholder:text-sm"
                                min="1"
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
                            <p className="w-24">Asset *</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                        {getAssetLabel(data.asset)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={() => setData("asset", 'cash')}>Cash</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setData("asset", 'transfer')}>Transfer</DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="w-24">Category *</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="flex-1 text-black/50 flex justify-start">
                                        {getCategoryLabel(data.category)}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={() => setData("category", 'sallary')}>Salary</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setData("category", 'allowance')}>Allowance</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setData("category", 'business')}>Business</DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-col items-start">
                            {errors.category && (
                                <span className="text-red-500 text-sm">{errors.category}</span>
                            )}
                            {errors.transaction_date && (
                                <span className="text-red-500 text-sm">{errors.transaction_date}</span>
                            )}
                            {errors.amount && (
                                <span className="text-red-500 text-sm">{errors.amount}</span>
                            )}
                            {errors.asset && (
                                <span className="text-red-500 text-sm">{errors.asset}</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-20 bg-red-600 text-white py-2 rounded-lg"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-40 bg-slate-900 text-white py-2 rounded-lg disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
