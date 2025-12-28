# Component Setup Instructions - React Component Structure Guide

## Overview

This guide provides a standardized approach for creating React components following best practices for maintainability, scalability, and testability. Each component follows a consistent folder structure with proper separation of concerns.

## Component Structure

### Directory Layout

Each component should have its own directory containing the following files:

```
ComponentName/
├── ComponentName.tsx          # Main component implementation
├── ComponentName.types.ts     # Type definitions
├── ComponentName.stylex.ts    # StyleX styles
└── index.ts                   # Barrel export file
```

## File-by-File Guide

### 1. Component Types File (`ComponentName.types.ts`)

**Purpose:** Define all TypeScript types and interfaces for the component.

**Template:**

```typescript
import type { ComponentPropsWithoutRef } from 'react';

// For HTML elements without ref forwarding
export type ComponentNameProps = ComponentPropsWithoutRef<'div'>;

// OR for HTML elements with ref forwarding
import type { ComponentPropsWithRef } from 'react';
export type ComponentNameProps = ComponentPropsWithRef<'div'>;

// For custom props, extend the base props
export type ComponentNameProps = ComponentPropsWithoutRef<'div'> & {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};
```

**Guidelines:**

- Use `ComponentPropsWithoutRef<'element'>` for most cases
- Use `ComponentPropsWithRef<'element'>` when the component needs to forward refs
- Replace `'div'` with the appropriate HTML element tag (e.g., `'button'`, `'h1'`, `'p'`, `'section'`)
- Add custom props by extending the base props with intersection types (`&`)
- Export all types that might be used by consumers of the component
- Define union types for variants, sizes, colors, etc.

### 2. Component Styles File (`ComponentName.stylex.ts`)

**Purpose:** Contains all StyleX styles for the component.

**Template:**

```typescript
import * as stylex from '@stylexjs/stylex';

// Import design tokens
import { spacing, typography, borderRadius } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const componentNameStyles = stylex.create({
  base: {
    // Base styles here
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSizeBase,
  },

  // Variants (optional)
  variant_primary: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
  },

  variant_secondary: {
    backgroundColor: colors.brandSecondary,
    color: colors.brandSecondaryText,
  },
});
```

**Guidelines:**

- Use design system tokens instead of hardcoded values
- Create separate style definitions for variants
- Use descriptive naming for style keys
- Group related styles together
- Export a single `componentNameStyles` object

### 3. Main Component File (`ComponentName.tsx`)

**Purpose:** The main React component implementation.

**Template:**

```typescript
import * as stylex from '@stylexjs/stylex';

import type { ComponentNameProps } from './ComponentName.types';

import { componentNameStyles } from './ComponentName.stylex';

export const ComponentName = ({
  children,
  variant = 'primary',
  ...props
}: ComponentNameProps) => {
  return (
    <div
      data-testid="component-name"
      {...props}
      {...stylex.props(
        componentNameStyles.base,
        variant && componentNameStyles[`variant_${variant}`]
      )}
    >
      {children}
    </div>
  );
};
```

**Guidelines:**

- Import type definitions from the `.types.ts` file
- Import styles from the `.stylex.ts` file
- Use destructuring with rest props (`...props`) to allow HTML attributes to be passed through
- Always add `data-testid` attribute for testing purposes
  - Use kebab-case for the testid (e.g., `data-testid="card-header"`)
- Spread props before StyleX props: `{...props} {...stylex.props(...)}`
- Set default values for optional props in the function signature
- Export as named export (not default export)

### 4. Barrel Export File (`index.ts`)

**Purpose:** Provides a clean import path for the component.

**Template:**

```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

**Guidelines:**

- Export the component
- Export types that consumers might need
- Keep it simple - just re-exports
- Use named exports

## Parent Directory Barrel Export

When you have multiple related components in a parent directory, create an `index.ts` file that exports all components:

**Template:**

```typescript
export { ComponentOne } from './ComponentOne';
export type { ComponentOneProps } from './ComponentOne';
export { ComponentTwo } from './ComponentTwo';
export type { ComponentTwoProps } from './ComponentTwo';
```

## Step-by-Step Implementation Process

### Step 1: Create Directory Structure

```bash
mkdir src/components/ComponentName
```

### Step 2: Create Types File

1. Create `ComponentName.types.ts`
2. Decide which HTML element the component renders
3. Choose between `ComponentPropsWithoutRef` or `ComponentPropsWithRef`
4. Add any custom props as an intersection type
5. Define union types for variants if needed

### Step 3: Create Styles File

1. Create `ComponentName.stylex.ts`
2. Import necessary design tokens
3. Define base styles using `stylex.create()`
4. Create variants if needed
5. Export the styles object

### Step 4: Create Component Implementation

1. Create `ComponentName.tsx`
2. Import types and styles
3. Implement the component with proper destructuring
4. Add `data-testid` attribute
5. Apply StyleX props correctly
6. Ensure props are spread in the right order

### Step 5: Create Barrel Export

1. Create `index.ts`
2. Export component and types
3. Verify clean import path works

### Step 6: Update Parent Index (if applicable)

1. Update parent directory's `index.ts`
2. Add exports for the new component

### Step 7: Quality Checks

Run the following commands to ensure quality:

```bash
# Format code
yarn format

# Run linter
yarn lint

# Type check
yarn tsc --noEmit
```

## Naming Conventions

### File Names

- Use PascalCase for component files: `CardHeader.tsx`
- Include component name in all related files: `CardHeader.types.ts`, `CardHeader.stylex.ts`
- Use `index.ts` for barrel exports

### Component Names

- Use PascalCase: `CardHeader`
- Be descriptive and specific
- Follow the pattern: `ParentComponentChildPart` (e.g., `CardHeader`, `CardBody`)

### Test IDs

- Use kebab-case: `data-testid="card-header"`
- Match the component name in lowercase with hyphens
- Be descriptive and unique within the application

### Type Names

- Suffix with `Props`: `CardHeaderProps`
- Use PascalCase for all type names
- Create specific types for variants: `CardColor`, `CardElevation`

### Style Objects

- Suffix with `Styles`: `cardHeaderStyles`
- Use camelCase for the exported object
- Use snake_case for variant keys: `variant_primary`, `size_lg`

## Common Patterns

### Pattern 1: Simple Component

For simple components that just wrap an HTML element:

```typescript
// ComponentName.types.ts
import type { ComponentPropsWithoutRef } from 'react';
export type ComponentNameProps = ComponentPropsWithoutRef<'div'>;

// ComponentName.tsx
export const ComponentName = ({ children, ...props }: ComponentNameProps) => {
  return (
    <div data-testid="component-name" {...props} {...stylex.props(styles.base)}>
      {children}
    </div>
  );
};
```

### Pattern 2: Component with Variants

For components with different visual variants:

```typescript
// ComponentName.types.ts
export type ComponentVariant = 'primary' | 'secondary' | 'tertiary';
export type ComponentNameProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ComponentVariant;
};

// ComponentName.stylex.ts
export const styles = stylex.create({
  base: { /* base styles */ },
  variant_primary: { /* primary variant */ },
  variant_secondary: { /* secondary variant */ },
  variant_tertiary: { /* tertiary variant */ },
});

// ComponentName.tsx
export const ComponentName = ({
  variant = 'primary',
  ...props
}: ComponentNameProps) => {
  return (
    <button
      data-testid="component-name"
      {...props}
      {...stylex.props(
        styles.base,
        styles[`variant_${variant}`]
      )}
    />
  );
};
```

### Pattern 3: Component with Multiple Style Options

For components with size, color, and other options:

```typescript
// ComponentName.types.ts
export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentColor = 'primary' | 'secondary';

export type ComponentNameProps = ComponentPropsWithoutRef<'div'> & {
  size?: ComponentSize;
  color?: ComponentColor;
  elevated?: boolean;
};

// ComponentName.stylex.ts
export const styles = {
  base: baseStyles.component,
  size: sizeVariants,
  color: colorVariants,
  elevated: elevatedVariant,
};

// ComponentName.tsx
export const ComponentName = ({
  size = 'md',
  color = 'primary',
  elevated = false,
  ...props
}: ComponentNameProps) => {
  return (
    <div
      data-testid="component-name"
      {...props}
      {...stylex.props(
        styles.base,
        styles.size[size],
        styles.color[color],
        elevated && styles.elevated
      )}
    />
  );
};
```

## Testing Considerations

### Test IDs

Always add `data-testid` attributes to make components testable:

```typescript
<div data-testid="component-name" {...props}>
```

### Usage in Tests

```typescript
// In your test file
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

test('renders component', () => {
  render(<ComponentName>Content</ComponentName>);
  const element = screen.getByTestId('component-name');
  expect(element).toBeInTheDocument();
});
```

## Props Spreading Order

**CRITICAL:** Always spread props in this order:

```typescript
<element
  data-testid="..."
  {...props}              // Spread custom props first
  {...stylex.props(...)}  // StyleX props last (to prevent overrides)
>
```

This ensures:

1. Custom HTML attributes can be passed through
2. StyleX styles are applied correctly
3. Consumers can override styles if needed

## Import Order

Follow this import order for consistency:

```typescript
// 1. External dependencies
import * as stylex from '@stylexjs/stylex';

// 2. Types (relative imports)
import type { ComponentNameProps } from './ComponentName.types';

// 3. Internal dependencies (relative imports)
import { componentNameStyles } from './ComponentName.stylex';

// 4. Design system tokens (absolute imports with alias)
import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
```

## Design System Integration

### Using Design Tokens

Always use design tokens from the design system:

```typescript
// ✅ Good
import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  component: {
    padding: spacing.md,
    fontSize: typography.fontSizeBase,
    color: colors.textPrimary,
  },
});

// ❌ Bad - hardcoded values
export const styles = stylex.create({
  component: {
    padding: '16px',
    fontSize: '14px',
    color: '#333333',
  },
});
```

### Available Design Tokens

**Spacing:**

- `spacing.xs`, `spacing.sm`, `spacing.md`, `spacing.lg`, `spacing.xl`

**Typography:**

- `typography.fontSizeXs` through `typography.fontSize3xl`
- `typography.fontWeightNormal`, `typography.fontWeightMedium`, `typography.fontWeightSemibold`, `typography.fontWeightBold`
- `typography.lineHeightTight`, `typography.lineHeightNormal`, `typography.lineHeightRelaxed`

**Colors:**

- `colors.textPrimary`, `colors.textSecondary`
- `colors.brandPrimary`, `colors.brandSecondary`
- `colors.success`, `colors.error`, `colors.warning`, `colors.info`
- And many more...

**Border Radius:**

- `borderRadius.sm`, `borderRadius.md`, `borderRadius.lg`, `borderRadius.full`

## Example: Complete Component

Here's a complete example of the CardHeader component:

### CardHeader.types.ts

```typescript
import type { ComponentPropsWithoutRef } from 'react';

export type CardHeaderProps = ComponentPropsWithoutRef<'div'>;
```

### CardHeader.stylex.ts

```typescript
import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const cardHeaderStyles = stylex.create({
  header: {
    padding: spacing.lg,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
});
```

### CardHeader.tsx

```typescript
import * as stylex from '@stylexjs/stylex';

import type { CardHeaderProps } from './CardHeader.types';

import { cardHeaderStyles } from './CardHeader.stylex';

export const CardHeader = ({ children, ...props }: CardHeaderProps) => {
  return (
    <div data-testid="card-header" {...props} {...stylex.props(cardHeaderStyles.header)}>
      {children}
    </div>
  );
};
```

### index.ts

```typescript
export { CardHeader } from './CardHeader';
```

## Checklist for New Components

Use this checklist when creating a new component:

- [ ] Create component directory with PascalCase name
- [ ] Create `.types.ts` file with proper type definitions
  - [ ] Use `ComponentPropsWithoutRef` or `ComponentPropsWithRef`
  - [ ] Add custom props if needed
  - [ ] Export all relevant types
- [ ] Create `.stylex.ts` file with styles
  - [ ] Import design tokens
  - [ ] Define base styles
  - [ ] Create variants if needed
  - [ ] Export styles object
- [ ] Create `.tsx` file with component implementation
  - [ ] Import types and styles
  - [ ] Add `data-testid` attribute
  - [ ] Spread props correctly
  - [ ] Use named export
- [ ] Create `index.ts` barrel export
  - [ ] Export component
  - [ ] Export types
- [ ] Update parent `index.ts` if applicable
- [ ] Run quality checks
  - [ ] `yarn format`
  - [ ] `yarn lint`
  - [ ] `yarn tsc --noEmit`
- [ ] Test the component
  - [ ] Component renders correctly
  - [ ] Props are properly passed through
  - [ ] Styles are applied correctly
  - [ ] Test ID is accessible

## Common Mistakes to Avoid

1. **Wrong Props Spread Order**
   - ❌ `{...stylex.props(...)} {...props}` - StyleX styles will be overridden
   - ✅ `{...props} {...stylex.props(...)}` - Correct order

2. **Missing data-testid**
   - ❌ `<div {...props}>` - Not testable
   - ✅ `<div data-testid="component-name" {...props}>` - Testable

3. **Not Using ComponentPropsWithoutRef/WithRef**
   - ❌ `type Props = { children: ReactNode }` - Missing HTML attributes
   - ✅ `type Props = ComponentPropsWithoutRef<'div'>` - Includes all HTML attributes

4. **Hardcoded Style Values**
   - ❌ `padding: '16px'` - Not using design system
   - ✅ `padding: spacing.md` - Using design tokens

5. **Default Exports**
   - ❌ `export default ComponentName` - Harder to refactor
   - ✅ `export { ComponentName }` - Named exports preferred

6. **Not Spreading Rest Props**
   - ❌ `({ children }: Props)` - Can't pass additional props
   - ✅ `({ children, ...props }: Props)` - Flexible and extensible

## LLM Prompt Template

When asking an LLM to create a component following this structure, use this prompt:

---

**Prompt:**

```
Create a React component named [ComponentName] following these requirements:

1. Create a folder structure with these files:
   - [ComponentName].types.ts
   - [ComponentName].stylex.ts
   - [ComponentName].tsx
   - index.ts

2. In [ComponentName].types.ts:
   - Import ComponentPropsWithoutRef from 'react'
   - Define [ComponentName]Props as ComponentPropsWithoutRef<'[htmlElement]'>
   - Add any custom props as needed: [list custom props]

3. In [ComponentName].stylex.ts:
   - Import stylex
   - Import design tokens from @/design-system/tokens/
   - Create styles with stylex.create()
   - Export as [componentName]Styles

4. In [ComponentName].tsx:
   - Import stylex
   - Import types from .types.ts
   - Import styles from .stylex.ts
   - Implement component with:
     * Proper destructuring with rest props
     * data-testid="[component-name]" in kebab-case
     * Props spread in correct order: {...props} {...stylex.props(...)}
   - Export as named export

5. In index.ts:
   - Export the component
   - Export any types

Additional requirements:
- [List any specific styling needs]
- [List any variants needed]
- [Any other custom requirements]
```

---

## Conclusion

Following this structure ensures:

- **Consistency** across the codebase
- **Maintainability** with clear separation of concerns
- **Testability** with data-testid attributes
- **Type Safety** with proper TypeScript types
- **Scalability** with modular component structure
- **Design System Integration** with proper token usage

This pattern has been validated and tested in production React applications and provides a solid foundation for building component libraries.
