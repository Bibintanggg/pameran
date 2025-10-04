<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type');
            $table->foreignId('from_cards_id')->nullable()->constrained('cards')->onDelete('cascade');
            $table->foreignId('to_cards_id')->nullable()->constrained('cards')->onDelete('cascade');
            $table->decimal('amount', 18, 2);
            $table->decimal('converted_amount', 18, 2)->nullable();
            $table->string('asset');
            $table->decimal('rate', 18, 6)->nullable();
            $table->string('notes')->nullable();
            $table->date('transaction_date')->index();
            $table->string('category')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
