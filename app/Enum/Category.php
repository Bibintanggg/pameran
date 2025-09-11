<?php

namespace App\Enum;

enum Category: int
{
    case SALLARY = 1;
    case ALLOWANCE = 2;
    case BONUS = 3;
    case FOOD_DRINKS = 4;
    case TRANSPORTATION = 5;
    case GROCERIES = 6;
    case HEALTH = 7;
    case SHOPPING = 8;
    case SAVINGS_INVESTMENTS = 9;
    case TRAVEL = 10;

    public function label(): string
    {
        return match ($this) {
            self::SALLARY => "Sallary",
            self::ALLOWANCE => "Allowance",
            self::BONUS => "Bonus",
            self::FOOD_DRINKS => "Food & Drinks",
            self::TRANSPORTATION => "Transportation",
            self::GROCERIES => "Groceries",
            self::HEALTH => "Health",
            self::SHOPPING => "Shopping",
            self::SAVINGS_INVESTMENTS => "Savings & Investments",
            self::TRAVEL => "Travel",
        };
    }

}