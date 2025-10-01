<?php

namespace App\Enum;

enum Currency: string
{
    case INDONESIAN_RUPIAH = 'indonesian_rupiah';
    case BAHT_THAILAND = 'baht_thailand';
    case AS_DOLLAR = 'as_dollar';

    public function label(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "IDR - INDONESIAN RUPIAH",
            self::BAHT_THAILAND => "THB - BAHT THAILAND",
            self::AS_DOLLAR => "USD"
        };
    }

    public function options(): array 
    {
        return [
            self::INDONESIAN_RUPIAH->value => self::INDONESIAN_RUPIAH->label(),
            self::BAHT_THAILAND->value => self::BAHT_THAILAND->label(),
            self::AS_DOLLAR->value => self::AS_DOLLAR->label(),
        ];
    }
    
    public function symbol(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "Rp",
            self::BAHT_THAILAND => "฿",
            self::AS_DOLLAR => "$",
        };
    }

    public function toISO(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "IDR",
            self::BAHT_THAILAND => "THB",
            self::AS_DOLLAR => "USD",
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}