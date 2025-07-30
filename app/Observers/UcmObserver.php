<?php

namespace App\Observers;

use App\Models\Ucm;

class UcmObserver
{
    /**
     * Handle the Ucm "created" event.
     */
    public function created(Ucm $ucm): void
    {
        //
    }

    /**
     * Handle the Ucm "updated" event.
     */
    public function updated(Ucm $ucm): void
    {
        //
    }

    /**
     * Handle the Ucm "deleted" event.
     */
    public function deleted(Ucm $ucm): void
    {
        //
    }

    /**
     * Handle the Ucm "restored" event.
     */
    public function restored(Ucm $ucm): void
    {
        //
    }

    /**
     * Handle the Ucm "force deleted" event.
     */
    public function forceDeleted(Ucm $ucm): void
    {
        //
    }
}
