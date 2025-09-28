import { Edit, PlusIcon } from "lucide-react"
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
import { AlertDialogHeader } from "./ui/alert-dialog"
import { Button } from "./ui/button"
import { useForm } from "@inertiajs/react"
import { Card } from "@/types/card"
import { useToast } from "@/hooks/use-toast"

export default function EditCards({ card }: {card: Card}) {
    const { toast } = useToast()
    const { data, setData, put, errors, processing, reset } = useForm({
        // 'currency': 'indonesian_rupiah',
        name: card.name,
        card_number: card.card_number,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        put(route('cards.update', card.id), {
            onSuccess: () => {
                reset()
                toast({
                    title: "Success!",
                    description: "Your card has been change successfully.",
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

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className={`w-4 h-4 rounded-full flex items-center justify-center`}>
                    <Edit className="w-4 h-4 text-gray-600" />
                </button>
            </DialogTrigger>

            <DialogContent className={`w-96 rounded-lg`}>
                <AlertDialogHeader>
                    <DialogTitle className="text-start">Edit Cards</DialogTitle>
                    <DialogDescription className="text-start">
                        Fill in the details below to create a new card, then click Save when you're done.
                    </DialogDescription>
                </AlertDialogHeader>

                <form className="space-y-3"
                    onSubmit={handleSubmit}
                >
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
                        <button
                            type="button"
                            className="w-20 bg-red-600 text-white py-2 rounded-lg justify-end items-end"
                            onClick={() => reset()}
                        >
                            Back
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-40 bg-slate-900 text-white py-2 rounded-lg justify-end items-end disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
