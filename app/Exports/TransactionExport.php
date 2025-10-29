<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;

class TransactionExport implements FromCollection
{
    protected $transactions;

    public function __construct($transactions)
    {
        $this->transactions = $transactions;
    }
    public function collection()
    {
        return $this->transactions;
    }
}
