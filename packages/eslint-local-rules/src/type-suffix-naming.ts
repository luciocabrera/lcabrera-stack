// ✅ Enforces proper type suffix naming conventions
// - Function parameter types must end with 'Args' (not 'Arguments')
// - React component prop types must end with 'Props'

import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

export default createRule({
  create(context) {
    const filename = context.filename;
    const isReactFile = filename.endsWith('.tsx') || filename.endsWith('.jsx');

    return {
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration) {
        const typeName = node.id.name;

        // Check for incorrect 'Arguments' suffix (should be 'Args')
        if (typeName.endsWith('Arguments')) {
          const suggestedName = typeName.replace(/Arguments$/, 'Args');

          context.report({
            data: {
              suggestedName,
              typeName,
            },
            fix(fixer) {
              // Fix the type definition itself
              const fixes = [fixer.replaceText(node.id, suggestedName)];

              return fixes;
            },
            messageId: 'useArgsSuffix',
            node: node.id,
          });
        }

        // Check for incorrect 'Properties' suffix (should be 'Props')
        if (isReactFile && typeName.endsWith('Properties')) {
          const suggestedName = typeName.replace(/Properties$/, 'Props');

          context.report({
            data: {
              suggestedName,
              typeName,
            },
            fix(fixer) {
              return fixer.replaceText(node.id, suggestedName);
            },
            messageId: 'usePropsSuffix',
            node: node.id,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce proper type suffix naming: Args for function parameters, Props for React components',
    },
    fixable: 'code',
    messages: {
      useArgsSuffix:
        "Function parameter type '{{typeName}}' should use 'Args' suffix, not 'Arguments'. Rename to '{{suggestedName}}'.",
      usePropsSuffix:
        "React component prop type '{{typeName}}' should use 'Props' suffix, not 'Properties'. Rename to '{{suggestedName}}'.",
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'type-suffix-naming',
});
