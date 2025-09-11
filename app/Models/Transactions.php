<?php

namespace App\Models;

use App\Enum\Asset;
use App\Enum\Category;
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
        'asset',
        'category'
    ];

    protected $casts = [
        'type' => TransactionType::class,
        'category' => Category::class,
        'asset' => Asset::class
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cards()
    {
        return $this->belongsTo(Cards::class);
    }
}
