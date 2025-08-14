<?php

namespace App\Models\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasDeviceClassScope
{
    /**
     * Add the device class global scope
     */
    protected static function addDeviceClassScope(): void
    {
        static::addGlobalScope('device_class', function (Builder $query) {
            $query->where('class', static::getDeviceClass());
        });
    }

    /**
     * Remove the device class global scope
     */
    public static function withoutDeviceClassScope(): Builder
    {
        return static::withoutGlobalScope('device_class');
    }

    /**
     * Get all devices without the device class filter
     */
    public static function allDevices(): Builder
    {
        return static::withoutDeviceClassScope();
    }

    /**
     * Get devices of a specific class
     */
    public static function ofClass(string $deviceClass): Builder
    {
        return static::withoutDeviceClassScope()->where('class', $deviceClass);
    }

    /**
     * Get the device class for this model
     */
    abstract protected static function getDeviceClass(): string;
}
