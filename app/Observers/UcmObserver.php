<?php

namespace App\Observers;

use Exception;
use ReflectionClass;
use ReflectionMethod;
use App\Models\Ucm;
use App\Models\PhoneModel;
use App\Models\VoicemailProfile;
use App\Models\RecordingProfile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class UcmObserver
{
    /**
     * Handle the Ucm "created" event.
     */
    public function created(Ucm $ucm): void
    {
        Log::info("UCM created", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "updated" event.
     */
    public function updated(Ucm $ucm): void
    {
        Log::info("UCM updated", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "deleted" event.
     */
    public function deleted(Ucm $ucm): void
    {
        echo "OBSERVER DEBUG: UCM deleted - {$ucm->id}\n";
        Log::info("UCM deleted, cleaning up related records", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);

        try {
            $totalDeleted = 0;
            $deletionSummary = [];
            
            // Get all models that have a belongsTo ucm() relationship
            $modelsWithUcmRelation = $this->getModelsWithUcmRelation();
            
            foreach ($modelsWithUcmRelation as $modelClass) {
                try {
                    $modelName = class_basename($modelClass);
                    $deletedCount = $modelClass::where('ucm_id', $ucm->id)->delete();
                    
                    if ($deletedCount > 0) {
                        echo "OBSERVER DEBUG: Deleted {$deletedCount} {$modelName} records\n";
                        $deletionSummary[$modelName] = $deletedCount;
                        $totalDeleted += $deletedCount;
                        
                        Log::info("Deleted related records", [
                            'model' => $modelName,
                            'ucm_id' => $ucm->id,
                            'count' => $deletedCount,
                        ]);
                    }
                } catch (Exception $e) {
                    echo "OBSERVER ERROR deleting {$modelClass}: " . $e->getMessage() . "\n";
                    Log::error("Error deleting related records", [
                        'model' => $modelClass,
                        'ucm_id' => $ucm->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info("UCM cleanup completed", [
                'ucm_id' => $ucm->id,
                'total_records_deleted' => $totalDeleted,
                'deletion_summary' => $deletionSummary,
            ]);
            
            echo "OBSERVER DEBUG: Total records deleted: {$totalDeleted}\n";
            
        } catch (Exception $e) {
            echo "OBSERVER ERROR: " . $e->getMessage() . "\n";
            Log::error("Error in UcmObserver::deleted", [
                'error' => $e->getMessage(),
                'ucm_id' => $ucm->id,
            ]);
        }
    }

    /**
     * Handle the Ucm "restored" event.
     */
    public function restored(Ucm $ucm): void
    {
        Log::info("UCM restored", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "force deleted" event.
     */
    public function forceDeleted(Ucm $ucm): void
    {
        Log::info("UCM force deleted", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Get all model classes that have a belongsTo ucm() relationship.
     * 
     * @return array Array of model class names
     */
    private function getModelsWithUcmRelation(): array
    {
        // Get the models path - handle different environments
        if (function_exists('base_path')) {
            $modelsPath = base_path('app/Models');
        } else {
            // Fallback for environments where base_path() is not available
            $modelsPath = __DIR__ . '/../Models';
        }
        
        if (!File::exists($modelsPath)) {
            Log::warning("Models path does not exist: {$modelsPath}");
            return [];
        }
        
        $modelFiles = File::allFiles($modelsPath);
        $modelsWithUcmRelation = [];

        foreach ($modelFiles as $file) {
            // Skip non-PHP files
            if ($file->getExtension() !== 'php') {
                continue;
            }

            // Get the class name from the file
            $className = 'App\\Models\\' . $file->getFilenameWithoutExtension();
            
            // Skip if class doesn't exist or isn't a model
            if (!class_exists($className)) {
                continue;
            }

            try {
                $reflection = new ReflectionClass($className);
                
                // Skip abstract classes (like Device)
                if ($reflection->isAbstract()) {
                    continue;
                }
                
                // Skip the Ucm model itself
                if ($className === Ucm::class) {
                    continue;
                }
                
                // Check if the class extends Model
                if (!$reflection->isSubclassOf(Model::class)) {
                    continue;
                }

                // Check if the class has a ucm() method
                if (!$reflection->hasMethod('ucm')) {
                    continue;
                }

                $ucmMethod = $reflection->getMethod('ucm');
                
                // Skip if method is not public
                if (!$ucmMethod->isPublic()) {
                    continue;
                }

                // Check if the ucm() method returns a BelongsTo relationship
                // We'll do this by checking the return type or method body
                $returnType = $ucmMethod->getReturnType();
                if ($returnType && $returnType->getName() === BelongsTo::class) {
                    $modelsWithUcmRelation[] = $className;
                    continue;
                }

                // If no return type, we can try to instantiate and check the method
                // This is more expensive but more reliable
                try {
                    $instance = new $className();
                    $relationship = $instance->ucm();
                    
                    if ($relationship instanceof BelongsTo) {
                        $modelsWithUcmRelation[] = $className;
                    }
                } catch (Exception $e) {
                    // If we can't instantiate, skip this model
                    Log::debug("Could not check ucm() relationship for {$className}", [
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }

            } catch (Exception $e) {
                // Skip models that can't be reflected
                Log::debug("Could not reflect model {$className}", [
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        Log::debug("Found models with ucm() relationship", [
            'models' => array_map('class_basename', $modelsWithUcmRelation),
            'count' => count($modelsWithUcmRelation)
        ]);

        return $modelsWithUcmRelation;
    }
}
