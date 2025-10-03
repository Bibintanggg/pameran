import { useState } from 'react'
import { Edit } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/Components/ui/dialog"
import { useForm } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

type Card = {
    id: number;
    name: string;
    card_number: string;
    balance: number;
    currency: string;
    type: string;
    color: string;
    income: number;
    expense: number;
    net: number;
};

export default function EditCards({ card, onClose }: { card: Card; onClose: () => void }) {
    const { toast } = useToast()

    const extractCardNumber = (maskedNumber: string) => {
        if (maskedNumber.includes('****')) {
            return maskedNumber.replace('**** **** **** ', '');
        }
        return maskedNumber;
    }

    const { data, setData, put, errors, processing, reset } = useForm({
        name: card.name,
        card_number: extractCardNumber(card.card_number),
    })

    const [open, setOpen] = useState(false)

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation()
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        reset()
        onClose()
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        put(route('cards.update', { card: card.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "Your card has been updated successfully.",
                })
                setOpen(false)
                onClose()
                reset()
            },
            onError: (errors) => {
                toast({
                    title: "Error",
                    description: "Please check the required fields.",
                    variant: "destructive",
                })
            },
        })
    }

    // Handle card number input - format and validate
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        value = value.slice(0, 16); // Limit to 16 digits

        setData('card_number', value);
    }

    return (
        <>
            <button
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 cursor-pointer z-60"
                onClick={handleOpen}
            >
                <Edit className="w-4 h-4 text-gray-600" />
                <span>Edit Cards</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="w-96 rounded-lg"
                    onPointerDownOutside={(e) => {
                        e.preventDefault()
                    }}
                    onEscapeKeyDown={(e) => {
                        handleClose()
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle className="text-start">Edit Cards</DialogTitle>
                        <DialogDescription className="text-start">
                            Fill in the details below to edit your card, then click Save when you're done.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-3"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Card Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g., My Card"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoComplete="off"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Card Number</label>
                            <input
                                type="text"
                                value={data.card_number}
                                onChange={handleCardNumberChange}
                                placeholder="Enter 16-digit card number"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={16}
                                autoComplete="off"
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Current: {card.card_number}
                            </p>
                            {errors.card_number && <p className="text-red-500 text-xs">{errors.card_number}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClose()
                                }}
                                className="w-20 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                disabled={processing}
                            >
                                Back
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-40 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                                {processing ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
