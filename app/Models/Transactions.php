<?php

namespace App\Models;

use App\Enum\TransactionType;
use Illuminate\Database\Eloquent\Model;

class Transactions extends Model
{
    //
    protected $table = 'transactions';

    protected $fillable = [
        'type',
        'from_cards_id',
        'to_cards_id',
        'amount',
        'rate',
        'notes',
        'category'
    ];

    protected $casts = [
        'type' => TransactionType::class,
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
