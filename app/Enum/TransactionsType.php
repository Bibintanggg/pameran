<?php

namespace App\Enum;

enum TransactionsType: string
{
    case INCOME = 'income';
    case EXPENSE = 'expense';
    case CONVERT = 'convert';

    public function label(): string
    {
        return match ($this) {
            self::INCOME => 'Income',
            self::EXPENSE => 'Expense',
            self::CONVERT => 'Convert'
        };
    }

    public function options(): array
    {
        return [
            self::INCOME->value => self::INCOME->label(),
            self::EXPENSE->value => self::EXPENSE->label(),
            self::CONVERT->value => self::CONVERT->label(),
        ];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}