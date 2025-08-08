<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Support\MongoBulkUpsert;

class UcmUser extends Model
{
    protected $fillable = [
        'userid',
        'email',
        'uuid',
    ];

    protected $with = [];

    public function ucms(): BelongsToMany
    {
        return $this->belongsToMany(Ucm::class, 'ucm_user_ucm', 'ucm_user_id', 'ucm_id')
            ->withPivot([
                'home_cluster',
                'im_presence_enabled'
            ])
            ->withTimestamps();
    }

    /**
     * Store user data and pivot attributes from UCM
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        foreach (array_chunk($responseData, 1000) as $chunk) {
            // Prepare user docs; require uuid for uniqueness
            $rows = array_values(array_filter(array_map(fn($r) => [
                'uuid' => $r->uuid ?? null,
                'userid' => $r->userid ?? null,
                'email' => $r->mailid ?? null,
            ], $chunk), fn($u) => !empty($u['uuid'])));

            if (!empty($rows)) {
                MongoBulkUpsert::upsert(
                    'ucm_users',
                    $rows,
                    ['uuid'],
                    ['uuid', 'userid', 'email']
                );
            }

            // Sync pivot attributes for users having uuid
            foreach ($chunk as $r) {
                $uuid = $r->uuid ?? null;
                if (!$uuid) { continue; }

                $user = static::query()->where('uuid', $uuid)->first();
                if (!$user) { continue; }

                $pivot = [
                    'home_cluster' => (bool)($r->homeCluster ?? false),
                    'im_presence_enabled' => (bool)($r->imAndPresenceEnable ?? false),
                ];

                $user->ucms()->syncWithoutDetaching([$ucm->id => $pivot]);
            }
        }
    }
}


