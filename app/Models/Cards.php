<?php

namespace App\Models;

use App\Enum\Currency;
use Illuminate\Database\Eloquent\Model;

class Cards extends Model
{
    //
    protected $table = 'cards';

    protected $fillable = [
        'currency',
        'card_number',
        'balance'
    ];

    protected $casts = [
        'currency' => Currency::class
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
