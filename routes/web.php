<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\CardsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShowCardsController;
use App\Http\Controllers\TransactionsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', [CardsController::class, 'index'])->name('home.index');

    Route::prefix('transactions')->group(function () {
        Route::post('/income',  [TransactionsController::class, 'storeIncome'])->name('transactions.storeincome');
        Route::post('/expense', [TransactionsController::class, 'storeExpense'])->name('transactions.store-expense');
        Route::post('/convert', [TransactionsController::class, 'storeConvert'])->name('transactions.convert');
    });

    Route::post('/add-cards', [CardsController::class, 'store'])->name('cards.store');
    Route::get('/cards', [ShowCardsController::class, 'showCards'])->name('cards.show');
    Route::put('/cards', [CardsController::class, 'update'])->name('cards.update');
    Route::delete('/cards/{card}', [CardsController::class, 'destroy'])->name('cards.destroy');

    Route::get('/all-activity', [ActivityController::class, 'allActivity'])->name('all-activity');
    Route::get('/activity/income', [ActivityController::class, 'incomeActivity'])->name('income.index');
    Route::get('/activity/expense', [ActivityController::class, 'expenseActivity'])->name('expense.index');
    Route::get('/activity/export', [ActivityController::class, 'exportAllActivity'])->name('activity.export');
    Route::get('/activity/income/export', [ActivityController::class, 'exportIncomeActivity'])->name('activity-income.export');

    Route::prefix('profile')->group(function () {
        Route::get('/',  [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });
});

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'      => Route::has('login'),
        'canRegister'   => Route::has('register'),
        'laravelVersion'=> Application::VERSION,
        'phpVersion'    => PHP_VERSION,
    ]);
});

require __DIR__.'/auth.php';
