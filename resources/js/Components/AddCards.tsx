import { PlusIcon } from "lucide-react";

interface CardsProps {
    label: string;
}

export default function Cards({ label }: CardsProps) {
    return (
        <div className="mt-5">
            <div className="w-40 h-16 bg-[#808080]/10 rounded-lg flex items-center justify-between px-4">
                <div className="w-full flex items-center justify-between">

                    <div className=" flex items-center justify-center">
                        <p className="text-black text-lg font-semibold">{label}</p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#808080]/20 flex items-center justify-center">
                        <button>
                            <PlusIcon color="#215509" opacity={54} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
