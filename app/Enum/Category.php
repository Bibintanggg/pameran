<?php

namespace App\Enum;

enum Category: string
{
    case SALLARY = 'sallary';
    case ALLOWANCE = 'allowance';
    case BUSINESS = 'business';
    case FOOD_DRINKS = 'food_drinks';
    case TOPUP = 'topup';
    case TRANSPORTATION = 'transportation';
    case HEALTH = 'health';
    case SHOPPING = 'shopping';
    case SAVINGS_INVESTMENTS = 'savings_investments';
    case TRAVEL = 'travel';

    public function label(): string
    {
        return match ($this) {
            self::SALLARY => "Sallary",
            self::ALLOWANCE => "Allowance",
            self::BUSINESS => "Business",
            self::FOOD_DRINKS => "Food & Drinks",
            self::TRANSPORTATION => "Transportation",
            self::TOPUP => "Top-Up",
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
            self::TOPUP->value => self::TOPUP->label(),
            self::SAVINGS_INVESTMENTS->value => self::SAVINGS_INVESTMENTS->label(),
            self::TRAVEL->value => self::TRAVEL->label()
        ];
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
