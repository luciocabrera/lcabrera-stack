import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

export default createRule({
  create(context) {
    // Only apply to .component.tsx files
    const filename = context.filename;
    if (!filename.endsWith('.component.tsx')) {
      return {};
    }

    const componentExports: string[] = [];

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        // Check if it's a function declaration
        if (node.declaration?.type === 'FunctionDeclaration') {
          const name = node.declaration.id?.name;
          if (name) {
            componentExports.push(name);
          }
        }
        // Check if it's a variable declaration with arrow function
        else if (node.declaration?.type === 'VariableDeclaration') {
          for (const declarator of node.declaration.declarations) {
            if (
              declarator.id.type === 'Identifier' &&
              (declarator.init?.type === 'ArrowFunctionExpression' ||
                declarator.init?.type === 'FunctionExpression')
            ) {
              componentExports.push(declarator.id.name);
            }
          }
        }
      },
      'Program:exit'() {
        if (componentExports.length > 1) {
          context.report({
            data: {
              count: componentExports.length.toString(),
            },
            loc: { column: 0, line: 1 },
            messageId: 'multipleComponentExports',
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce that .component.tsx files export only one component',
    },
    messages: {
      multipleComponentExports:
        'Component files should export only one component. Found {{ count }} component exports.',
    },
    schema: [],
    type: 'problem',
  },
  name: 'single-component-export',
});
