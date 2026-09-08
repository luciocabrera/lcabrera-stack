/**
 * The rule blocks both ESLint factories set identically.
 *
 * Package-internal: it is not in `exports`, because it is here to keep one copy
 * of these blocks rather than to be a contract. The two factories are otherwise
 * independent — one carries the React/StyleX layers, the other deliberately does
 * not — and these were the only part that had drifted apart by being written
 * twice.
 *
 * The `security/*` escalations are from `warn` to `error` so a
 * bulk-suppression baseline can cover the inherited findings while NEW
 * occurrences fail the gate: suppressions only apply at error severity, so a
 * warning is unbaselineable and therefore unenforceable.
 */

export const SHARED_PLUGIN_RULE_SEVERITIES = {
  'security/detect-non-literal-fs-filename': 'error',
  'security/detect-non-literal-regexp': 'error',
  'security/detect-object-injection': 'off',
  'security/detect-unsafe-regex': 'error',
  'unicorn/consistent-boolean-name': [
    'error',
    {
      prefixes: {
        are: true,
      },
    },
  ],
  'unicorn/filename-case': 'off',
  // Both spellings of a Node builtin import pass. The rule's default asks for
  // `import path from 'node:path'`, on the reading that `path.join(a, b)` says
  // at the call site what a bare `join(a, b)` does not. That is a fair point and
  // it is not free here: `path` is also the obvious name for the thing itself,
  // and the tooling scripts bind it — `const path = join(directory, name)` — in
  // dozens of places, where a default import would be shadowed inside the very
  // function that needs it. Renaming real variables to satisfy a spelling is
  // the wrong way round, and a second import name for one module is worse than
  // the mix. Both styles are legible; neither is a defect.
  //
  // The key is `path`, not `node:path`: the rule strips the `node:` prefix
  // before it looks a module up, so a `node:`-prefixed key matches nothing and
  // leaves the default in force — which reads exactly like a config that
  // applied.
  'unicorn/import-style': [
    'error',
    { styles: { path: { default: true, named: true } } },
  ],
  'unicorn/name-replacements': 'off',
  'unicorn/no-array-reduce': 'off',
  // `checkArguments` off, because in argument position the rule cannot tell a
  // redundant `undefined` from a load-bearing one, and its fixer deletes both.
  // `reduce(fn, undefined)` is the case that proves it: dropping the initial
  // value changes an empty array from `undefined` to a thrown TypeError, and
  // the fixer did exactly that to `earliestDay` before a suite caught it. The
  // same hazard applies to any call that distinguishes an absent argument from
  // an explicit `undefined` one. A useless `undefined` in a return or a
  // variable is still reported; only the position the fixer is unsafe in is
  // exempt.
  'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
  // The auto-fixer rewrites http:// to https:// inside string literals, which
  // silently corrupts test fixtures and local-dev URLs — a fixture asserting
  // that an http origin is rejected became https, and the test inverted.
  'unicorn/prefer-https': 'off',
  'unicorn/prefer-query-selector': 'off',
  'unicorn/prevent-abbreviations': 'off',
  // New in unicorn 73's recommended set. Off deliberately and temporarily, not
  // as a verdict on the rule: its default `multiline` fixer rewrites every
  // one-line `/** … */` doc comment into an asterisk-less three-line block,
  // which is not JSDoc, and choosing between that, `single-line` and off is a
  // house-style call that should not be made under release pressure. #828
  // decides it; an off-switch with no expiry is how `minimumReleaseAgeExclude`
  // rotted.
  'unicorn/single-line-block-comment-style': 'off',
};

/**
 * The config block for plain JavaScript files — a project's own tooling and
 * config scripts, which are Node whatever the workspace around them targets.
 *
 * `globals` is a parameter rather than an import because the two factories reach
 * it differently: the base one imports it statically, and the React one resolves
 * it from the consumer's own `tsconfigRootDir`.
 *
 * The three `security/*` entries are the judgements here; the rest are facts
 * about the runtime. Each of those rules exists to catch untrusted input
 * reaching a dangerous construct, and a file in this block has no untrusted
 * input: it is a command a developer ran, over paths and text the repository or
 * the command line gave it.
 *
 * `detect-non-literal-fs-filename` flags any `readFileSync(x)` with a computed
 * path, because it cannot trace where `x` came from and a path built from a
 * request is how directory traversal works. Building that path with `join()` is
 * the whole job here.
 *
 * `detect-unsafe-regex` and `detect-non-literal-regexp` are the same argument
 * about a different construct: catastrophic backtracking is an attack when the
 * subject is a request, and a slow scan of the repository's own markdown when it
 * is not. The heuristic behind the first is a star-height approximation that
 * reports ordinary anchored patterns.
 *
 * All three stay on wherever a request could reach, which is everywhere this
 * block does not match. Scope them back the moment one of these files starts
 * serving something.
 *
 * @param {{ globals: { node: Record<string, unknown> } }} args
 */
export const createNodeScriptFileConfig = ({ globals }) => ({
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  languageOptions: {
    ecmaVersion: 'latest',
    globals: {
      ...globals.node,
    },
  },
  rules: {
    'no-console': 'off',
    'security/detect-non-literal-fs-filename': 'off',
    'security/detect-non-literal-regexp': 'off',
    'security/detect-unsafe-regex': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prevent-abbreviations': 'off',
  },
});

/**
 * The narrower block for CommonJS files, which `.cjs` declares a file to be.
 *
 * `require()` is not a lapse there, it is the module system the extension
 * selects — so the rule that bans it has nothing to say about these files. It
 * is deliberately not folded into the Node block above: a `require()` in a
 * `.mjs` file is a real error, and that block covers `.mjs` too.
 */
export const createCommonJsFileConfig = () => ({
  files: ['**/*.cjs'],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
  },
});
