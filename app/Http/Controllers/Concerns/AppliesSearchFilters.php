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
                $boolean = $idx === 0 ? 'and' : $logic;
                $this->applySingleFilter($q, $f['field'], $f['operator'], $f['value'], $boolean);
            }
        });
    }

    protected function applySingleFilter(Builder $q, string $field, string $operator, $value, string $boolean = 'and'): void
    {
        $operator = strtolower($operator);
        switch ($operator) {
            case 'equals':
                $q->where($field, '=', $value, $boolean);
                break;
            case 'not_equals':
                $q->where($field, '!=', $value, $boolean);
                break;
            case 'contains':
                $pattern = '/'.preg_quote((string) $value, '/').'/i';
                $q->where($field, 'regexp', $pattern, $boolean);
                break;
            case 'starts_with':
                $pattern = '/^'.preg_quote((string) $value, '/').'/i';
                $q->where($field, 'regexp', $pattern, $boolean);
                break;
            case 'ends_with':
                $pattern = '/'.preg_quote((string) $value, '/').'$/i';
                $q->where($field, 'regexp', $pattern, $boolean);
                break;
            case 'in':
                $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                if (!empty($vals)) {
                    $q->whereIn($field, $vals, $boolean);
                }
                break;
            case 'not_in':
                $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                if (!empty($vals)) {
                    $q->whereNotIn($field, $vals, $boolean);
                }
                break;
            default:
                // no-op for unknown operator
                break;
        }
    }
}


