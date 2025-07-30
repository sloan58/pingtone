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

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Phone $phone)
    {
        $phone->load(['ucm', 'lines']);

        return Inertia::render('Phones/Show', [
            'phone' => $phone,
        ]);
    }
} 