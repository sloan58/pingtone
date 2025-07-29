<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PhoneController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [DashboardController::class, 'index']);

Route::resource('phones', PhoneController::class)->only(['index', 'show']);

require __DIR__.'/auth.php';
