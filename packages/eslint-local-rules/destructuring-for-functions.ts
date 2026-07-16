// ✅ Enforces object destructuring for functions with 2+ parameters
// ✅ Skips single-parameter functions
// ❌ Auto-fix disabled (too aggressive for callbacks, Promise constructors, etc.)

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

const isArrayMethodCallback = (node: FunctionNode): boolean => {
  const parent = node.parent;

  // Check if this function is a direct argument to a call expression
  if (parent?.type === 'CallExpression') {
    const callee = parent.callee;

    // Check for array methods (map, filter, forEach, find, findIndex, some, every, reduce, etc.)
    if (callee.type === 'MemberExpression') {
      const methodName =
        callee.property.type === 'Identifier'
          ? callee.property.name
          : undefined;
      const objectName =
        callee.object.type === 'Identifier' ? callee.object.name : undefined;
      const arrayMethods = [
        'map',
        'filter',
        'forEach',
        'find',
        'findIndex',
        'some',
        'every',
        'reduce',
        'reduceRight',
        'flatMap',
        'sort',
        'toSorted',
        'findLast',
        'findLastIndex',
      ];

      return (
        (methodName !== undefined && arrayMethods.includes(methodName)) ||
        (objectName === 'Array' && methodName === 'from')
      );
    }
  }

  return false;
};

const checkFunction = ({
  context,
  node,
}: {
  readonly context: TSESLint.RuleContext<'useObjectParam', []>;
  readonly node: FunctionNode;
}): void => {
  const params = node.params;

  // Skip if single parameter or no parameters
  if (params.length <= 1) {
    return;
  }

  // Skip if already using object destructuring pattern
  if (params.length === 1 && params[0]?.type === 'ObjectPattern') {
    return;
  }

  // Skip array method callbacks (map, filter, forEach, reduce, etc.)
  if (isArrayMethodCallback(node)) {
    return;
  }

  // Report violation
  context.report({
    messageId: 'useObjectParam',
    node,
  });
};

export default createRule({
  create(context) {
    return {
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        checkFunction({ context, node });
      },
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        checkFunction({ context, node });
      },
      FunctionExpression(node: TSESTree.FunctionExpression) {
        checkFunction({ context, node });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Enforce object parameter pattern for functions with multiple parameters',
    },
    messages: {
      useObjectParam:
        'Functions with multiple parameters should use a single object parameter with a named type.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'destructuring-for-functions',
});
