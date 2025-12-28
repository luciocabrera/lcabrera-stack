/**
 * Custom ESLint rule to merge duplicate imports from the same source
 * Enforces: import { A, B } from './module'
 * Disallows: import { A } from './module'; import { B } from './module'
 */

import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      category: 'Best Practices',
      description:
        'Merge duplicate imports from the same source into a single import statement',
      recommended: false,
    },
    fixable: 'code',
    messages: {
      duplicateImport:
        'Multiple imports from "{{source}}". Merge into a single import statement.',
    },
    schema: [],
    type: 'suggestion',
  },

  create(context) {
    const sourceMap = new Map<string, any[]>();

    return {
      Program(node: any) {
        // Collect all import declarations
        const imports = node.body.filter(
          (stmt: any) => stmt.type === 'ImportDeclaration',
        );

        // Group by source
        imports.forEach((importNode: any) => {
          const source = importNode.source.value as string;
          if (!sourceMap.has(source)) {
            sourceMap.set(source, []);
          }
          sourceMap.get(source)!.push(importNode);
        });

        // Check for duplicates and report
        sourceMap.forEach((importNodes, source) => {
          if (importNodes.length > 1) {
            // Check if they're all the same kind (all value imports or all type imports)
            const allSameKind = importNodes.every(
              (node: any) => node.importKind === importNodes[0]!.importKind,
            );

            if (allSameKind) {
              // Report on all but the first import
              importNodes.slice(1).forEach((importNode: any) => {
                context.report({
                  data: { source },
                  fix(fixer) {
                    const sourceCode = context.sourceCode;
                    const fixes = [];

                    // Collect all specifiers from all imports of this source
                    const allSpecifiers: string[] = [];
                    const importKind = importNodes[0]!.importKind;

                    importNodes.forEach((node: any) => {
                      node.specifiers.forEach((specifier: any) => {
                        if (specifier.type === 'ImportSpecifier') {
                          if (
                            specifier.imported.name === specifier.local.name
                          ) {
                            allSpecifiers.push(specifier.imported.name);
                          } else {
                            allSpecifiers.push(
                              `${specifier.imported.name} as ${specifier.local.name}`,
                            );
                          }
                        } else if (
                          specifier.type === 'ImportDefaultSpecifier'
                        ) {
                          allSpecifiers.push(
                            `default as ${specifier.local.name}`,
                          );
                        } else if (
                          specifier.type === 'ImportNamespaceSpecifier'
                        ) {
                          allSpecifiers.push(`* as ${specifier.local.name}`);
                        }
                      });
                    });

                    // Remove duplicates
                    const uniqueSpecifiers = [...new Set(allSpecifiers)];

                    // Build the merged import
                    const importKeyword =
                      importKind === 'type' ? 'import type' : 'import';
                    const fromClause = sourceCode.getText(
                      importNodes[0]!.source,
                    );
                    const mergedImport = `${importKeyword} { ${uniqueSpecifiers.join(', ')} } from ${fromClause};`;

                    // Replace the first import with the merged version
                    fixes.push(fixer.replaceText(importNodes[0], mergedImport));

                    // Remove the duplicate imports
                    importNodes.slice(1).forEach((dupNode: any) => {
                      fixes.push(fixer.remove(dupNode));
                    });

                    return fixes;
                  },
                  messageId: 'duplicateImport',
                  node: importNode,
                });
              });
            }
          }
        });
      },
    };
  },
};

export default rule;
