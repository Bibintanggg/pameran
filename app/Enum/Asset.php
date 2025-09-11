<?php

namespace App\Enum;

enum Asset: int
{
    case CASH = 1;
    case TRANSFER = 2;

    public function label(): string
    {
        return match ($this) {
            self::CASH => "Cash",
            self::TRANSFER => "Transfer"
        };
    }

    public function options():  array
    {
        return [
            self::CASH->value => self::CASH->label(),
            self::TRANSFER->value => self::TRANSFER->label()
        ];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
