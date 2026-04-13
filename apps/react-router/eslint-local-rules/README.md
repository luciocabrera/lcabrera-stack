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

**Auto-fix:** Renames type declarations from `Arguments` → `Args` and `Properties` → `Props`.

## Development

All rules are written in TypeScript and compiled to JavaScript before being loaded by ESLint.

### Building

Build the rules:

```bash
npm run build:eslint-rules
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

4. Build the rules: `npm run build:eslint-rules`

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
