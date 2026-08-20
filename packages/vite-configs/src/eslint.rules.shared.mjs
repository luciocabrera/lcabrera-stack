/**
 * The rule blocks both ESLint factories set identically.
 *
 * Package-internal: it is not in `exports`, because it is here to keep one copy
 * of these blocks rather than to be a contract. The two factories are otherwise
 * independent — one carries the React/StyleX layers, the other deliberately does
 * not — and these were the only part that had drifted apart by being written
 * twice.
 */

/**
 * Severities the plugins' own recommended configs get wrong for this stack.
 *
 * The `security/*` escalations are from `warn` to `error` so a bulk-suppression
 * baseline can cover the inherited findings and NEW occurrences fail the gate —
 * suppressions only apply at error severity, so a warning is unbaselineable and
 * therefore unenforceable.
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
  'unicorn/name-replacements': 'off',
  'unicorn/no-array-reduce': 'off',
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
    'unicorn/prefer-module': 'off',
    'unicorn/prevent-abbreviations': 'off',
  },
});
