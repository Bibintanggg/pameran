import { ChevronsRightLeftIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { usePage, router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

interface Card {
    id: number
    name: string
    balance: number
    currency: string
}

export default function AddConvert({ label }: { label: string }) {
    const { props }: any = usePage()
    const cards: Card[] = props.cards || []

    const [fromCard, setFromCard] = useState<Card | null>(null)
    const [toCard, setToCard] = useState<Card | null>(null)
    const [amount, setAmount] = useState("")
    const [notes, setNotes] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [rate, setRate] = useState<number | null>(null)
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
    const [isLoadingRate, setIsLoadingRate] = useState(false)

    const { toast } = useToast()

    const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = {
            'indonesian_rupiah': 'Rp',
            'baht_thailand': '฿',
            'as_dollar': '$',
            'riel_kamboja' : '៛'
        }
        return symbols[currency] || 'Rp'
    }

    const fetchRate = async (fromCardId: number, toCardId: number, amount: number) => {
        setIsLoadingRate(true)
        try {
            const response = await axios.post('/transactions/get-rate', {
                from_cards_id: fromCardId,
                to_cards_id: toCardId,
                amount: amount
            })

            setRate(response.data.rate)
            setConvertedAmount(response.data.converted_amount)
        } catch (error: any) {

            const errorMsg = error.response?.data?.error || "Failed to fetch exchange rate. Please try again."

            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive",
            })
            setRate(null)
            setConvertedAmount(null)
        } finally {
            setIsLoadingRate(false)
        }
    }

    useEffect(() => {
        if (fromCard && toCard && amount && parseFloat(amount) > 0) {
            const timeout = setTimeout(() => {
                fetchRate(fromCard.id, toCard.id, parseFloat(amount))
            }, 600)

            return () => clearTimeout(timeout)
        } else {
            setRate(null)
            setConvertedAmount(null)
        }
    }, [fromCard, toCard, amount])

    const formatBalance = (balance: number, currency: string) =>
        `${getCurrencySymbol(currency)} ${balance.toLocaleString()}`

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!fromCard || !toCard || !amount || !convertedAmount || !rate) {
            toast({
                title: "Error",
                description: "Please fill all required fields and wait for exchange rate.",
                variant: "destructive",
            })
            return
        }

        // Validasi balance
        if (fromCard.balance < parseFloat(amount)) {
            toast({
                title: "Insufficient Balance",
                description: `Your ${fromCard.name} balance is not enough.`,
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        router.post('/transactions/convert', {
            from_cards_id: fromCard.id,
            to_cards_id: toCard.id,
            amount: parseFloat(amount),
            converted_amount: convertedAmount,
            rate,
            notes
        }, {
            onSuccess: () => {
                setFromCard(null)
                setToCard(null)
                setAmount("")
                setNotes("")
                setRate(null)
                setConvertedAmount(null)
                setIsOpen(false)
                setIsSubmitting(false)
                toast({
                    title: "Success!",
                    description: "Your conversion has been saved successfully."
                })
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ') || "Please check the required fields."
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                })
                setIsSubmitting(false)
            }
        })
    }

    const CardDropdown = ({
        value,
        onChange,
        placeholder,
        excludeId
    }: {
        value: Card | null
        onChange: (card: Card) => void
        placeholder: string
        excludeId?: number
    }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    {value ? value.name : placeholder}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {cards
                    .filter(card => card.id !== excludeId)
                    .map(card => (
                        <DropdownMenuItem key={card.id} onClick={() => onChange(card)}>
                            <div>
                                <div className="font-medium">{card.name}</div>
                                <div className="text-sm text-gray-500">
                                    {formatBalance(card.balance, card.currency)}
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex flex-col items-center">
                    <ChevronsRightLeftIcon opacity={54} size={32} color="white"/>
                    <p className="text-white text-sm font-semibold">{label}</p>
                </button>
            </DialogTrigger>

            <DialogContent className="w-96" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Convert Money</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm mb-2 block">From</label>
                            <CardDropdown
                                value={fromCard}
                                onChange={setFromCard}
                                placeholder="Select source"
                                excludeId={toCard?.id}
                            />
                        </div>
                        <div>
                            <label className="text-sm mb-2 block">To</label>
                            <CardDropdown
                                value={toCard}
                                onChange={setToCard}
                                placeholder="Select destination"
                                excludeId={fromCard?.id}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm mb-2 block">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full p-2 border rounded-lg"
                            required
                        />
                        {fromCard && (
                            <p className="text-xs text-gray-500 mt-1">
                                Available: {formatBalance(fromCard.balance, fromCard.currency)}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm mb-2 block">Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes"
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    {isLoadingRate && (
                        <p className="text-sm text-blue-600">
                            Fetching exchange rate...
                        </p>
                    )}

                    {convertedAmount && toCard && !isLoadingRate && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700 font-medium">
                                You will receive: {getCurrencySymbol(toCard.currency)} {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                Exchange rate: 1 {fromCard?.currency} = {rate?.toFixed(4)} {toCard.currency}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsOpen(false)}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoadingRate || !convertedAmount || isSubmitting}
                        >
                            {isLoadingRate ? "Loading..." : "Convert"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
