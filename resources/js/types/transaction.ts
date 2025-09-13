export interface Transaction {
    id: number;
    user_name: string;
    type: number;
    type_label: string;
    amount: number;
    formatted_amount: string;
    notes: string;
    asset: number;
    asset_label: string;
    category: number;
    category_label: string;
    transaction_date: string;
}
