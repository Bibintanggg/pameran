export interface Transaction {
    id: number;
    user_name: string;
    type: string;
    type_label: string;
    amount: number;
    formatted_amount: string;
    notes: string;
    asset: string;
    asset_label: string;
    currency: string;
    category: string;
    category_label: string;
    transaction_date: string;
    to_cards_id: number, 
    from_cards_id: number
}
