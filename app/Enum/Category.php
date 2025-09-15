<?php

namespace App\Enum;

enum Category: int
{
    case SALLARY = 1;
    case ALLOWANCE = 2;
    case BUSINESS = 3;
    case FOOD_DRINKS = 4;
    case TRANSPORTATION = 5;
    case HEALTH = 7;
    case SHOPPING = 8;
    case SAVINGS_INVESTMENTS = 9;
    case TRAVEL = 10;

    public function label(): string
    {
        return match ($this) {
            self::SALLARY => "Sallary",
            self::ALLOWANCE => "Allowance",
            self::BUSINESS => "Business",
            self::FOOD_DRINKS => "Food & Drinks",
            self::TRANSPORTATION => "Transportation",
            self::HEALTH => "Health",
            self::SHOPPING => "Shopping",
            self::SAVINGS_INVESTMENTS => "Savings & Investments",
            self::TRAVEL => "Travel",
        };
    }

    public function options(): array
    {
        return [
            self::SALLARY->value => self::SALLARY->label(),
            self::ALLOWANCE->value => self::ALLOWANCE->label(),
            self::BUSINESS->value => self::BUSINESS->label(),
            self::FOOD_DRINKS->value => self::FOOD_DRINKS->label(),
            self::TRANSPORTATION->value => self::TRANSPORTATION->label(),
            self::HEALTH->value => self::HEALTH->label(),
            self::SHOPPING->value => self::SHOPPING->label(),
            self::SAVINGS_INVESTMENTS->value => self::SAVINGS_INVESTMENTS->label(),
            self::TRAVEL->value => self::TRAVEL->label()
        ];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
