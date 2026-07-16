/**
 * Custom ESLint rule to enforce separate type imports
 * Disallows: import { type X } from 'module'
 * Enforces: import type { X } from 'module'
 */

import type { TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

const getImportedName = (
  imported: TSESTree.Identifier | TSESTree.StringLiteral,
): string => (imported.type === 'Identifier' ? imported.name : imported.value);

const isTypeImportSpecifier = (
  specifier: TSESTree.ImportClause,
): specifier is TSESTree.ImportSpecifier =>
  specifier.type === 'ImportSpecifier' && specifier.importKind === 'type';

const isImportSpecifier = (
  specifier: TSESTree.ImportClause,
): specifier is TSESTree.ImportSpecifier =>
  specifier.type === 'ImportSpecifier';

export default createRule({
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        // Case 1: Check if this is already an "import type" statement with redundant inline "type" keywords
        if (node.importKind === 'type') {
          const hasRedundantInlineTypes = node.specifiers.some((specifier) =>
            isTypeImportSpecifier(specifier),
          );

          if (hasRedundantInlineTypes) {
            const redundantNames = node.specifiers
              .filter(isTypeImportSpecifier)
              .map((specifier) => getImportedName(specifier.imported))
              .join(', ');

            context.report({
              data: { names: redundantNames },
              fix(fixer) {
                const sourceCode = context.sourceCode;

                // Build the fixed import by removing inline 'type' keywords
                const importedNames = node.specifiers
                  .map((specifier) => {
                    if (specifier.type !== 'ImportSpecifier') return;

                    const importedName = getImportedName(specifier.imported);
                    return importedName === specifier.local.name
                      ? importedName
                      : `${importedName} as ${specifier.local.name}`;
                  })
                  .filter(
                    (name: string | undefined): name is string =>
                      name !== undefined,
                  )
                  .join(', ');

                const fromClause = sourceCode.getText(node.source);
                const newImport = `import type { ${importedNames} } from ${fromClause}`;

                return fixer.replaceText(node, newImport);
              },
              messageId: 'redundantInlineType',
              node,
            });
          }
          return;
        }

        // Case 2: Check if this is a regular import with inline type specifiers
        const hasInlineTypes = node.specifiers.some((specifier) =>
          isTypeImportSpecifier(specifier),
        );

        if (!hasInlineTypes) {
          return;
        }

        // Check if ALL imports are types (not mixed)
        const allTypes = node.specifiers.every(isTypeImportSpecifier);

        if (!allTypes) {
          // Mixed imports - let TypeScript-ESLint handle this
          return;
        }

        // Get the imported names
        const names = node.specifiers
          .filter(isImportSpecifier)
          .map((specifier) => getImportedName(specifier.imported))
          .join(', ');

        context.report({
          data: { names },
          fix(fixer) {
            const sourceCode = context.sourceCode;

            const importedNames = node.specifiers
              .filter(isImportSpecifier)
              .map((specifier) => {
                const importedName = getImportedName(specifier.imported);
                return importedName === specifier.local.name
                  ? importedName
                  : `${importedName} as ${specifier.local.name}`;
              })
              .join(', ');

            const fromClause = sourceCode.getText(node.source);
            const newImport = `import type { ${importedNames} } from ${fromClause}`;

            return fixer.replaceText(node, newImport);
          },
          messageId: 'noInlineTypeImport',
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce separate type imports instead of inline type imports',
    },
    fixable: 'code',
    messages: {
      noInlineTypeImport:
        'Use separate type import syntax: "import type { {{names}} }" instead of inline "type" keyword',
      redundantInlineType:
        'Redundant inline "type" keyword in import type statement. Remove "type" from: {{names}}',
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'no-inline-type-imports',
});
