<?php

use App\Observers\UcmClusterObserver;

it('observer method exists and is callable', function () {
    $observer = new UcmClusterObserver();

    expect(method_exists($observer, 'deleted'))->toBeTrue();
    expect(method_exists($observer, 'getModelsWithUcmRelation'))->toBeTrue();
});

it('observer has proper structure for cascade deletion', function () {
    $observer = new UcmClusterObserver();
    $reflection = new ReflectionClass($observer);

    // Check that the deleted method exists
    expect($reflection->hasMethod('deleted'))->toBeTrue();

    // Check that the helper method exists
    expect($reflection->hasMethod('getModelsWithUcmRelation'))->toBeTrue();

    // Check that the helper method is private (good encapsulation)
    $helperMethod = $reflection->getMethod('getModelsWithUcmRelation');
    expect($helperMethod->isPrivate())->toBeTrue();
});
