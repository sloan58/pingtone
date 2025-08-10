<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use MongoDB\BSON\Regex as MongoRegex;

trait AppliesSearchFilters
{
    /**
     * Apply simple filters with AND/OR logic to a query.
     * Each filter item: ['field' => string, 'operator' => string, 'value' => mixed]
     * Allowed operators: equals, not_equals, contains, starts_with, ends_with, in, not_in
     * Logic: 'and' | 'or'
     *
     * @param  Builder  $query
     * @param  array<int,array{field:string,operator:string,value:mixed}>  $filters
     * @param  string  $logic
     * @param  array<int,string>  $allowedFields
     */
    protected function applyFilters(Builder $query, array $filters, string $logic, array $allowedFields): void
    {
        $logic = strtolower($logic) === 'or' ? 'or' : 'and';

        $filters = array_values(array_filter($filters, function ($f) use ($allowedFields) {
            return is_array($f)
                && isset($f['field'], $f['operator'])
                && in_array($f['field'], $allowedFields, true)
                && ($f['value'] ?? '') !== '';
        }));

        if (empty($filters)) {
            return;
        }

        $query->where(function (Builder $q) use ($filters, $logic) {
            foreach ($filters as $idx => $f) {
                $useOr = $idx !== 0 && $logic === 'or';
                $this->applySingleFilter($q, $f['field'], $f['operator'], $f['value'], $useOr);
            }
        });
    }

    protected function applySingleFilter(Builder $q, string $field, string $operator, $value, bool $useOr = false): void
    {
        $operator = strtolower($operator);
        switch ($operator) {
            case 'equals':
                $useOr ? $q->orWhere($field, '=', $value) : $q->where($field, '=', $value);
                break;
            case 'not_equals':
                $useOr ? $q->orWhere($field, '!=', $value) : $q->where($field, '!=', $value);
                break;
            case 'contains':
                $like = '%'.str_replace(['%', '_'], ['\%','\_'], (string) $value).'%';
                $useOr ? $q->orWhere($field, 'like', $like) : $q->where($field, 'like', $like);
                break;
            case 'starts_with':
                $like = str_replace(['%', '_'], ['\%','\_'], (string) $value).'%';
                $useOr ? $q->orWhere($field, 'like', $like) : $q->where($field, 'like', $like);
                break;
            case 'ends_with':
                $like = '%'.str_replace(['%', '_'], ['\%','\_'], (string) $value);
                $useOr ? $q->orWhere($field, 'like', $like) : $q->where($field, 'like', $like);
                break;
            case 'in':
                $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                if (!empty($vals)) {
                    $useOr ? $q->orWhereIn($field, $vals) : $q->whereIn($field, $vals);
                }
                break;
            case 'not_in':
                $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                if (!empty($vals)) {
                    $useOr ? $q->orWhereNotIn($field, $vals) : $q->whereNotIn($field, $vals);
                }
                break;
            default:
                // no-op for unknown operator
                break;
        }
    }
}


