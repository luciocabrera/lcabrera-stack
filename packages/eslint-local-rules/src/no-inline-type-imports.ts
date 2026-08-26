/**
 * Custom ESLint rule to enforce separate type imports
 * Disallows: import { type X } from 'module'
 * Enforces: import type { X } from 'module'
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

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

type BuildTypeImportTextArgs = {
  readonly node: TSESTree.ImportDeclaration;
  readonly sourceCode: Readonly<TSESLint.SourceCode>;
};

/**
 * Renders the `import type { ... } from '...'` replacement for a declaration,
 * dropping every inline `type` keyword while keeping each specifier (and any
 * `as` alias) in source order.
 *
 * An ImportDeclaration's range covers its trailing semicolon, so replacing the
 * node wholesale silently drops one. The semicolon is mirrored from the source
 * rather than always emitted: punctuation style belongs to Oxfmt, and a fixer
 * that imposes its own is how a linter/formatter fight starts.
 */
const buildTypeImportText = ({ node, sourceCode }: BuildTypeImportTextArgs) => {
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
  const semicolon = sourceCode.getText(node).endsWith(';') ? ';' : '';

  return `import type { ${importedNames} } from ${fromClause}${semicolon}`;
};

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
              fix: (fixer) =>
                fixer.replaceText(
                  node,
                  buildTypeImportText({ node, sourceCode: context.sourceCode }),
                ),
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
          fix: (fixer) =>
            fixer.replaceText(
              node,
              buildTypeImportText({ node, sourceCode: context.sourceCode }),
            ),
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
