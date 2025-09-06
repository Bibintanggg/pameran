type Transaction = {
    id: string;
    amount: number;
    category: string;
    date: string;
    description?: string;
    type: 'income' | 'expense' | 'convert'
}
