"use client"
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Eye, Copy, Trash2, MoreVertical, CreditCard, CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/Components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/Components/ui/alert-dialog";
import EditCards from "./EditCards";

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

type CardComponentProps = {
    card: Card;
    isDesktop?: boolean;
    eyesOpen: boolean;
    onViewDetails: (cardId: number) => void;
    onDeleteCard: (cardId: number) => void;
    formatAutoCurrency: (amount: number, currencyId?: string) => string;
    getCurrencyLabel: (value: string) => string;
    dropdownRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
    buttonRefs: React.MutableRefObject<{ [key: number]: HTMLButtonElement | null }>;
    selectedCard: number | null;
    setSelectedCard: (cardId: number | null) => void;
};

export type CardComponentRef = {
    resetAlert: () => void;
};

const CardComponent = forwardRef<CardComponentRef, CardComponentProps>(({
    card,
    isDesktop = false,
    eyesOpen,
    onViewDetails,
    onDeleteCard,
    formatAutoCurrency,
    getCurrencyLabel,
    dropdownRefs,
    buttonRefs,
    selectedCard,
    setSelectedCard
}, ref) => {
    const [showAlert, setShowAlert] = useState(false);
    const alertTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectedCard === card.id) {
                const dropdown = dropdownRefs.current[card.id];
                const button = buttonRefs.current[card.id];
                const target = event.target as HTMLElement;

                // Jangan close jika klik di dalam dialog/modal atau overlay
                const isInsideDialog = target.closest('[role="dialog"]') ||
                    target.closest('[data-radix-dialog-overlay]') ||
                    target.closest('[data-state="open"]');

                if (isInsideDialog) {
                    return;
                }

                if (dropdown && !dropdown.contains(target) &&
                    button && !button.contains(target)) {
                    setSelectedCard(null);
                }
            }
        };

        if (selectedCard === card.id) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCard, card.id, setSelectedCard]);

    useImperativeHandle(ref, () => ({
        resetAlert: () => {
            setShowAlert(false);
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
        }
    }));

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedCard(selectedCard === card.id ? null : card.id);
    };

    const copyCardNumber = async (cardNumber: string) => {
        await navigator.clipboard.writeText(cardNumber);

        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
        }

        setShowAlert(true);
        setSelectedCard(null);

        alertTimeoutRef.current = setTimeout(() => {
            setShowAlert(false);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {showAlert && (
                <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-right-full duration-300">
                    <Alert className="bg-green-50 border-green-200 shadow-lg">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 text-sm font-medium">Success!</AlertTitle>
                        <AlertDescription className="text-green-700 text-xs">
                            Card number for <strong>{card.name}</strong> copied to clipboard!
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <div className={`relative ${isDesktop ? 'h-48' : 'h-40'} rounded-2xl shadow-lg overflow-visible transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${selectedCard === card.id ? 'z-50' : 'z-0'}`}>
                <div
                    className="absolute inset-0 p-6 flex flex-col justify-between text-white rounded-2xl overflow-hidden"
                    style={{ background: card.color }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm opacity-80">{getCurrencyLabel(card.currency)}</p>
                            <h3 className="text-lg font-bold">{card.name}</h3>
                        </div>
                        <button
                            ref={el => buttonRefs.current[card.id] = el}
                            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors z-10 relative"
                            onClick={handleMenuClick}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    <div>
                        <p className="text-sm opacity-80 mb-2">{card.card_number}</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm opacity-80">Balance</p>
                                <p className="text-2xl font-medium">
                                    {eyesOpen ? formatAutoCurrency(card.balance, card.currency) : "****"}
                                </p>
                            </div>
                            <CreditCard className="w-8 h-8 opacity-60" />
                        </div>
                    </div>
                </div>

                {selectedCard === card.id && (
                    <div
                        ref={el => dropdownRefs.current[card.id] = el}
                        className="absolute top-12 right-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40 min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(card.id);
                                setSelectedCard(null); // Tutup dropdown setelah action
                            }}
                        >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                        </button>

                        <EditCards
                            card={card}
                            onClose={() => setSelectedCard(null)}
                        />

                        <button
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                copyCardNumber(card.card_number);
                            }}
                        >
                            <Copy className="w-4 h-4" />
                            Copy Number
                        </button>

                        <hr className="my-2" />

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Card
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Card</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete "{card.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedCard(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            onDeleteCard(card.id);
                                            setSelectedCard(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </>
    );
});

CardComponent.displayName = 'CardComponent';

export default CardComponent;
