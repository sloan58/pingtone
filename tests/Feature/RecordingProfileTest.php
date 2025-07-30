<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Ucm;
use App\Models\RecordingProfile;

class RecordingProfileTest extends TestCase
{
    public function test_recording_profile_has_ucm_relationship(): void
    {
        $recordingProfile = new RecordingProfile();
        
        $this->assertTrue(method_exists($recordingProfile, 'ucm'));
    }

    public function test_recording_profile_model_has_fillable_fields(): void
    {
        $recordingProfile = new RecordingProfile();
        
        $this->assertContains('pkid', $recordingProfile->getFillable());
        $this->assertContains('name', $recordingProfile->getFillable());
        $this->assertContains('ucm_id', $recordingProfile->getFillable());
    }
}
