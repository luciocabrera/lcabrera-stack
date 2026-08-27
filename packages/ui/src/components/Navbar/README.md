# Navbar Component

A flexible navigation Navbar component that can render buttons or navigation links with support for both vertical and horizontal orientations.

**It is internal to `@lcabrera/ui`.** The package's export map carries the
Navbar types subpath and no barrel beside it, so the component itself does not
resolve from outside the package; a consumer reaches it by rendering `AppShell`,
which composes it. The examples below are written from inside the package and
use its own `#ui/*` specifier.

## Features

- ✅ **Flexible rendering**: Supports both buttons and NavLinks
- ✅ **Dual orientation**: Works vertically (sidebar) or horizontally (top bar)
- ✅ **Responsive**: Uses container queries to adapt layout
- ✅ **Accessible**: Includes proper ARIA attributes and navigation semantics
- ✅ **Testable**: Built-in `data-testid` support
- ✅ **Design system**: Uses tokens from the design system
- ✅ **Active state**: NavLinks show active state automatically

## Usage

### Basic Vertical Navigation (SidePanel)

```tsx
import { Navbar } from '#ui/components/Navbar';
import { Home, Settings, User } from 'lucide-react';

const items = [
  {
    type: 'link',
    to: '/',
    label: 'Home',
    icon: <Home size={20} />,
    'data-testid': 'nav-home',
  },
  {
    type: 'link',
    to: '/settings',
    label: 'Settings',
    icon: <Settings size={20} />,
    'data-testid': 'nav-settings',
  },
];

<Navbar
  items={items}
  orientation='vertical'
  aria-label='Main navigation'
  data-testid='main-Navbar'
/>;
```

### Horizontal Action Bar

```tsx
const actions = [
  {
    type: 'button',
    label: 'Save',
    icon: <Save size={20} />,
    onClick: handleSave,
    'data-testid': 'action-save',
  },
  {
    type: 'button',
    label: 'Export',
    icon: <Download size={20} />,
    onClick: handleExport,
    color: 'primary',
    'data-testid': 'action-export',
  },
];

<Navbar
  items={actions}
  orientation='horizontal'
  aria-label='Document actions'
/>;
```

### Mixed Buttons and Links

```tsx
const mixedItems = [
  {
    type: 'link',
    to: '/profile',
    label: 'Profile',
    icon: <User size={20} />,
  },
  {
    type: 'button',
    label: 'Logout',
    onClick: handleLogout,
    color: 'error',
  },
];

<Navbar items={mixedItems} aria-label='User menu' />;
```

## Props

### NavbarProps

| Prop          | Type                         | Required | Default      | Description                              |
| ------------- | ---------------------------- | -------- | ------------ | ---------------------------------------- |
| `items`       | `NavbarItem[]`               | ✅       | -            | Array of Navbar items (buttons or links) |
| `orientation` | `'horizontal' \| 'vertical'` | -        | `'vertical'` | Layout direction                         |
| `aria-label`  | `string`                     | ✅       | -            | Accessible label for the navigation      |
| `data-testid` | `string`                     | -        | -            | Test identifier for the Navbar           |

### NavbarButtonItem

| Prop          | Type                   | Required | Description                    |
| ------------- | ---------------------- | -------- | ------------------------------ |
| `type`        | `'button'`             | ✅       | Item type                      |
| `label`       | `string`               | ✅       | Button text                    |
| `icon`        | `ReactNode`            | -        | Optional icon                  |
| `onClick`     | `() => void`           | -        | Click handler                  |
| `color`       | `ButtonProps['color']` | -        | Button color variant           |
| `size`        | `ButtonProps['size']`  | -        | Button size (defaults to 'md') |
| `isDisabled`  | `boolean`              | -        | Disabled state                 |
| `data-testid` | `string`               | -        | Test identifier                |

### NavbarLinkItem

| Prop           | Type        | Required | Description            |
| -------------- | ----------- | -------- | ---------------------- |
| `type`         | `'link'`    | ✅       | Item type              |
| `to`           | `string`    | ✅       | Navigation target      |
| `label`        | `string`    | ✅       | Link text              |
| `icon`         | `ReactNode` | -        | Optional icon          |
| `end`          | `boolean`   | -        | Match exact path only  |
| `aria-current` | `string`    | -        | Current page indicator |
| `data-testid`  | `string`    | -        | Test identifier        |

## Responsive Behavior

The Navbar uses container queries to adapt its layout:

- **Vertical orientation**: Always displays items in a column
- **Horizontal orientation**:
  - Wraps items by default
  - Switches to column layout when container width < 400px

## Accessibility

- Uses semantic `<nav>` element
- Requires `aria-label` for screen readers
- NavLinks include proper `aria-current` support
- Focus indicators follow design system
- Keyboard navigation fully supported

## Styling

The component uses StyleX with design system tokens:

- Colors: From `colors.stylex`
- Spacing: From `base.stylex`
- Active state: Custom highlight with brand colors
- Hover state: Subtle background change
- Focus state: Visible outline for accessibility

## Testing

Each item should have a unique `data-testid`:

```tsx
const items = [
  { type: 'link', to: '/', label: 'Home', 'data-testid': 'nav-home' },
  { type: 'button', label: 'Action', 'data-testid': 'action-btn' },
];
```

If not provided, items get auto-generated IDs: `Navbar-item-0`, `Navbar-item-1`, etc.

## Examples

The worked usage is `Navbar.test.tsx`, which renders both item shapes (`type:
'link'` with `to`, and `type: 'button'` with `onClick`) and asserts the rendered
element for each. It is a test file, and the published package excludes those, so
it is beside this file in the repository and not in an install.

There is no `Navbar.examples.tsx`. This section pointed at one for a long time
and nothing noticed, because the documented-path gate did not check a relative
link unless it ended in `.md` (#756).
