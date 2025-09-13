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
    eyesOpen: boolean
}

export default function CardIndex({ id, currency, balance }: CardIndexProps) {
    const [eyesOpen, setEyesOpen] = useState(false);

    const handleDelete = () => {
        router.delete(route("cards.destroy", {card: id}));
    };

    return (
        <div className="w-40 h-16 items-center bg-gradient-to-b from-[#808080]/10 to-[#FF5050]/10 rounded-lg mt-5">
            <div className="flex flex-col items-start p-3">
                <div className="flex items-center justify-between gap-10">
                    <h1 className="font-semibold text-lg">{currency}</h1>

                    <AlertDialog>
  <AlertDialogTrigger asChild>
    <button className="hover:bg-black/5 transition-all duration-300 ease-in-out rounded-full w-5 h-5 flex items-center justify-center">
      <TrashIcon size={15} color={"red"} />
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Hapus kartu ini?</AlertDialogTitle>
      <AlertDialogDescription>
        Aksi ini tidak bisa dibatalkan. Kartu dan datanya akan dihapus permanen.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction asChild>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Hapus
        </button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

                </div>

                <div className="flex items-center gap-5">
                    <p className="leading-none">
                        {eyesOpen ? Number(balance).toLocaleString("id-ID") : "••••••••"}
                    </p>
                    <button onClick={() => setEyesOpen(!eyesOpen)}>
                        {eyesOpen ? (
                            <EyeIcon className="h-4 w-4 text-gray-600" />
                        ) : (
                            <EyeClosedIcon className="h-4 w-4 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
