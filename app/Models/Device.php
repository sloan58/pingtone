<?php

namespace App\Models;

use Exception;
use SoapFault;
use App\Services\Axl;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\Builder;
use MongoDB\Laravel\Relations\BelongsTo;
use App\Models\Traits\HasDeviceClassScope;

abstract class Device extends Model
{
    use HasDeviceClassScope;

    protected $guarded = [];

    /**
     * The table associated with the model.
     */
    protected $table = 'devices';

    /**
     * Boot the model and add the global scope for device class
     */
    protected static function boot()
    {
        parent::boot();

        // Add global scope to filter by device class
        static::addDeviceClassScope();
    }

    /**
     * Get the UCM that owns this device.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get service areas using custom link table query
     * Use this method for actual data retrieval
     */
    public function serviceAreas(): ServiceArea|Builder
    {
        $serviceAreaIds = ServiceAreaDeviceLink::where('device_id', $this->id)
            ->where('device_type', 'Phone') // Assuming Device model is primarily for phones
            ->pluck('service_area_id');

        return ServiceArea::whereIn('id', $serviceAreaIds);
    }

    /**
     * Get all devices without the global scope filter
     * This allows querying the devices table without the class filter
     */
    public static function allDevices()
    {
        return static::withoutGlobalScope('device_class');
    }

    /**
     * Get devices of a specific class without using the global scope
     */
    public static function ofClass(string $deviceClass)
    {
        return static::withoutGlobalScope('device_class')->where('class', $deviceClass);
    }

    /**
     * Update device in UCM and sync locally - polymorphic method that calls the correct AXL method
     *
     * @throws SoapFault
     * @throws Exception
     */
    public function updateAndSync(array $payload): void
    {
        $axlApi = new Axl($this->ucm);

        // Call the appropriate AXL method based on device class
        switch ($this->class) {
            case 'Phone':
                $axlApi->updatePhone($payload);
                break;
            case 'Device Profile':
                $axlApi->updateDeviceProfile($payload);
                break;
            case 'Remote Destination Profile':
                $axlApi->updateRemoteDestinationProfile($payload);
                break;
            default:
                throw new Exception("Unsupported device class: {$this->class}");
        }

        $this->sync();
    }

    /**
     * Sync device data from UCM - polymorphic method that calls the correct AXL method
     *
     * @throws SoapFault
     * @throws Exception
     */
    public function sync(): void
    {
        $axlApi = new Axl($this->ucm);

        // Call the appropriate AXL method based on device class
        $freshData = match ($this->class) {
            'Phone' => $axlApi->getPhoneByName($this->name),
            'Device Profile' => $axlApi->getDeviceProfileByName($this->name),
            'Remote Destination Profile' => $axlApi->getRemoteDestinationProfileByName($this->name),
            default => throw new Exception("Unsupported device class: {$this->class}"),
        };

        $this->update($freshData);
    }
}
