import { ESLintUtils } from '@typescript-eslint/utils';
const createRule = ESLintUtils.RuleCreator((name) => `https://example.com/rule/${name}`);
export default createRule({
    name: 'no-type-definitions-in-components',
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce that type definitions should be in separate .types.ts files, not in component files',
        },
        messages: {
            noTypeInComponent: 'Type "{{typeName}}" should be defined in a separate .types.ts file, not in a component file.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        // Only apply to .component.tsx, .layout.tsx, .errorBoundary.tsx etc - component files
        const filename = context.filename;
        const isComponentFile = filename.endsWith('.component.tsx') ||
            filename.endsWith('.layout.tsx') ||
            filename.endsWith('.errorBoundary.tsx');
        if (!isComponentFile) {
            return {};
        }
        return {
            TSTypeAliasDeclaration(node) {
                context.report({
                    messageId: 'noTypeInComponent',
                    node,
                    data: {
                        typeName: node.id.name,
                    },
                });
            },
            TSInterfaceDeclaration(node) {
                context.report({
                    messageId: 'noTypeInComponent',
                    node,
                    data: {
                        typeName: node.id.name,
                    },
                });
            },
        };
    },
});
