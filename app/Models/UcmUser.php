<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
            ->withPivot(['home_cluster', 'im_presence_enabled'])
            ->withTimestamps();
    }

    /**
     * Store user data and pivot attributes from UCM
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        foreach (array_chunk($responseData, 1000) as $chunk) {
            $users = array_map(fn($r) => [
                'userid' => $r->userid ?? null,
                'email' => $r->mailid ?? null,
                'uuid' => $r->uuid ?? null,
            ], $chunk);

            // Normalize and filter out empties
            $users = array_values(array_filter($users, function ($u) {
                return !empty($u['userid']) || !empty($u['email']) || !empty($u['uuid']);
            }));

            if (empty($users)) {
                continue;
            }

            // Insert/update unique users by userid/email/uuid separately
            // Upsert by userid when present
            $byUserid = array_values(array_filter($users, fn($u) => !empty($u['userid'])));
            if (!empty($byUserid)) {
                static::query()->upsert($byUserid, ['userid'], ['email', 'uuid', 'updated_at']);
            }

            // Upsert by email when present
            $byEmail = array_values(array_filter($users, fn($u) => !empty($u['email'])));
            if (!empty($byEmail)) {
                static::query()->upsert($byEmail, ['email'], ['userid', 'uuid', 'updated_at']);
            }

            // Upsert by uuid when present
            $byUuid = array_values(array_filter($users, fn($u) => !empty($u['uuid'])));
            if (!empty($byUuid)) {
                static::query()->upsert($byUuid, ['uuid'], ['userid', 'email', 'updated_at']);
            }

            // Sync pivots per chunk
            foreach ($chunk as $r) {
                $identifier = null;
                if (!empty($r->userid)) {
                    $identifier = ['userid' => $r->userid];
                } elseif (!empty($r->mailid)) {
                    $identifier = ['email' => $r->mailid];
                } elseif (!empty($r->uuid)) {
                    $identifier = ['uuid' => $r->uuid];
                }
                if (!$identifier) {
                    continue;
                }

                $user = static::query()->where($identifier)->first();
                if (!$user) {
                    continue;
                }

                $pivot = [
                    'home_cluster' => (bool)($r->homeCluster ?? false),
                    'im_presence_enabled' => (bool)($r->imAndPresenceEnable ?? false),
                ];

                $user->ucms()->syncWithoutDetaching([$ucm->id => $pivot]);
            }
        }
    }
}


