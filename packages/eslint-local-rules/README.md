# @lcabrera/eslint-plugin

Custom ESLint rules for TypeScript and React codebases — filename conventions,
clean import paths, readonly props, and single-component modules.

These rules exist because each one enforces a convention that no other linter
checks, and that a code review otherwise has to catch by eye every time.

## Install

```bash
npm install --save-dev @lcabrera/eslint-plugin
```

`eslint` (v9+) is a peer dependency. The plugin ships flat-config only.

## Usage

```js
// eslint.config.mjs
import localRules from '@lcabrera/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'local-rules': localRules },
    rules: {
      'local-rules/clean-import-paths': 'error',
      'local-rules/filename-convention': 'error',
      'local-rules/readonly-props': 'error',
    },
  },
];
```

The plugin key is yours to choose — `local-rules` above is just what this
repository uses, and the rule names are prefixed with whatever you pick.

Rules are opt-in individually; there is no `recommended` preset. Several of
these encode a house style rather than a correctness property, and a preset
would imply the whole set travels together when it does not: enabling
`clean-import-paths` in a project that compiles with `tsc` under NodeNext, where
explicit extensions are **required**, would be actively wrong.

## Rules

| Rule                                | Fixable | What it enforces                                            |
| ----------------------------------- | ------- | ----------------------------------------------------------- |
| `clean-import-paths`                | ✅      | No file extensions or trailing `/index` on internal imports |
| `destructuring-for-functions`       |         | An object parameter once a function takes 2+ arguments      |
| `domain-folder-filename`            |         | A folder's shared `*.types`/`*.constants` is named after it |
| `filename-convention`               |         | Base-name case follows the file's type suffix               |
| `merge-duplicate-imports`           | ✅      | One import statement per source module                      |
| `no-inline-type-imports`            | ✅      | `import type { X }` over `import { type X }`                |
| `no-type-definitions-in-components` |         | Types live in `*.types.ts`, not in component files          |
| `readonly-props`                    | ✅      | Every member of a `*Props` type is `readonly`               |
| `single-component-export`           |         | One component per `*.component.tsx`                         |
| `type-suffix-naming`                | ✅      | `Args`/`Props` suffixes over `Arguments`/`Properties`       |

Three rules take options; the rest take none.

### `clean-import-paths`

Disallows file extensions and trailing `/index` segments on internal
import/export paths.

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

**Auto-fix:** removes `.ts`/`.tsx` suffixes and trailing `/index`.

**Options.** `aliasPrefixes` (default `['@/']`) names the path aliases that mark
an import as internal. Relative prefixes (`./`, `../`) are always internal and
are not configurable — they are what makes a path internal in any project.

```js
'local-rules/clean-import-paths': ['error', { aliasPrefixes: ['~/', '#app/'] }],
```

An alias you do not list is treated as an external package and left alone.

**Do not enable this rule** where explicit extensions are required — a project
compiling with `tsc` under `module: nodenext` needs them, and this rule would
fight the compiler.

### `domain-folder-filename`

Enforces **where** a shared `*.types.ts` / `*.constants.ts` may live and what it
must be called. Three folder shapes exist and only one takes the rule:

| Folder shape  | The folder…                           | The file is named after… | Example                                   |
| ------------- | ------------------------------------- | ------------------------ | ----------------------------------------- |
| **Domain**    | _is_ the subject                      | the folder               | `filters/filters.types.ts`                |
| **Artifact**  | holds one component, context or route | the artifact             | `TableConfig/TableConfigContext.types.ts` |
| **Catch-all** | names a _kind_, not a subject         | its own subject          | `types/theme.types.ts`                    |

"Exactly one `*.constants.ts` per domain folder" follows from the naming rather
than being counted: two files in one folder cannot both be
`<folder>.constants.ts`.

The hard part is telling the shapes apart from the path, and the rule is
deliberate about how it does it, because the obvious answer is wrong.
PascalCase separates a _component_ folder from a domain folder but not a
_route_ one — `new-order/` and `group-query-builder/` are both kebab-case and
only the first may name a file after its contents. So the rule treats a
PascalCase folder as an artifact folder, and exempts everything under an
`artifactFolders` tree outright.

It does not read the directory to look for a marker file. That would classify
route folders precisely, but a lint rule that stats the filesystem is neither
hermetic nor cheap, and it needs a non-literal `fs` call — which
`eslint-plugin-security` flags. Measured against every `*.types.ts` and
`*.constants.ts` in the repository this rule was written for, the path-only
classification matches the directory-reading one exactly.

**What the `artifactFolders` exemption means for you.** Nothing under one is
checked — not the folder pairing, and not the artifact naming either. That is
the price of staying hermetic, and it is a real gap rather than a claim that
route modules need no convention. If you want route folders covered, the
discriminator that works is a marker file: a folder is an artifact folder when it
holds a `*.component.tsx`, `*.layout.tsx`, `*.error-boundary.tsx`,
`*.context.ts(x)`, `*.loader.ts`, `*.action.ts`, `*.clientAction.ts` or
`*.meta.ts`, and the `*.types` / `*.constants` base must name one of them. That
needs a directory listing, so it belongs in a repo-level script rather than in
this rule; the repository this plugin comes from runs exactly that check as
`route-names:verify` (`scripts/verify-route-artifacts.mjs`), and keeps its copy
of the option defaults above in step with this rule through a test.

**❌ Disallowed:**

```
db/group-query-builder/aggregate-sql.constants.ts   # → group-query-builder.constants.ts
errors/pg-error-fields.types.ts                     # → errors.types.ts
components/Table/persistence.constants.ts           # names no artifact in Table/
```

**✅ Enforced:**

```
db/group-query-builder/group-query-builder.constants.ts
routes/orders/new-order/newOrder.constants.ts       # artifact folder
constants/virtualization.constants.ts               # catch-all folder
```

**Options.**

Each option **replaces** its default wholesale rather than extending it.

`artifactFolders` (default `['routes']`) names the directories whose entire
subtree holds route modules. A route folder is a URL segment and its modules are
named for the route, which is not always the same word.

`catchAllFolders` (default `actions`, `config`, `constants`, `contexts`,
`helpers`, `hooks`, `queries`, `schemas`, `selectors`, `services`, `src`,
`types`, `utils`) names the directories that name a kind.

`pairedSuffixes` (default `['constants', 'types']`) names the suffixes the
pairing applies to. `.schema` / `.service` / `.api` are deliberately absent —
they have no settled convention here, and enforcing one would be a guess.

```js
'local-rules/domain-folder-filename': ['error', { artifactFolders: ['routes', 'pages'] }],
```

### `filename-convention`

Enforces the base-name case that goes with each file suffix. Only files matching
`<base>.<suffix>.<ext>` are checked, so `index.ts` and `root.tsx` are untouched,
and an unrecognised suffix is skipped rather than guessed at.

| Suffix                                       | Base-name case          | Example                       |
| -------------------------------------------- | ----------------------- | ----------------------------- |
| `.component` / `.layout` / `.error-boundary` | PascalCase              | `CarSales.error-boundary.tsx` |
| `.hook`                                      | camelCase, `use` prefix | `useVirtualization.hook.ts`   |
| `.loader` / `.action` / `.meta`              | kebab-case              | `enterprise-orders.loader.ts` |
| `.api` / `.schema` / `.service` / `.util`    | camelCase               | `fetchOrdersPage.util.ts`     |

If you use `unicorn/filename-case`, turn it off — this rule owns filename casing,
and the suffix is what drives the convention.

**Options.**

`suffixCase` overrides the expected case for a suffix, so a package with a
different convention keeps the rule live instead of switching it off:

```js
// this package's own `.util` files are kebab-case, and a camelCase one still fails
'local-rules/filename-convention': ['error', { suffixCase: { util: 'kebab-case' } }],
```

`deprecatedSuffixes` maps a retired spelling to its replacement, so a rename
migration is enforced rather than remembered. It defaults to
`{ errorBoundary: 'error-boundary' }` — this repository's own migration history.
Pass `{}` to drop it, or your own map to enforce yours:

```js
'local-rules/filename-convention': ['error', { deprecatedSuffixes: { helpers: 'util' } }],
```

### `readonly-props`

Requires every member a `*Props` type declares to be `readonly`. Autofixable.

Members inherited through an intersection with a React type belong to React, not
to you, and are not checked.

**❌ Disallowed:**

```typescript
type AppProvidersProps = {
  children: ReactNode; // props are never mutated
};
```

**✅ Enforced:**

```typescript
type AppProvidersProps = {
  readonly children: ReactNode;
};

// inherited members are React's — only the declared extras are checked
type CardProps = ComponentPropsWithoutRef<'div'> & {
  readonly padding?: CardPadding;
};
```

### `no-inline-type-imports`

Enforces separate `import type` syntax instead of inline type imports.

**❌ Disallowed:**

```typescript
import { type User, type Post } from './types';
import type { type User } from './types'; // redundant
```

**✅ Enforced:**

```typescript
import type { User, Post } from './types';
```

### `merge-duplicate-imports`

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

Imports that bind a namespace are left alone — `import { * as ns }` is not valid
JavaScript, so there is no single statement to merge them into:

```typescript
// ✅ Allowed: not mergeable, so not reported
import * as ns from './module';
import { B } from './module';
```

### `destructuring-for-functions`

Enforces the object-parameter pattern for functions taking 2+ parameters, so
call sites name their arguments and argument order stops being load-bearing.

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

### `type-suffix-naming`

Enforces `Args`/`Props` type suffixes over the spelled-out forms.

**❌ Disallowed:**

```typescript
type ProcessDataArguments = { data: string }; // should use 'Args'
type ButtonProperties = { label: string }; // should use 'Props'
```

**✅ Enforced:**

```typescript
type ProcessDataArgs = { data: string };
type ButtonProps = { label: string };
```

**Auto-fix:** renames `Arguments` → `Args` globally, and `Properties` → `Props`
in React files (`.tsx`/`.jsx`).

### `no-type-definitions-in-components`

Enforces that type definitions live in separate `*.types.ts` files rather than
inside component files.

A component file is one whose suffix is `.component.tsx`, `.layout.tsx` or
`.error-boundary.tsx` — the set is declared once and shared with
`filename-convention`, so the two rules cannot disagree about what a component
file is. (They did, once: `no-type-definitions-in-components` sat dead on every
error boundary in this repo because it still matched a suffix spelling
`filename-convention` had already replaced.)

**❌ Disallowed:**

```tsx
// Button.component.tsx
type ButtonProps = { label: string }; // move this to Button.types.ts

export const Button = ({ label }: ButtonProps) => <button>{label}</button>;
```

**✅ Enforced:**

```tsx
// Button.types.ts
export type ButtonProps = { readonly label: string };

// Button.component.tsx
import type { ButtonProps } from './Button.types';

export const Button = ({ label }: ButtonProps) => <button>{label}</button>;
```

### `single-component-export`

Enforces that `*.component.tsx` files export exactly one component.

**❌ Disallowed:**

```tsx
// Forms.component.tsx
export const LoginForm = () => <form />;
export const RegisterForm = () => <form />; // second component not allowed
```

**✅ Enforced:**

```tsx
// LoginForm.component.tsx
export const LoginForm = () => <form />;

// RegisterForm.component.tsx
export const RegisterForm = () => <form />;
```

## Development

Rules are TypeScript sources under `src/`, built to `dist/` with `vp pack`.
Inside this monorepo nothing needs building first: `exports` points at `src`, and
ESLint loads the rules through Node's type stripping. `publishConfig.exports`
swaps to `dist` at pack time, because a `.ts` file inside a consumer's
`node_modules` is not loadable at all.

### Adding a rule

1. Create `src/<rule-name>.ts` and default-export a rule built with
   `ESLintUtils.RuleCreator`:

   ```typescript
   import { ESLintUtils } from '@typescript-eslint/utils';

   const createRule = ESLintUtils.RuleCreator(
     (name) => `https://github.com/luciocabrera/lcabrera-stack/rules/${name}`,
   );

   export default createRule({
     create(context) {
       return {
         // AST visitors
       };
     },
     defaultOptions: [],
     meta: {
       docs: { description: 'What it enforces' },
       messages: { myMessage: 'Message template {{variable}}' },
       schema: [],
       type: 'suggestion',
     },
     name: 'my-rule',
   });
   ```

2. Register it in `src/index.ts`.
3. Add `src/<rule-name>.test.ts`. This is not optional — `rules-have-tests.test.ts`
   fails the build for a registered rule with no suite. A rule that stops
   matching anything reports exactly the same clean pass as code that is
   correct, so the test is the only thing that can tell the two apart.
4. Anything a consumer would have to match to use the rule — an alias, a
   filename suffix, a naming migration — belongs in `meta.schema` as an option
   with a default, not hardcoded.

## License

MIT
