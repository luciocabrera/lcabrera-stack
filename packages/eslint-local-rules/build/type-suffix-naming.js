// ✅ Enforces proper type suffix naming conventions
// - Function parameter types must end with 'Args' (not 'Arguments')
// - React component prop types must end with 'Props'
const rule = {
    meta: {
        docs: {
            description: 'Enforce proper type suffix naming: Args for function parameters, Props for React components',
            recommended: true,
        },
        fixable: 'code',
        messages: {
            useArgsSuffix: "Function parameter type '{{typeName}}' should use 'Args' suffix, not 'Arguments'. Rename to '{{suggestedName}}'.",
            usePropsSuffix: "React component prop type '{{typeName}}' should use 'Props' suffix, not 'Properties'. Rename to '{{suggestedName}}'.",
        },
        schema: [],
        type: 'suggestion',
    },
    create(context) {
        const filename = context.filename;
        const isReactFile = filename.endsWith('.tsx') || filename.endsWith('.jsx');
        return {
            TSTypeAliasDeclaration(node) {
                const typeName = node.id.name;
                // Check for incorrect 'Arguments' suffix (should be 'Args')
                if (typeName.endsWith('Arguments')) {
                    const suggestedName = typeName.replace(/Arguments$/, 'Args');
                    context.report({
                        messageId: 'useArgsSuffix',
                        node: node.id,
                        data: {
                            suggestedName,
                            typeName,
                        },
                        fix(fixer) {
                            // Find all references to this type in the file
                            const fixes = [];
                            // Fix the type definition itself
                            fixes.push(fixer.replaceText(node.id, suggestedName));
                            return fixes;
                        },
                    });
                }
                // Check for incorrect 'Properties' suffix (should be 'Props')
                if (isReactFile && typeName.endsWith('Properties')) {
                    const suggestedName = typeName.replace(/Properties$/, 'Props');
                    context.report({
                        messageId: 'usePropsSuffix',
                        node: node.id,
                        data: {
                            suggestedName,
                            typeName,
                        },
                        fix(fixer) {
                            return fixer.replaceText(node.id, suggestedName);
                        },
                    });
                }
            },
        };
    },
};
export default rule;
