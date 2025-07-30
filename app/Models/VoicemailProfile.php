<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoicemailProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'name',
        'ucm_id',
    ];

    /**
     * The relationships that should always be loaded.
     */
    protected $with = ['ucm'];

    /**
     * Get the UCM that owns this voicemail profile.
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
        $collection = \DB::connection('mongodb')->getCollection('voicemail_profiles');
        
        foreach ($responseData as $record) {
            $update = [
                'uuid' => $record->uuid,
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
                logger()->error("Error storing VoicemailProfile data", [
                    'ucm' => $ucm->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
} 