<?php

namespace App\Http\Controllers;

use App\Models\Line;
use Inertia\Inertia;
use App\Models\Phone;
use Illuminate\Http\Request;

class LineController extends Controller
{
    /**
     * Show the form for editing the specified line.
     */
    public function edit(Request $request, Line $line)
    {
        $phone = null;
        $deviceSpecificLine = null;

        if ($request->has('phone')) {
            $phone = Phone::find($request->get('phone'));
            
            if ($phone && isset($phone->lines['line'])) {
                // Extract the device-specific line configuration for this line
                $lines = is_array($phone->lines['line']) ? $phone->lines['line'] : [$phone->lines['line']];
                $deviceSpecificLine = collect($lines)->firstWhere('dirn.uuid', $line->uuid);
            }
        }

        return Inertia::render('Lines/Configure', [
            'line' => $line,
            'phone' => $phone,
            'deviceSpecificLine' => $deviceSpecificLine,
        ]);
    }
}
