import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

const INTERNAL_PATH_PREFIXES = ['./', '../', '@/'] as const;

const isInternalPath = (source: string): boolean =>
  INTERNAL_PATH_PREFIXES.some((prefix) => source.startsWith(prefix));

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
}: {
  readonly context: TSESLint.RuleContext<'cleanImportPath', []>;
  readonly node:
    | TSESTree.ExportAllDeclaration
    | TSESTree.ExportNamedDeclaration
    | TSESTree.ImportDeclaration;
}): void => {
  const sourceNode = node.source;

  if (!sourceNode || typeof sourceNode.value !== 'string') {
    return;
  }

  const sourceValue = sourceNode.value;
  if (!isInternalPath(sourceValue)) {
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

export default createRule({
  create(context) {
    return {
      ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
    };
  },
  defaultOptions: [],
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
    schema: [],
    type: 'suggestion',
  },
  name: 'clean-import-paths',
});
