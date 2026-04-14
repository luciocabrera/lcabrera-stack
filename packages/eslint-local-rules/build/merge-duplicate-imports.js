/**
 * Custom ESLint rule to merge duplicate imports from the same source
 * Enforces: import { A, B } from './module'
 * Disallows: import { A } from './module'; import { B } from './module'
 */
const createSourceMap = (programNode) => {
    const sourceMap = new Map();
    const imports = programNode.body.filter((statement) => statement.type === 'ImportDeclaration');
    for (const importNode of imports) {
        const source = importNode.source.value;
        const existingImports = sourceMap.get(source) ?? [];
        existingImports.push(importNode);
        sourceMap.set(source, existingImports);
    }
    return sourceMap;
};
const hasSameImportKind = (importNodes) => {
    if (importNodes.length === 0) {
        return false;
    }
    const firstImportKind = importNodes[0].importKind;
    return importNodes.every((importNode) => importNode.importKind === firstImportKind);
};
const getSpecifierText = (specifier) => {
    if (specifier.type === 'ImportSpecifier') {
        if (specifier.imported.name === specifier.local.name) {
            return specifier.imported.name;
        }
        return `${specifier.imported.name} as ${specifier.local.name}`;
    }
    if (specifier.type === 'ImportDefaultSpecifier') {
        return `default as ${specifier.local.name}`;
    }
    if (specifier.type === 'ImportNamespaceSpecifier') {
        return `* as ${specifier.local.name}`;
    }
    return undefined;
};
const getUniqueSpecifiers = (importNodes) => {
    const allSpecifiers = [];
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
const createMergeDuplicateImportsFix = ({ context, importNodes, }) => {
    return (fixer) => {
        const sourceCode = context.sourceCode;
        const importKind = importNodes[0].importKind;
        const importKeyword = importKind === 'type' ? 'import type' : 'import';
        const fromClause = sourceCode.getText(importNodes[0].source);
        const uniqueSpecifiers = getUniqueSpecifiers(importNodes);
        const mergedImport = `${importKeyword} { ${uniqueSpecifiers.join(', ')} } from ${fromClause};`;
        const fixes = [fixer.replaceText(importNodes[0], mergedImport)];
        for (const duplicateImportNode of importNodes.slice(1)) {
            fixes.push(fixer.remove(duplicateImportNode));
        }
        return fixes;
    };
};
const rule = {
    meta: {
        docs: {
            description: 'Merge duplicate imports from the same source into a single import statement',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            duplicateImport: 'Multiple imports from "{{source}}". Merge into a single import statement.',
        },
        schema: [],
        type: 'suggestion',
    },
    create(context) {
        return {
            Program(node) {
                const sourceMap = createSourceMap(node);
                sourceMap.forEach((importNodes, source) => {
                    if (importNodes.length <= 1 || !hasSameImportKind(importNodes)) {
                        return;
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
                });
            },
        };
    },
};
export default rule;
