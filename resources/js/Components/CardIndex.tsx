import React, { useState } from "react";
import { EyeIcon, EyeClosedIcon } from "lucide-react";

interface CardIndexProps {
    currency: string;
    balance: string | number;
    eyesOpen: boolean;
}

export default function CardIndex({
    currency,
    balance,
}: CardIndexProps) {
    const [eyesOpen, setEyesOpen] = useState(false);

    return (
        <div className="w-40 h-16 items-center bg-gradient-to-b from-[#808080]/10 to-[#FF5050]/10 rounded-lg mt-5">
            <div className="flex flex-col items-start p-3">
                <h1 className="font-semibold text-lg">{currency}</h1>
                <div className="flex items-center gap-5">
                    <p className="leading-none">{eyesOpen ? balance : "••••••••"}</p>
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
