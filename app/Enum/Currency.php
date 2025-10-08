<?php

namespace App\Enum;

enum Currency: string
{
    case INDONESIAN_RUPIAH = 'indonesian_rupiah';
    case BAHT_THAILAND = 'baht_thailand';
    case AS_DOLLAR = 'as_dollar';
    case RIEL_KAMBOJA = 'riel_kamboja';

    public function label(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "IDR - INDONESIAN RUPIAH",
            self::BAHT_THAILAND => "THB - BAHT THAILAND",
            self::AS_DOLLAR => "USD",
            self::RIEL_KAMBOJA => "RIEL - KAMBOJA"
        };
    }

    public function options(): array
    {
        return [
            self::INDONESIAN_RUPIAH->value => self::INDONESIAN_RUPIAH->label(),
            self::BAHT_THAILAND->value => self::BAHT_THAILAND->label(),
            self::AS_DOLLAR->value => self::AS_DOLLAR->label(),
            self::RIEL_KAMBOJA->value => self::RIEL_KAMBOJA->label()
        ];
    }

    public function symbol(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "Rp",
            self::BAHT_THAILAND => "฿",
            self::AS_DOLLAR => "$",
            self::RIEL_KAMBOJA => "៛"
        };
    }

    public function toISO(): string
    {
        return match ($this) {
            self::INDONESIAN_RUPIAH => "IDR",
            self::BAHT_THAILAND => "THB",
            self::AS_DOLLAR => "USD",
            self::RIEL_KAMBOJA => "KHR"
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
