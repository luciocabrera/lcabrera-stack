import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

const RELATIVE_PREFIXES = ['./', '../'] as const;

const DEFAULT_ALIAS_PREFIXES = ['@/'];

type IsInternalPathArgs = {
  readonly prefixes: readonly string[];
  readonly source: string;
};

type Options = readonly [{ readonly aliasPrefixes?: readonly string[] }?];

const isInternalPath = ({ prefixes, source }: IsInternalPathArgs): boolean =>
  prefixes.some((prefix) => source.startsWith(prefix));

const normalizeImportPath = (source: string): string => {
  let normalized = source;

  normalized = normalized.replace(/\/index(?:\.tsx|\.ts)?$/, '');
  normalized = normalized.replace(/\.tsx?$/, '');

  if (normalized === '.') {
    return './';
  }

  if (normalized === '..') {
    return '../';
  }

  return normalized;
};

const getQuoteCharacter = (rawSourceText: string): "'" | '"' =>
  rawSourceText.startsWith('"') ? '"' : "'";

const reportIfPathNeedsCleanup = ({
  context,
  node,
  prefixes,
}: {
  readonly context: TSESLint.RuleContext<'cleanImportPath', Options>;
  readonly node:
    | TSESTree.ExportAllDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.ImportDeclaration;
  readonly prefixes: readonly string[];
}) => {
  const sourceNode = node.source;

  if (!sourceNode || typeof sourceNode.value !== 'string') {
    return;
  }

  const sourceValue = sourceNode.value;
  if (!isInternalPath({ prefixes, source: sourceValue })) {
    return;
  }

  const cleanedPath = normalizeImportPath(sourceValue);
  if (cleanedPath === sourceValue) {
    return;
  }

  context.report({
    data: {
      cleanedPath,
      sourceValue,
    },
    fix(fixer) {
      const sourceCode = context.sourceCode;
      const originalText = sourceCode.getText(sourceNode);
      const quote = getQuoteCharacter(originalText);
      return fixer.replaceText(sourceNode, `${quote}${cleanedPath}${quote}`);
    },
    messageId: 'cleanImportPath',
    node: sourceNode,
  });
};

export default createRule<Options, 'cleanImportPath'>({
  create(context) {
    const [options] = context.options;
    const prefixes = [
      ...RELATIVE_PREFIXES,
      ...(options?.aliasPrefixes ?? DEFAULT_ALIAS_PREFIXES),
    ];

    return {
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
          prefixes,
        });
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
          prefixes,
        });
      },
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
          prefixes,
        });
      },
    };
  },
  defaultOptions: [{}],
  meta: {
    docs: {
      description:
        'Enforce extensionless and indexless internal import/export paths',
    },
    fixable: 'code',
    messages: {
      cleanImportPath:
        'Use clean path "{{cleanedPath}}" instead of "{{sourceValue}}".',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          aliasPrefixes: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: 'clean-import-paths',
});
