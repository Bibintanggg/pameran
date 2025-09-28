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
    const { data, setData, put, errors, processing, reset } = useForm({
        name: card.name,
        card_number: card.card_number,
    })

    const [open, setOpen] = useState(false)

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation()
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        onClose()
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        put(route('cards.update', card.id), {
            onSuccess: () => {
                reset()
                handleClose()
                toast({
                    title: "Success!",
                    description: "Your card has been updated successfully.",
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

    // Tambahkan handler untuk mencegah dialog close saat click di dalam content
    const handleDialogContentClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <>
            <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 cursor-pointer"
                onClick={handleOpen} // Sudah diubah untuk include stopPropagation
            >
                <Edit className="w-4 h-4 text-gray-600" />
                <span>Edit Cards</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="w-96 rounded-lg"
                    onClick={handleDialogContentClick} // Tambahkan ini
                >
                    <DialogHeader>
                        <DialogTitle className="text-start">Edit Cards</DialogTitle>
                        <DialogDescription className="text-start">
                            Fill in the details below to edit your card, then click Save when you're done.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Card Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g., My Card"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()} // Tambahkan ini
                            />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Card Number</label>
                            <input
                                type="text"
                                value={data.card_number}
                                onChange={(e) => setData('card_number', e.target.value)}
                                placeholder="e.g., 6203... (min 10 digits)"
                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={19}
                                onClick={(e) => e.stopPropagation()} // Tambahkan ini
                            />
                            {errors.card_number && <p className="text-red-500 text-xs">{errors.card_number}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-20 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
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
