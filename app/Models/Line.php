<?php

namespace App\Models;

use App\Services\Axl;
use Exception;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;
use SoapFault;

class Line extends Model
{
    protected $guarded = [];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
    public function updateAndSync(array $payload): void
    {
        $axlApi = new Axl($this->ucm);
        $axlApi->updateLine($payload);

        $this->sync();
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
    public function sync(): void
    {
        $axlApi = new Axl($this->ucm);

        $freshData = $axlApi->getLineByUuid($this->uuid);

        $this->update($freshData);
    }

    /**
     * Check if this line is shared (used by 2 or more devices)
     */
    public function getIsSharedAttribute(): bool
    {
        // Count devices that have this line in their lines.line array
        $deviceCount = Phone::raw()->countDocuments([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ]);

        return $deviceCount >= 2;
    }

    public function getPatternAndPartitionAttribute(): string
    {
        $partition = $this->routePartitionName['_'] ?: 'None';

        return "{$this->pattern} in {$partition}";
    }

    /**
     * Get the count of devices using this line
     */
    public function getDeviceCountAttribute(): int
    {
        return Phone::raw()->countDocuments([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ]);
    }

    /**
     * Get associated devices for a line
     */
    public function getAssociatedDevices(): array
    {
        // Get phones that have this line in their lines.line array
        $phones = Phone::raw()->find([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ], [
            '_id' => 1,
            'name' => 1,
            'class' => 1
        ]);

        return collect($phones)->map(function ($phone) {
            return [
                'id' => (string) $phone['_id'],
                'name' => $phone['name'],
                'class' => $phone['class'] ?? 'Phone',
            ];
        })->toArray();
    }

    /**
     * Get count of associated devices for a line
     */
    public function getAssociatedDevicesCount(): int
    {
        // Use the same query as in the Line model
        return Phone::raw()->countDocuments([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ]);
    }

    public static function storeUcmDetails(array $line, UcmCluster $ucmCluster): void
    {
        $line['ucm_cluster_id'] = $ucmCluster->id;
        self::updateOrCreate(['uuid' => $line['uuid']], $line)->touch();
    }
}
