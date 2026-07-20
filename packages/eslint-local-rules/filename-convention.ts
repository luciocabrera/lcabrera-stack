// ✅ Enforces the base-name CASE of a file from its type suffix, so the
// file-naming conventions in PATTERNS.md and .claude/rules/typescript.md are
// checked by the gate instead of only living in prose.
//
//   Route modules  .loader / .action / .clientAction / .meta  → kebab-case
//   Components     .component / .layout / .error-boundary      → PascalCase
//   Hooks          .hook.ts                          → camelCase, `use` prefix
//
// A component is anything that renders JSX for a route slot — the view
// (`.component`), its layout wrapper (`.layout`), and its error boundary
// (`.error-boundary`) — so all three are named after the PascalCase component
// (`EnterpriseOrders.error-boundary.tsx`, never `enterprise-orders.errorBoundary.tsx`).
// The old camelCase `.errorBoundary` suffix is flagged as deprecated in favour
// of the hyphenated `.error-boundary`.
//
// Only the unambiguous, explicitly-documented conventions are enforced. Files
// with no recognised `<base>.<suffix>.<ext>` shape (index.ts, root.ts, plain
// `foo.ts`) are skipped, and ambiguous suffixes are left unenforced (see the
// note on the suffix sets below) rather than guessed at.

import type { TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/luciocabrera/vite-react-compiler/rules/${name}`,
);

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const CAMEL_CASE = /^[a-z][A-Za-z0-9]*$/;
// A kebab segment is validated per-`-`-split part rather than with a single
// `[a-z0-9]+(-[a-z0-9]+)*` regex, whose nested quantifier trips
// security/detect-unsafe-regex (ReDoS heuristic). Splitting is linear and safe.
const KEBAB_SEGMENT = /^[a-z0-9]+$/;
const isKebabCase = (value: string) =>
  value.length > 0 &&
  value.split('-').every((segment) => KEBAB_SEGMENT.test(segment));

// The casing model (see .claude/rules/typescript.md): a filename's case follows
// what it names — a React component (PascalCase), the route/resource it belongs
// to (kebab-case), or the function/value module it exports (camelCase).
// `@repo/utils` is the one documented exception (it keeps kebab-case for its
// `.util` files) and turns this rule off for them in its own eslint config.
const KEBAB_SUFFIXES = new Set(['action', 'clientAction', 'loader', 'meta']);
const PASCAL_SUFFIXES = new Set(['component', 'error-boundary', 'layout']);
const CAMEL_SUFFIXES = new Set(['api', 'hook', 'schema', 'service', 'util']);

// Deprecated suffix spellings → their canonical replacement. A multi-word
// suffix is hyphenated (`error-boundary`), so the old camelCase form is
// rejected with a rename hint.
const DEPRECATED_SUFFIXES = new Map([['errorBoundary', 'error-boundary']]);

/**
 * Split a filename into its `{ name, suffix }`, or `undefined` when the file
 * has no recognised `<name>.<suffix>.<ext>` shape. A trailing `.test`/`.spec`
 * segment is stripped first so a test file is checked against the subject it
 * covers (`editOrder.action.test.ts` → name `editOrder`, suffix `action`).
 */
const parseFileName = (filename: string) => {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const withoutExt = base.replace(/\.(?:tsx?|jsx?|mjs|cjs)$/, '');
  const withoutTest = withoutExt.replace(/\.(?:test|spec)$/, '');
  const lastDot = withoutTest.lastIndexOf('.');
  if (lastDot <= 0) {
    return;
  }
  return {
    name: withoutTest.slice(0, lastDot),
    suffix: withoutTest.slice(lastDot + 1),
  };
};

/**
 * The expected case label for a suffix. Returns `undefined` (by falling through,
 * not an explicit `return` — unicorn/no-useless-undefined bans `return undefined`
 * and Sonar S3626 bans the redundant bare `return`) when the suffix is unenforced.
 */
const expectedCaseFor = (suffix: string) => {
  if (KEBAB_SUFFIXES.has(suffix)) {
    return 'kebab-case';
  }
  if (PASCAL_SUFFIXES.has(suffix)) {
    return 'PascalCase';
  }
  if (CAMEL_SUFFIXES.has(suffix)) {
    return 'camelCase';
  }
};

type MatchesCaseArgs = {
  readonly expected: string;
  readonly name: string;
};

const matchesCase = ({ expected, name }: MatchesCaseArgs) => {
  if (expected === 'kebab-case') {
    return isKebabCase(name);
  }
  if (expected === 'PascalCase') {
    return PASCAL_CASE.test(name);
  }
  return CAMEL_CASE.test(name);
};

export default createRule({
  create(context) {
    return {
      Program(node: TSESTree.Program) {
        const parsed = parseFileName(context.filename);
        if (parsed === undefined) {
          return;
        }

        const canonicalSuffix = DEPRECATED_SUFFIXES.get(parsed.suffix);
        if (canonicalSuffix !== undefined) {
          context.report({
            data: { canonical: canonicalSuffix, suffix: parsed.suffix },
            messageId: 'deprecatedSuffix',
            node,
          });
          return;
        }

        const expected = expectedCaseFor(parsed.suffix);
        if (expected === undefined) {
          return;
        }

        if (!matchesCase({ expected, name: parsed.name })) {
          context.report({
            data: { case: expected, name: parsed.name, suffix: parsed.suffix },
            messageId: 'wrongCase',
            node,
          });
          return;
        }

        if (parsed.suffix === 'hook' && !/^use[A-Z0-9]/.test(parsed.name)) {
          context.report({
            data: { name: parsed.name },
            messageId: 'hookPrefix',
            node,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce filename base-name case per type suffix (kebab route modules, PascalCase components, camelCase logic files)',
    },
    messages: {
      deprecatedSuffix:
        "The '.{{suffix}}' suffix is deprecated — use '.{{canonical}}' (e.g. 'EnterpriseOrders.{{canonical}}.tsx'). Rename the file (git mv) and update its imports.",
      hookPrefix:
        "Hook file '{{name}}.hook.ts' must start with 'use' (e.g. 'useThing.hook.ts').",
      wrongCase:
        "A '.{{suffix}}' file must be named in {{case}} — '{{name}}' is not. Rename the file (git mv) and update its imports.",
    },
    schema: [],
    type: 'problem',
  },
  name: 'filename-convention',
});
