/**
 * Custom ESLint rule to enforce separate type imports
 * Disallows: import { type X } from 'module'
 * Enforces: import type { X } from 'module'
 */

import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      category: 'Stylistic Issues',
      description:
        'Enforce separate type imports instead of inline type imports',
      recommended: false,
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

  create(context) {
    return {
      ImportDeclaration(node: any) {
        // Case 1: Check if this is already an "import type" statement with redundant inline "type" keywords
        if (node.importKind === 'type') {
          const hasRedundantInlineTypes = node.specifiers.some(
            (specifier: any) =>
              specifier.type === 'ImportSpecifier' &&
              specifier.importKind === 'type',
          );

          if (hasRedundantInlineTypes) {
            const redundantNames = node.specifiers
              .filter(
                (specifier: any) =>
                  specifier.type === 'ImportSpecifier' &&
                  specifier.importKind === 'type',
              )
              .map((specifier: any) => specifier.imported.name)
              .join(', ');

            context.report({
              data: { names: redundantNames },
              fix(fixer) {
                const sourceCode = context.sourceCode;

                // Build the fixed import by removing inline 'type' keywords
                const importedNames = node.specifiers
                  .map((specifier: any) => {
                    if (specifier.type !== 'ImportSpecifier') return null;

                    if (specifier.imported.name === specifier.local.name) {
                      return specifier.imported.name;
                    } else {
                      return `${specifier.imported.name} as ${specifier.local.name}`;
                    }
                  })
                  .filter(
                    (name: string | null): name is string => name !== null,
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
        const hasInlineTypes = node.specifiers.some(
          (specifier: any) =>
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type',
        );

        if (!hasInlineTypes) {
          return;
        }

        // Check if ALL imports are types (not mixed)
        const allTypes = node.specifiers.every(
          (specifier: any) =>
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type',
        );

        if (!allTypes) {
          // Mixed imports - let TypeScript-ESLint handle this
          return;
        }

        // Get the imported names
        const names = node.specifiers
          .filter((specifier: any) => specifier.type === 'ImportSpecifier')
          .map((specifier: any) => specifier.imported.name)
          .join(', ');

        context.report({
          data: { names },
          fix(fixer) {
            const sourceCode = context.sourceCode;

            const importedNames = node.specifiers
              .filter((specifier: any) => specifier.type === 'ImportSpecifier')
              .map((specifier: any) => {
                if (specifier.imported.name === specifier.local.name) {
                  return specifier.imported.name;
                } else {
                  return `${specifier.imported.name} as ${specifier.local.name}`;
                }
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
};

export default rule;
