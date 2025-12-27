# VirtualizedTable Component

A high-performance, scalable virtualized table component for React applications built with StyleX.

## Features

- **Virtualized Rendering**: Only renders visible rows, enabling smooth performance with large datasets (10,000+ rows)
- **Type-Safe**: Built with TypeScript for full type safety
- **StyleX Styling**: Uses StyleX for optimal performance and type-safe styles
- **Configurable**: Customizable row height, overscan, and styling
- **Accessibility**: Includes proper ARIA attributes for screen readers
- **Responsive**: Automatically adjusts to container height changes

## Usage

```tsx
import { VirtualizedTable } from './components/VirtualizedTable';

const columns = [
  { key: 'id', label: 'ID', minWidth: 80 },
  { key: 'name', label: 'Name', minWidth: 200 },
  { key: 'email', label: 'Email', minWidth: 250 },
];

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  // ... more rows
];

function App() {
  return (
    <VirtualizedTable
      columns={columns}
      data={data}
      rowHeight={32}
      overscan={6}
      style={{ height: 600 }}
    />
  );
}
```

## Props

### `VirtualizedTableProps<T>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `VirtualizedTableColumn[]` | required | Array of column definitions |
| `data` | `T[]` | required | Array of data objects to display |
| `overscan` | `number` | `6` | Number of extra rows to render outside viewport for smoother scrolling |
| `rowHeight` | `number` | `32` | Height of each row in pixels |
| `style` | `React.CSSProperties` | `undefined` | Additional inline styles for the container |

### `VirtualizedTableColumn`

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique identifier for the column, used to access data |
| `label` | `string` | Display label for the column header |
| `minWidth` | `number` (optional) | Minimum width for the column (default: 120px) |

## Type Constraints

The generic type `T` must extend `Record<string, unknown>`, ensuring data objects are key-value pairs compatible with the column keys.

## Performance Considerations

- **Virtualization**: Only renders visible rows plus overscan buffer
- **Memoization**: Consider wrapping in `React.memo()` if parent re-renders frequently
- **Large Datasets**: Tested with 10,000+ rows with smooth scrolling
- **StyleX**: CSS-in-JS solution with zero runtime overhead

## Coding Standards

This component follows the project's coding guidelines:
- No inline styles in JSX (uses StyleX for all styling)
- TypeScript strict mode enabled
- Proper type annotations for all props and state
- Nullish coalescing (`??`) instead of logical OR (`||`)
- Alphabetically ordered properties in StyleX objects

## Browser Support

Compatible with all modern browsers supporting:
- CSS Grid/Flexbox
- Sticky positioning
- Scroll events

## Accessibility

- Semantic HTML table structure
- Sticky headers for improved navigation
- ARIA hidden spacer rows for screen readers
- Keyboard navigation support (native table behavior)
