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

import { COMPONENT_FILE_SUFFIXES } from './component-files.ts';
import { createRule } from './create-rule.ts';
import { parseFileName } from './file-names.ts';

type MessageIds = 'deprecatedSuffix' | 'hookPrefix' | 'wrongCase';

type Options = readonly [
  {
    readonly deprecatedSuffixes?: Readonly<Record<string, string>>;
    readonly suffixCase?: Readonly<Record<string, SuffixCase>>;
  }?,
];

type SuffixCase = 'camelCase' | 'kebab-case' | 'PascalCase';

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const CAMEL_CASE = /^[a-z][A-Za-z0-9]*$/;
const KEBAB_SEGMENT = /^[a-z0-9]+$/;
const isKebabCase = (value: string) =>
  value.length > 0 &&
  value.split('-').every((segment) => KEBAB_SEGMENT.test(segment));

const KEBAB_SUFFIXES = new Set(['action', 'clientAction', 'loader', 'meta']);
const PASCAL_SUFFIXES = new Set<string>(COMPONENT_FILE_SUFFIXES);
const CAMEL_SUFFIXES = new Set(['api', 'hook', 'schema', 'service', 'util']);

const DEFAULT_DEPRECATED_SUFFIXES: Readonly<Record<string, string>> = {
  errorBoundary: 'error-boundary',
};

type ExpectedCaseForArgs = {
  readonly overrides: ReadonlyMap<string, SuffixCase>;
  readonly suffix: string;
};

const expectedCaseFor = ({ overrides, suffix }: ExpectedCaseForArgs) => {
  const override = overrides.get(suffix);
  if (override !== undefined) {
    return override;
  }
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

export default createRule<Options, MessageIds>({
  create(context) {
    const [options] = context.options;
    const overrides = new Map<string, SuffixCase>(
      Object.entries(options?.suffixCase ?? {}),
    );
    const deprecatedSuffixes = new Map<string, string>(
      Object.entries(
        options?.deprecatedSuffixes ?? DEFAULT_DEPRECATED_SUFFIXES,
      ),
    );

    return {
      Program(node: TSESTree.Program) {
        const parsed = parseFileName(context.filename);
        if (parsed === undefined) {
          return;
        }

        const canonicalSuffix = deprecatedSuffixes.get(parsed.suffix);
        if (canonicalSuffix !== undefined) {
          context.report({
            data: { canonical: canonicalSuffix, suffix: parsed.suffix },
            messageId: 'deprecatedSuffix',
            node,
          });
          return;
        }

        const expected = expectedCaseFor({ overrides, suffix: parsed.suffix });
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
  defaultOptions: [{}],
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
    schema: [
      {
        additionalProperties: false,
        properties: {
          deprecatedSuffixes: {
            additionalProperties: { type: 'string' },
            type: 'object',
          },
          suffixCase: {
            additionalProperties: {
              enum: ['PascalCase', 'camelCase', 'kebab-case'],
              type: 'string',
            },
            type: 'object',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
  name: 'filename-convention',
});
