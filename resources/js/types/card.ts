export type Card = {
    id: number
    userId?: number
    name: string
    balance: number
    currency: 'IDR' | 'USD' | 'THB',
    card_number: string
}
