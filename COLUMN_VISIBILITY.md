# Column Visibility Feature

The DataTable component now includes a column visibility feature that allows users to show/hide columns dynamically.

## Features

- **Toggle Column Visibility**: Users can show or hide individual columns using a dropdown menu
- **Visual Indicators**: The dropdown button shows a badge with the number of hidden columns
- **Persistent State**: Column visibility state is preserved across page navigation and can be stored in the URL
- **Responsive Design**: The feature works well on both desktop and mobile devices

## Usage

### Basic Usage

The column visibility feature is enabled by default. Simply use the DataTable component as usual:

```tsx
<DataTable
    columns={columns}
    data={data}
    sorting={sorting}
    onSortingChange={setSorting}
    columnVisibility={columnVisibility}
    onColumnVisibilityChange={setColumnVisibility}
/>
```

### Disabling Column Visibility

To disable the column visibility feature, set `showColumnVisibility={false}`:

```tsx
<DataTable columns={columns} data={data} sorting={sorting} onSortingChange={setSorting} showColumnVisibility={false} />
```

### State Management

The column visibility state should be managed in your component:

```tsx
const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

const handleColumnVisibilityChange = (updater: VisibilityState) => {
    setColumnVisibility(updater);
    // Optionally persist to URL or localStorage
    router.get(
        '/your-route',
        {
            columnVisibility: JSON.stringify(updater),
            // ... other params
        },
        { preserveState: true, replace: true },
    );
};
```

### Backend Integration

To persist column visibility state in the URL, update your controller to handle the `columnVisibility` parameter:

```php
// Handle column visibility state
$columnVisibility = [];
$rawColumnVisibility = $request->input('columnVisibility');
if (is_string($rawColumnVisibility) && $rawColumnVisibility !== '') {
    $decoded = json_decode($rawColumnVisibility, true);
    if (is_array($decoded)) {
        $columnVisibility = $decoded;
    }
}

return Inertia::render('YourPage', [
    'tableState' => [
        'sort' => $sortField . ':' . $sortDir,
        'perPage' => $perPage,
        'columnVisibility' => $columnVisibility,
    ],
    // ... other data
]);
```

## UI Components

The column visibility feature uses the following UI components:

- **Dropdown Menu**: Contains checkboxes for each column
- **Eye Icon**: Indicates the column visibility functionality
- **Badge**: Shows the number of hidden columns
- **Checkboxes**: Allow users to toggle individual columns

## Column Configuration

By default, all columns can be hidden. To prevent a column from being hidden, set `enableHiding: false` in the column definition:

```tsx
const columns: ColumnDef<YourType>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableHiding: false, // This column cannot be hidden
    },
    {
        accessorKey: 'name',
        header: 'Name',
        // This column can be hidden (default behavior)
    },
];
```

## Styling

The column visibility controls use the existing design system classes and can be customized by modifying the component styles in `resources/js/components/data-table.tsx`.

## Browser Compatibility

This feature works in all modern browsers that support:

- CSS Grid and Flexbox
- ES6+ JavaScript features
- React 18+ features
