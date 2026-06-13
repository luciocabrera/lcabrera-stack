# Custom ESLint Rules

This directory contains custom ESLint rules written in **TypeScript** for enforcing project-specific code patterns.

## Rules

### 1. `no-inline-type-imports`

Enforces separate `import type` syntax instead of inline type imports.

**❌ Disallowed:**

```typescript
import { type User, type Post } from './types';
import type { type User } from './types'; // Redundant
```

**✅ Enforced:**

```typescript
import type { User, Post } from './types';
```

### 2. `merge-duplicate-imports`

Merges multiple import statements from the same source into a single import.

**❌ Disallowed:**

```typescript
import { A } from './module';
import { B } from './module';
```

**✅ Enforced:**

```typescript
import { A, B } from './module';
```

### 3. `destructuring-for-functions`

Enforces object parameter pattern for functions with 2+ parameters.

**❌ Disallowed:**

```typescript
function buildComponent(name: string, props: Props, config: Config) {
  // ...
}
```

**✅ Enforced:**

```typescript
type BuildComponentArgs = {
  name: string;
  props: Props;
  config: Config;
};

function buildComponent({ name, props, config }: BuildComponentArgs) {
  // ...
}
```

### 4. `type-suffix-naming`

Enforces proper type suffix naming conventions (Standard 002).

**❌ Disallowed:**

```typescript
type ProcessDataArguments = { data: string }; // Should use 'Args'
type ButtonProperties = { label: string }; // Should use 'Props'
```

**✅ Enforced:**

```typescript
type ProcessDataArgs = { data: string };
type ButtonProps = { label: string };
```

**Auto-fix:** Renames type declarations from `Arguments` -> `Args` globally. Renames `Properties` -> `Props` in React files (`.tsx`/`.jsx`).

### 5. `no-type-definitions-in-components`

Enforces that type definitions live in separate `*.types.ts` files rather than inside component files.

**❌ Disallowed:**

```typescript
// Button.component.tsx
type ButtonProps = { label: string }; // move this to Button.types.ts

export const Button = ({ label }: ButtonProps) => <button>{label}</button>;
```

**✅ Enforced:**

```typescript
// Button.types.ts
export type ButtonProps = { label: string };

// Button.component.tsx
import type { ButtonProps } from './Button.types';
export const Button = ({ label }: ButtonProps) => <button>{label}</button>;
```

### 6. `single-component-export`

Enforces that `*.component.tsx` files export exactly one component — no multi-component files.

**❌ Disallowed:**

```typescript
// Forms.component.tsx
export const LoginForm = () => { ... };
export const RegisterForm = () => { ... }; // second export not allowed
```

**✅ Enforced:**

```typescript
// LoginForm.component.tsx
export const LoginForm = () => { ... };

// RegisterForm.component.tsx
export const RegisterForm = () => { ... };
```

### 7. `clean-import-paths`

Enforces clean internal import/export paths by disallowing file extensions and trailing `/index` segments.

**❌ Disallowed:**

```typescript
import { Button } from './components/Button/index.ts';
import type { Props } from './Thing.types.ts';
export { utils } from '@/utils/index';
```

**✅ Enforced:**

```typescript
import { Button } from './components/Button';
import type { Props } from './Thing.types';
export { utils } from '@/utils';
```

**Auto-fix:** Removes `.ts`/`.tsx` suffixes and trailing `/index` from internal `./`, `../`, and `@/` import/export specifiers.

## Monorepo integration

The rules are compiled to JavaScript in the `build/` directory. ESLint loads them via the `eslint-local-rules-shared` package from `eslint.config.mjs` at the workspace root:

```js
import localRules from 'eslint-local-rules-shared';
// rules are registered under the 'local-rules/' namespace
```

**Important:** run `vp run build` after any change to the TypeScript source — ESLint loads the compiled `.js` files, not the TypeScript source directly.

## Development

All rules are written in TypeScript and compiled to JavaScript before being loaded by ESLint.

### Building

Build the rules:

```bash
vp run build
```

This compiles TypeScript files to JavaScript in the `build/` directory.

### Creating a New Rule

1. Create a new TypeScript file in this directory (e.g., `my-rule.ts`)
2. Export a `Rule.RuleModule` as the default export:

```typescript
import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      category: 'Best Practices',
      description: 'My custom rule description',
      recommended: false,
    },
    fixable: 'code', // or undefined if no auto-fix
    messages: {
      myMessage: 'Error message template {{variable}}',
    },
    schema: [],
    type: 'suggestion',
  },
  create(context) {
    return {
      // AST visitor methods
    };
  },
};

export default rule;
```

3. Add the rule to [index.ts](index.ts):

```typescript
import myRule from './my-rule.js';

export default {
  rules: {
    'my-rule': myRule,
    // ... other rules
  },
};
```

4. Build the rules: `vp run build`

5. Use in `eslint.config.mjs`:

```javascript
rules: {
  'local-rules/my-rule': 'error',
}
```

## Architecture

- **Source files**: TypeScript files (`.ts`) in this directory
- **Build output**: JavaScript files (`.js`) in `build/` directory
- **ESLint config**: Loads from `build/index.js` (compiled output)
- **Type safety**: Full TypeScript support with ESLint API types

The build process uses a separate `tsconfig.json` to compile only the custom rules, keeping them isolated from the main project build.
