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
            $table->integer('type');
            $table->foreignId('from_cards_id')->nullable()->constrained('cards')->onDelete('cascade');
            $table->foreignId('to_cards_id')->nullable()->constrained('cards')->onDelete('cascade');
            $table->decimal('amount');
            $table->decimal('rate')->nullable();
            $table->string('notes')->nullable();
            $table->integer('category')->nullable();
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
