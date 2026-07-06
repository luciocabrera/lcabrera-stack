// ✅ Enforces object destructuring for functions with 2+ parameters
// ✅ Skips single-parameter functions
// ❌ Auto-fix disabled (too aggressive for callbacks, Promise constructors, etc.)

import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  create(context) {
    return {
      ArrowFunctionExpression(node: any) {
        checkFunction(node, context);
      },
      FunctionDeclaration(node: any) {
        checkFunction(node, context);
      },
      FunctionExpression(node: any) {
        checkFunction(node, context);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce object parameter pattern for functions with multiple parameters',
      recommended: false,
    },
    messages: {
      useObjectParam:
        'Functions with multiple parameters should use a single object parameter with a named type.',
    },
    schema: [],
    type: 'suggestion',
  },
};

function checkFunction(node: any, context: Rule.RuleContext) {
  const params = node.params;

  // Skip if single parameter or no parameters
  if (params.length <= 1) {
    return;
  }

  // Skip if already using object destructuring pattern
  if (params.length === 1 && params[0].type === 'ObjectPattern') {
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
}

function isArrayMethodCallback(node: any): boolean {
  const parent = node.parent;

  // Check if this function is a direct argument to a call expression
  if (parent?.type === 'CallExpression') {
    const callee = parent.callee;

    // Check for array methods (map, filter, forEach, find, findIndex, some, every, reduce, etc.)
    if (callee?.type === 'MemberExpression') {
      const methodName = callee.property?.name;
      const objectName =
        callee.object?.type === 'Identifier' ? callee.object.name : undefined;
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
        arrayMethods.includes(methodName) ||
        (objectName === 'Array' && methodName === 'from')
      );
    }
  }

  return false;
}

export default rule;
