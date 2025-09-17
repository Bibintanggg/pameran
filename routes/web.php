<?php

use App\Http\Controllers\CardsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
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

    // Tambahkan route ini di web.php
Route::post('/transactions/convert', [TransactionsController::class, 'storeConvert'])
    ->middleware('auth')
    ->name('transactions.convert');

Route::post('/add-cards', [CardsController::class, 'store'])
    ->middleware(['auth', 'verified'])
    ->name('cards.store');

Route::get('/all-activity', [CardsController::class, 'allActivity'])
    ->middleware(['auth', 'verified']) // tambahkan middleware jika perlu
    ->name('all-activity');

Route::get('/income', function() {
    return Inertia::render('activity/income/index');
})->name('activity.income');

Route::get('/expense', function() {
    return Inertia::render('activity/expense/index');
})->name('activity.expense');

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
