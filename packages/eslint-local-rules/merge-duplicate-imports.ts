/**
 * Custom ESLint rule to merge duplicate imports from the same source
 * Enforces: import { A, B } from './module'
 * Disallows: import { A } from './module'; import { B } from './module'
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

const createSourceMap = (
  programNode: TSESTree.Program,
): Map<string, TSESTree.ImportDeclaration[]> => {
  const sourceMap = new Map<string, TSESTree.ImportDeclaration[]>();
  const imports = programNode.body.filter(
    (statement): statement is TSESTree.ImportDeclaration =>
      statement.type === 'ImportDeclaration',
  );

  for (const importNode of imports) {
    const source = importNode.source.value;
    const existingImports = sourceMap.get(source) ?? [];
    existingImports.push(importNode);
    sourceMap.set(source, existingImports);
  }

  return sourceMap;
};

const hasSameImportKind = (
  importNodes: readonly TSESTree.ImportDeclaration[],
): boolean => {
  if (importNodes.length === 0) {
    return false;
  }

  const firstImportKind = importNodes[0]?.importKind;
  return importNodes.every(
    (importNode) => importNode.importKind === firstImportKind,
  );
};

const getImportedName = (
  imported: TSESTree.Identifier | TSESTree.StringLiteral,
): string => (imported.type === 'Identifier' ? imported.name : imported.value);

const getSpecifierText = (
  specifier: TSESTree.ImportClause,
): string | undefined => {
  if (specifier.type === 'ImportSpecifier') {
    const importedName = getImportedName(specifier.imported);
    if (importedName === specifier.local.name) {
      return importedName;
    }

    return `${importedName} as ${specifier.local.name}`;
  }

  if (specifier.type === 'ImportDefaultSpecifier') {
    return `default as ${specifier.local.name}`;
  }

  if (specifier.type === 'ImportNamespaceSpecifier') {
    return `* as ${specifier.local.name}`;
  }

  return undefined;
};

const getUniqueSpecifiers = (
  importNodes: readonly TSESTree.ImportDeclaration[],
): string[] => {
  const allSpecifiers: string[] = [];

  for (const importNode of importNodes) {
    for (const specifier of importNode.specifiers) {
      const specifierText = getSpecifierText(specifier);
      if (specifierText) {
        allSpecifiers.push(specifierText);
      }
    }
  }

  return [...new Set(allSpecifiers)];
};

const createMergeDuplicateImportsFix = ({
  context,
  importNodes,
}: {
  readonly context: TSESLint.RuleContext<'duplicateImport', []>;
  readonly importNodes: readonly TSESTree.ImportDeclaration[];
}) => {
  return (fixer: TSESLint.RuleFixer): TSESLint.RuleFix[] => {
    const firstImportNode = importNodes[0];
    if (!firstImportNode) {
      return [];
    }

    const sourceCode = context.sourceCode;
    const importKind = firstImportNode.importKind;
    const importKeyword = importKind === 'type' ? 'import type' : 'import';
    const fromClause = sourceCode.getText(firstImportNode.source);
    const uniqueSpecifiers = getUniqueSpecifiers(importNodes);
    const mergedImport = `${importKeyword} { ${uniqueSpecifiers.join(', ')} } from ${fromClause};`;
    const fixes = [fixer.replaceText(firstImportNode, mergedImport)];

    for (const duplicateImportNode of importNodes.slice(1)) {
      fixes.push(fixer.remove(duplicateImportNode));
    }

    return fixes;
  };
};

export default createRule({
  create(context) {
    return {
      Program(node: TSESTree.Program) {
        const sourceMap = createSourceMap(node);

        for (const [source, importNodes] of sourceMap) {
          if (importNodes.length <= 1 || !hasSameImportKind(importNodes)) {
            continue;
          }

          const fix = createMergeDuplicateImportsFix({
            context,
            importNodes,
          });

          for (const importNode of importNodes.slice(1)) {
            context.report({
              data: { source },
              fix,
              messageId: 'duplicateImport',
              node: importNode,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Merge duplicate imports from the same source into a single import statement',
    },
    fixable: 'code',
    messages: {
      duplicateImport:
        'Multiple imports from "{{source}}". Merge into a single import statement.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'merge-duplicate-imports',
});
