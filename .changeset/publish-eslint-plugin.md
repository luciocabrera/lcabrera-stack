---
'@lcabrera/eslint-plugin': minor
---

The repo's custom ESLint rules are now a published package,
`@lcabrera/eslint-plugin`. It carries the rules that enforce conventions no other
linter checks: filename case per type suffix, clean internal import paths,
readonly `*Props` members, one component per component file, `Args`/`Props` type
suffixes, object parameters past two arguments, and separated type imports.

Flat-config only, `eslint` v9+ as a peer. The plugin is registered under a key
you choose, so the rule prefix is yours rather than the package name's:

```js
import localRules from '@lcabrera/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'local-rules': localRules },
    rules: { 'local-rules/readonly-props': 'error' },
  },
];
```

There is deliberately no `recommended` preset. Several of these rules encode a
house style rather than a correctness property, and a preset would imply the set
travels together when it does not — `clean-import-paths` strips import
extensions, which is wrong in any project compiling with tsc under NodeNext,
where they are required.

The two rules that previously hardcoded this repository's own conventions now
take options with those conventions as defaults, so behaviour is unchanged here
and configurable everywhere else: `clean-import-paths` gained `aliasPrefixes`
(default `['@/']`), and `filename-convention` gained `deprecatedSuffixes`
(default `{ errorBoundary: 'error-boundary' }`).
