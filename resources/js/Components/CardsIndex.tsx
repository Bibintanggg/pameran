import React from "react";
import CardIndex from "./CardIndex";
// import CardIndex from "./CardIndex";

interface Card {
    id: number;
    currency: number;
    name: string;
    card_number?: string;
    balance: number;
    user_id: number;
}

interface Props {
    cards: Card[];
}

export default function CardsIndex({ cards }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
                <CardIndex
                    key={card.id}
                    id={card.id}
                    currency={card.currency.toString()}
                    balance={card.balance}
                    eyesOpen={true} // or set to false as needed
                />
            ))}
        </div>
    );
}
