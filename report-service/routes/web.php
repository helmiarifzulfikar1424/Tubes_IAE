<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportController;

Route::get('/health', [ReportController::class, 'health']);
Route::get('/reports', [ReportController::class, 'getReport']);

