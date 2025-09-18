<?php

namespace App\Models;

use App\Enum\Asset;
use App\Enum\Category;
use App\Enum\TransactionsType;
use Illuminate\Database\Eloquent\Model;

class Transactions extends Model
{
    //
    protected $table = 'transactions';

    protected $fillable = [
        'user_id',
        'type',
        'from_cards_id',
        'to_cards_id',
        'amount',
        'rate',
        'notes',
        'asset',
        'transaction_date',
        'converted_amount',
        'category'
    ];

    protected $casts = [
        'transaction_date' => 'date:Y-m-d',
        'amount' => 'decimal:2',
        'rate' => 'decimal:6'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cards()
    {
        return $this->belongsTo(Cards::class);
    }

    public function fromCard()
    {
        return $this->belongsTo(Cards::class, 'from_cards_id');
    }

    public function toCard()
    {
        return $this->belongsTo(Cards::class, 'to_cards_id');
    }
}
