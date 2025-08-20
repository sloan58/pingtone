<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Line;
use App\Models\Phone;
use App\Models\UcmNode;

class LineSharedTest extends TestCase
{
    public function test_line_is_shared_when_used_by_multiple_devices()
    {
        // Create a UCM
        $ucm = UcmNode::factory()->create();

        // Create a line
        $line = Line::create([
            'uuid' => 'test-line-uuid-' . uniqid(),
            'pattern' => '1001',
            'ucm_cluster_id' => $ucm->id,
        ]);

        // Create two phones that use the same line
        $phone1 = Phone::create([
            'name' => 'SEP001122334455',
            'uuid' => 'phone-1-uuid-' . uniqid(),
            'class' => 'Phone',
            'ucm_cluster_id' => $ucm->id,
            'lines' => [
                'line' => [
                    [
                        'index' => '1',
                        'dirn' => [
                            'uuid' => $line->uuid,
                            'pattern' => '1001'
                        ]
                    ]
                ]
            ]
        ]);

        $phone2 = Phone::create([
            'name' => 'SEP556677889900',
            'uuid' => 'phone-2-uuid-' . uniqid(),
            'class' => 'Phone',
            'ucm_cluster_id' => $ucm->id,
            'lines' => [
                'line' => [
                    [
                        'index' => '1',
                        'dirn' => [
                            'uuid' => $line->uuid,
                            'pattern' => '1001'
                        ]
                    ]
                ]
            ]
        ]);

        // Test that the line is shared
        $this->assertTrue($line->isShared);
        $this->assertEquals(2, $line->deviceCount);
    }

    public function test_line_is_not_shared_when_used_by_single_device()
    {
        // Create a UCM
        $ucm = UcmNode::factory()->create();

        // Create a line
        $line = Line::create([
            'uuid' => 'test-line-uuid-' . uniqid(),
            'pattern' => '1001',
            'ucm_cluster_id' => $ucm->id,
        ]);

        // Create only one phone that uses the line
        $phone = Phone::create([
            'name' => 'SEP001122334455',
            'uuid' => 'phone-1-uuid-' . uniqid(),
            'class' => 'Phone',
            'ucm_cluster_id' => $ucm->id,
            'lines' => [
                'line' => [
                    [
                        'index' => '1',
                        'dirn' => [
                            'uuid' => $line->uuid,
                            'pattern' => '1001'
                        ]
                    ]
                ]
            ]
        ]);

        // Test that the line is not shared
        $this->assertFalse($line->isShared);
        $this->assertEquals(1, $line->deviceCount);
    }
}
