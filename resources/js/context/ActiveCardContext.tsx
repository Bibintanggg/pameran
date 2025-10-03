
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ActiveCardContextProps {
    activeCardId: number | null;
    setActiveCardId: (id: number | null) => void;
}

const ActiveCardContext = createContext<ActiveCardContextProps | undefined>(undefined);

export const ActiveCardProvider = ({ children, cards }: {
    children: ReactNode;
    cards: Array<{ id: number }>;
}) => {
    const [activeCardId, setActiveCardId] = useState<number | null>(null);

    // Load dari localStorage saat mount - HANYA SEKALI
    useEffect(() => {
        const saved = localStorage.getItem('activeCardId');
        if (saved) {
            const savedId = parseInt(saved);
            // Validasi savedId ada di cards
            if (cards?.some(card => card.id === savedId)) {
                setActiveCardId(savedId);
                return; // Keluar, jangan set default
            }
        }

        // Default ke card pertama hanya jika tidak ada saved value
        if (cards && cards.length > 0) {
            setActiveCardId(cards[0].id);
        }
    }, []); // HAPUS cards dari dependency

    // Persist activeCardId ke localStorage
    useEffect(() => {
        if (activeCardId !== null) {
            localStorage.setItem('activeCardId', activeCardId.toString());
        }
    }, [activeCardId]);

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
