import React, { useState } from "react";
import { EyeIcon, EyeClosedIcon, TrashIcon } from "lucide-react";
import { router } from "@inertiajs/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/Components/ui/alert-dialog";

interface CardIndexProps {
    id: number;
    currency: string;
    balance: string | number;
    eyesOpen: boolean;
}

export default function CardIndex({ id, currency, balance }: CardIndexProps) {
    const [eyesOpen, setEyesOpen] = useState(false);

    const handleDelete = () => {
        router.delete(route("cards.destroy", { card: id }));
    };

    return (
        <div className="w-72 h-36 bg-gradient-to-br font-mono from-purple-500 via-pink-500 to-red-500 rounded-2xl
        shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -left-3 -bottom-3 w-20 h-20 bg-white/10 rounded-full"></div>

            <div className="relative h-full flex flex-col justify-between p-5 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full
                        flex items-center justify-center">
                            <span className="text-lg font-bold">{currency.charAt(0)}</span>
                        </div>
                        <h1 className="font-bold text-xl">{currency}</h1>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm hover:bg-red-500/30 transition-all duration-300 rounded-full flex items-center justify-center cursor-pointer">
                                <TrashIcon size={16} />
                            </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. The card and its data will be permanently deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div>
                    <p className="text-white/80 text-sm mb-2 mt-2">Balance</p>
                    <div className="flex items-center justify-between">
                        <p className="text-xl font-bold tracking-tight">
                            {eyesOpen ? Number(balance).toLocaleString("id-ID") : "••••••••"}
                        </p>
                        <button
                            onClick={() => setEyesOpen(!eyesOpen)}
                            className="w-9 h-9 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-full flex items-center justify-center"
                        >
                            {eyesOpen ? (
                                <EyeIcon className="h-4 w-4" />
                            ) : (
                                <EyeClosedIcon className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
