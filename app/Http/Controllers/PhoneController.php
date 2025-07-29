<?php

namespace App\Http\Controllers;

use App\Models\Phone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PhoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $phones = Phone::with(['ucm', 'lines'])
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('phones/index', [
            'phones' => $phones,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Phone $phone)
    {
        $phone->load(['ucm', 'lines']);

        return Inertia::render('phones/show', [
            'phone' => $phone,
        ]);
    }
} 