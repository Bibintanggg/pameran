<?php

namespace App\Models;

use App\Enum\Currency;
use Illuminate\Database\Eloquent\Model;

class Cards extends Model
{
    //
    protected $table = 'cards';

    protected $fillable = [
        // 'card_id',
        'user_id',
        'currency',
        'name',
        'card_number',
        'balance'
    ];

    protected $casts = [
        'currency' => Currency::class
    ];

    public function transactions()
    {
        return $this->hasMany(Transactions::class);
    }

    public function transactionsForm()
    {
        return $this->hasMany(Transactions::class, 'from_cards_id');
    }

    public function transactionsTo()
    {
        return $this->hasMany(Transactions::class, 'to_cards_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
