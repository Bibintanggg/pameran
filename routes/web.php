<?php

use App\Http\Controllers\CardsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShowCardsController;
use App\Http\Controllers\TransactionsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/home', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/home', [CardsController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('home.index');

Route::post('/transactions/income', [TransactionsController::class, 'storeIncome'])
    ->middleware(['auth', 'verified'])
    ->name('transactions.storeincome');

Route::post('/transactions/expense', [TransactionsController::class, 'storeExpense'])
    ->middleware(['auth', 'verified'])
    ->name('transactions.store-expense');

Route::post('/transactions/convert', [TransactionsController::class, 'storeConvert'])
    ->middleware('auth')
    ->name('transactions.convert');

Route::post('/add-cards', [CardsController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('cards.store');

Route::get('/all-activity', [CardsController::class, 'allActivity'])
    ->middleware(['auth', 'verified']) 
    ->name('all-activity');

Route::get('/activity/export', [CardsController::class, 'exportAllActivity'])
    ->name('activity.export');

Route::get('/activity/income/export', [CardsController::class, 'exportIncomeActivity'])
    ->name('activity-income.export');

Route::get('/activity/income', [CardsController::class, 'incomeActivity'])
    ->middleware(['auth', 'verified'])
    ->name('income.index');

Route::get('/activity/expense', [CardsController::class, 'expenseActivity'])
    ->middleware(['auth', 'verified'])
    ->name('expense.index');

Route::get('/expense', function() {
    return Inertia::render('activity/expense/index');
})->name('activity.expense');

Route::get('/cards', [ShowCardsController::class, 'showCards'])->name('cards.show');
Route::get('/cards/create', [CardsController::class, 'create'])->name('cards.create');
Route::get('/cards/{id}/edit', [CardsController::class, 'edit'])->name('cards.edit');
Route::delete('/cards/{id}', [CardsController::class, 'destroy'])->name('cards.destroy');

Route::delete('/cards/{card}', [CardsController::class, 'destroy'])
    ->middleware(['auth', 'verified'])
    ->name('cards.destroy');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
Route::get('/activity', function() {
    return Inertia::render('activity/index');
})->middleware(['auth', 'verified'])->name('activity');

require __DIR__.'/auth.php';
