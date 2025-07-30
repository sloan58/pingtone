<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneModel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'maxExpansionModules',
        'supportedExpansionModules',
        'ucm_id',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'supportedExpansionModules' => 'array',
    ];

    /**
     * The relationships that should always be loaded.
     */
    protected $with = ['ucm'];

    /**
     * Get the UCM that owns this phone model.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Store UCM data from AXL response
     *
     * @param array $responseData
     * @param Ucm $ucm
     * @return void
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $collection = \DB::connection('mongodb')->getCollection('phone_models');
        
        foreach ($responseData as $record) {
            $update = [
                'name' => $record->name,
                'ucm_id' => $ucm->id,
                'updated_at' => new \MongoDB\BSON\UTCDateTime(now())
            ];

            $filter = [
                'ucm_id' => $ucm->id,
                'name' => $record->name
            ];

            try {
                $collection->updateOne($filter, ['$set' => $update], [
                    'upsert' => true, 
                    'hint' => ['ucm_id' => 1, 'name' => 1]
                ]);
            } catch (\Exception $e) {
                logger()->error("Error storing PhoneModel data", [
                    'ucm' => $ucm->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
} 