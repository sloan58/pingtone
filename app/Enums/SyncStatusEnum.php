<?php

namespace App\Enums;

enum SyncStatusEnum: string
{
    case SYNCING = 'syncing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';

    public function label(): string
    {
        return match($this) {
            self::SYNCING => 'Syncing',
            self::COMPLETED => 'Completed',
            self::FAILED => 'Failed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::SYNCING => 'blue',
            self::COMPLETED => 'green',
            self::FAILED => 'red',
        };
    }
} 