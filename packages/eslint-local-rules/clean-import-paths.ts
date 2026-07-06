import type { Rule } from 'eslint';

const INTERNAL_PATH_PREFIXES = ['./', '../', '@/'] as const;

const isInternalPath = (source: string): boolean =>
  INTERNAL_PATH_PREFIXES.some((prefix) => source.startsWith(prefix));

const normalizeImportPath = (source: string): string => {
  let normalized = source;

  normalized = normalized.replace(/\/index(?:\.tsx?|\.ts)?$/, '');
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
  readonly context: Rule.RuleContext;
  readonly node: any;
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

const rule: Rule.RuleModule = {
  create(context) {
    return {
      ExportAllDeclaration(node: any) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
      ExportNamedDeclaration(node: any) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
      ImportDeclaration(node: any) {
        reportIfPathNeedsCleanup({
          context,
          node,
        });
      },
    };
  },

  meta: {
    docs: {
      description:
        'Enforce extensionless and indexless internal import/export paths',
      recommended: false,
    },
    fixable: 'code',
    messages: {
      cleanImportPath:
        'Use clean path "{{cleanedPath}}" instead of "{{sourceValue}}".',
    },
    schema: [],
    type: 'suggestion',
  },
};

export default rule;
