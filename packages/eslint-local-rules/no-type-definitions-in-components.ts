import type { TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

export default createRule({
  create(context) {
    // Only apply to .component.tsx, .layout.tsx, .errorBoundary.tsx etc - component files
    const filename = context.filename;
    const isComponentFile =
      filename.endsWith('.component.tsx') ||
      filename.endsWith('.layout.tsx') ||
      filename.endsWith('.errorBoundary.tsx');

    if (!isComponentFile) {
      return {};
    }

    return {
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration) {
        context.report({
          data: {
            typeName: node.id.name,
          },
          messageId: 'noTypeInComponent',
          node,
        });
      },
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration) {
        context.report({
          data: {
            typeName: node.id.name,
          },
          messageId: 'noTypeInComponent',
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce that type definitions should be in separate .types.ts files, not in component files',
    },
    messages: {
      noTypeInComponent:
        'Type "{{typeName}}" should be defined in a separate .types.ts file, not in a component file.',
    },
    schema: [],
    type: 'problem',
  },
  name: 'no-type-definitions-in-components',
});
