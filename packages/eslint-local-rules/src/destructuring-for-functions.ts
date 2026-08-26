// ✅ Enforces object destructuring for functions with 2+ parameters
// ✅ Skips single-parameter functions
// ✅ Skips functions whose parameter list is not the author's to choose
// ❌ Auto-fix disabled (too aggressive for callbacks, Promise constructors, etc.)
//
// The "object parameter" guidance only makes sense where the author OWNS the
// signature. Where an external contract fixes it — a `Promise` executor, an
// array-method callback, a value declared as a framework's handler type — the
// rule cannot be satisfied at all, and its only remaining effect is to teach
// people to reach for `eslint-disable`. That is precisely the habit the repo's
// never-suppress rule exists to prevent, so the exemptions below are part of
// the rule rather than something each consumer re-derives.
//
// The two general signals are deliberately syntactic and name no library: a
// call whose callee shape fixes the signature, and an explicit type annotation
// the function is conforming to. Callbacks passed to an imported function whose
// contract is invisible here (`app.use(…)`, `createServer(…)`) stay reported —
// this rule has no type information, so it cannot tell those from an ordinary
// helper, and guessing by callee name would silently exempt real violations.

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

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

/**
 * `new Promise((resolve, reject) => …)`. The executor is invoked by the
 * language with two positional arguments, so an object parameter is not an
 * option — this was the case that had to be suppressed by hand.
 */
const isPromiseExecutor = (node: FunctionNode): boolean => {
  const parent = node.parent;

  return (
    parent?.type === 'NewExpression' &&
    parent.callee.type === 'Identifier' &&
    parent.callee.name === 'Promise' &&
    parent.arguments[0] === node
  );
};

/**
 * A function whose shape is fixed by an explicit type annotation it conforms
 * to, in either spelling:
 *
 *   const handler: RequestHandler = (request, response, next) => …
 *   const create = (): RequestHandler => (request, response, next) => …
 *
 * Both say the parameters were dictated elsewhere. This covers every framework
 * handler in the repo (Express, React Router, node:http) without this rule
 * knowing that any of those frameworks exist — the annotation is the signal,
 * not the name it happens to resolve to.
 */
const isConformingToAnnotatedType = (node: FunctionNode): boolean => {
  const parent = node.parent;

  if (parent?.type === 'VariableDeclarator') {
    return parent.id.typeAnnotation !== undefined && parent.init === node;
  }

  // `(): T => (a, b) => …` — the reported function is the returned body of an
  // arrow that declares its return type, so that type fixes this signature.
  return (
    parent?.type === 'ArrowFunctionExpression' &&
    parent.body === node &&
    parent.returnType !== undefined
  );
};

const checkFunction = ({
  context,
  node,
}: {
  readonly context: TSESLint.RuleContext<'useObjectParam', []>;
  readonly node: FunctionNode;
}): void => {
  const params = node.params;

  // Skip if single parameter or no parameters. A lone ObjectPattern — the shape
  // this rule is asking for — is covered by the same check.
  if (params.length <= 1) {
    return;
  }

  // Skip signatures the author does not control (see the header).
  if (
    isArrayMethodCallback(node) ||
    isPromiseExecutor(node) ||
    isConformingToAnnotatedType(node)
  ) {
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
