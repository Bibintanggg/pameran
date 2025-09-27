import { ChevronsRightLeftIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { usePage, router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

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

    const [rate, setRate] = useState<number | null>(null)
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

    const { toast } = useToast()

    const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = { 'indonesian_rupiah': 'Rp', 'baht_thailand': '฿', 'as_dollar': '$' }
        return symbols[currency] || 'Rp'
    }

    const fetchRate = async (from: string, to: string, amount: number) => {
        try {
            const res = await fetch(
                `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_e3wEN2sdrsUSaopn8LY0C6GNk4uMBvs0kpBtSKD6&currencies=${to}&base_currency=${from}`
            )
            const data = await res.json()
            const rateValue = data.data[to]
            setRate(rateValue)
            setConvertedAmount(amount * rateValue)
        } catch (error) {
            console.error("Failed to fetch rate:", error)
        }
    }

    useEffect(() => {
        if (fromCard && toCard && amount) {
            const currencyMap: Record<string, string> = { 'indonesian_rupiah': "IDR", 'baht_thailand': "THB", 'as_dollar': "USD" }
            fetchRate(currencyMap[fromCard.currency], currencyMap[toCard.currency], parseFloat(amount))
        }
    }, [fromCard, toCard, amount])


    const formatBalance = (balance: number, currency: string) =>
        `${getCurrencySymbol(currency)} ${balance.toLocaleString()}`

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!fromCard || !toCard || !amount) return

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
                setIsOpen(false)
                toast({
                    title: "Success!",
                    description: "Your convert has been saved successfully."
                })
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: "Please check the required fields.",
                    variant: "destructive",
                })
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
                    <ChevronsRightLeftIcon opacity={54} size={32} />
                    <p className="text-white text-sm font-semibold">{label}</p>
                </button>
            </DialogTrigger>

            <DialogContent className="w-96">
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

                    {convertedAmount && toCard && (
                        <p className="text-sm text-green-600 mt-2">
                            You will get {getCurrencySymbol(toCard.currency)} {convertedAmount.toLocaleString()}
                            {" "} (rate: {rate})
                        </p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Convert
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
