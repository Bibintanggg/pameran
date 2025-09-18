import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ActiveCardContextProps {
    activeCardId: number | null;
    setActiveCardId: (id: number) => void;
}

const ActiveCardContext = createContext<ActiveCardContextProps | undefined>(undefined);

export const ActiveCardProvider = ({ children, cards }: {
    children: ReactNode;
    cards: Array<{ id: number }>;
}) => {
    // Inisialisasi dengan card pertama jika ada
    const [activeCardId, setActiveCardId] = useState<number | null>(
        cards && cards.length > 0 ? cards[0].id : null
    );

    // Persist activeCardId ke localStorage
    useEffect(() => {
        if (activeCardId !== null) {
            localStorage.setItem('activeCardId', activeCardId.toString());
        }
    }, [activeCardId]);

    // Load dari localStorage saat mount
    useEffect(() => {
        const saved = localStorage.getItem('activeCardId');
        if (saved && cards?.length) {  // tambah ?.length
            const savedId = parseInt(saved);
            if (cards.some(card => card.id === savedId)) {
                setActiveCardId(savedId);
            }
        }
    }, [cards]);


    return (
        <ActiveCardContext.Provider value={{ activeCardId, setActiveCardId }}>
            {children}
        </ActiveCardContext.Provider>
    );
};

export const useActiveCard = () => {
    const context = useContext(ActiveCardContext);
    if (!context) {
        throw new Error("useActiveCard must be used within an ActiveCardProvider");
    }
    return context;
};
