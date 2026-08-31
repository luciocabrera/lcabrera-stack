/**
 * Reports a return-type annotation that TypeScript would have written itself.
 *
 * **What makes this hard, and what the rule does about it.** An annotation is
 * sometimes deliberate: it can promise callers *less* than the function really
 * returns, so that the extra detail never becomes part of the contract.
 *
 * ```ts
 * const makePet = (): Animal => new Dog(); // deliberate: callers get Animal
 * const getName = (): string => user.name; // habit: inference says string
 * ```
 *
 * Those two are the same shape in the text. Telling them apart means asking
 * TypeScript what it would have inferred and comparing, and this plugin has no
 * type checker — a rule here gets the AST and `context.filename`, nothing else.
 *
 * So the rule does not try. It reports only annotations that **cannot** be
 * hiding anything, because the shape of the body fixes the inferred type
 * exactly:
 *
 * - `: void` on a block body with no `return <value>` that either reaches its
 *   bottom or returns bare (see `canCompleteNormally`)
 * - `: Promise<void>` on an `async` block body meeting the same conditions
 * - `: boolean` where every return carries a comparison, a `!`, or a boolean
 *   literal, and the bottom is unreachable
 * - `: JSX.Element` on a function whose every return carries JSX, under the same
 *   reachability condition
 *
 * Everywhere else it is silent, which is the point: a deliberate widening is not
 * reported, so there is no escape hatch to add. That matters more than reach
 * here — the repository forbids inline disables, so a rule with false positives
 * would have nowhere to go.
 *
 * **One exception survives and is not fixable in this plugin.** A call to a
 * function declared `(): never` also makes a body's bottom unreachable, so
 * `(): void => { process.exit(1); }` infers `never` and this rule removes the
 * annotation, narrowing it. Deciding that means resolving the callee's
 * signature, which needs a type checker. It is stated in `canCompleteNormally`,
 * pinned by a test named as a limitation, and repeated in the README and the
 * changeset, because a consumer meeting it has no inline disable to reach for.
 *
 * The cost is stated rather than hidden: `(): string` on a body returning a
 * `string` is a habit this rule will not catch, because the same annotation on a
 * body returning `'a' | 'b'` is a widening. Reviews still own that.
 *
 * A concise arrow body (`=> expr`) is never reported for `void` or
 * `Promise<void>`: `(): void => doSomething()` discards a real return value on
 * purpose, which is a widening and one of the commonest.
 */

import type { TSESTree } from '@typescript-eslint/utils';

import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

type MessageIds = 'redundant';

const isPromiseOfVoid = (node: TSESTree.TypeNode) =>
  node.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeName.name === 'Promise' &&
  node.typeArguments?.params.length === 1 &&
  node.typeArguments.params[0]?.type === AST_NODE_TYPES.TSVoidKeyword;

const isJsxElement = (node: TSESTree.TypeNode) => {
  if (node.type !== AST_NODE_TYPES.TSTypeReference) return false;
  const { typeName } = node;
  return (
    typeName.type === AST_NODE_TYPES.TSQualifiedName &&
    typeName.right.name === 'Element' &&
    (typeName.left.type === AST_NODE_TYPES.Identifier
      ? typeName.left.name === 'JSX'
      : typeName.left.type === AST_NODE_TYPES.TSQualifiedName &&
        typeName.left.right.name === 'JSX')
  );
};

type WalkNodesArgs = {
  readonly root: TSESTree.Node;
  readonly shouldDescend: (node: TSESTree.Node) => boolean;
};

const walkNodes = ({ root, shouldDescend }: WalkNodesArgs) => {
  if (!shouldDescend(root)) return;
  for (const [key, child] of Object.entries(root)) {
    if (key === 'parent') continue;
    const children = Array.isArray(child) ? child : [child];
    for (const each of children) {
      if (each?.type !== undefined) {
        walkNodes({ root: each as TSESTree.Node, shouldDescend });
      }
    }
  }
};

type ContainsArgs = {
  readonly matches: (node: TSESTree.Node) => boolean;
  readonly root: TSESTree.Node;
  readonly skip: (node: TSESTree.Node) => boolean;
};

const contains = ({ matches, root, skip }: ContainsArgs) => {
  let isFound = false;

  walkNodes({
    root,
    shouldDescend: (node) => {
      if (isFound) return false;
      if (node !== root && skip(node)) return false;
      if (matches(node)) {
        isFound = true;
        return false;
      }
      return true;
    },
  });

  return isFound;
};

const FUNCTION_NODE_TYPES = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

const returnStatements = (body: TSESTree.Node) => {
  const found: TSESTree.ReturnStatement[] = [];

  walkNodes({
    root: body,
    shouldDescend: (node) => {
      if (node !== body && FUNCTION_NODE_TYPES.has(node.type)) return false;
      if (node.type === AST_NODE_TYPES.ReturnStatement) {
        found.push(node);
        return false;
      }
      return true;
    },
  });

  return found;
};

const BOOLEAN_OPERATORS = new Set([
  '!=',
  '!==',
  '<',
  '<=',
  '==',
  '===',
  '>',
  '>=',
  'in',
  'instanceof',
]);

const isBooleanExpression = (node: TSESTree.Expression) =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean') ||
  (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === '!') ||
  (node.type === AST_NODE_TYPES.BinaryExpression &&
    BOOLEAN_OPERATORS.has(node.operator));

const isJsxExpression = (node: TSESTree.Expression) =>
  node.type === AST_NODE_TYPES.JSXElement ||
  node.type === AST_NODE_TYPES.JSXFragment;

const isAlwaysTrue = (test: null | TSESTree.Expression) =>
  test === null ||
  (test.type === AST_NODE_TYPES.Literal && test.value === true);

const BREAK_SCOPE_TYPES = new Set<string>([
  AST_NODE_TYPES.DoWhileStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.SwitchStatement,
  AST_NODE_TYPES.WhileStatement,
]);

const hasOwnBreak = (root: TSESTree.Node) =>
  contains({
    matches: (node) =>
      node.type === AST_NODE_TYPES.BreakStatement && node.label === null,
    root,
    skip: (node) =>
      BREAK_SCOPE_TYPES.has(node.type) || FUNCTION_NODE_TYPES.has(node.type),
  });

const canCompleteNormally = (node: TSESTree.Statement): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.BlockStatement: {
      return node.body.every((statement) => canCompleteNormally(statement));
    }
    case AST_NODE_TYPES.BreakStatement:
    case AST_NODE_TYPES.ContinueStatement:
    case AST_NODE_TYPES.ReturnStatement:
    case AST_NODE_TYPES.ThrowStatement: {
      return false;
    }
    case AST_NODE_TYPES.DoWhileStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.WhileStatement: {
      return !isAlwaysTrue(node.test) || hasOwnBreak(node);
    }
    case AST_NODE_TYPES.IfStatement: {
      return (
        node.alternate === null ||
        canCompleteNormally(node.consequent) ||
        canCompleteNormally(node.alternate)
      );
    }
    case AST_NODE_TYPES.LabeledStatement: {
      return canCompleteNormally(node.body);
    }
    case AST_NODE_TYPES.SwitchStatement: {
      return (
        node.cases.every((each) => each.test !== null) ||
        hasOwnBreak(node) ||
        (node.cases.at(-1)?.consequent ?? []).every((statement) =>
          canCompleteNormally(statement),
        )
      );
    }
    case AST_NODE_TYPES.TryStatement: {
      return (
        (node.finalizer === null || canCompleteNormally(node.finalizer)) &&
        (canCompleteNormally(node.block) ||
          (node.handler !== null && canCompleteNormally(node.handler.body)))
      );
    }
    default: {
      return true;
    }
  }
};

type IsRedundantArgs = {
  readonly annotation: TSESTree.TypeNode;
  readonly node: FunctionNode;
};

const canReturnVoid = (node: FunctionNode) => {
  const { body } = node;
  if (body.type !== AST_NODE_TYPES.BlockStatement) return false;

  const returns = returnStatements(body);

  return (
    returns.every((each) => each.argument === null) &&
    (canCompleteNormally(body) || returns.length > 0)
  );
};

type HasOnlyReturnsMatchingArgs = {
  readonly node: FunctionNode;
  readonly predicate: (expression: TSESTree.Expression) => boolean;
};

const hasOnlyReturnsMatching = ({
  node,
  predicate,
}: HasOnlyReturnsMatchingArgs) => {
  const { body } = node;
  if (body.type !== AST_NODE_TYPES.BlockStatement) return predicate(body);

  const returns = returnStatements(body);

  return (
    !canCompleteNormally(body) &&
    returns.length > 0 &&
    returns.every((each) => each.argument !== null && predicate(each.argument))
  );
};

const isRedundant = ({ annotation, node }: IsRedundantArgs) => {
  if (annotation.type === AST_NODE_TYPES.TSVoidKeyword) {
    return canReturnVoid(node);
  }
  if (isPromiseOfVoid(annotation)) {
    return node.async && canReturnVoid(node);
  }
  if (annotation.type === AST_NODE_TYPES.TSBooleanKeyword) {
    return (
      !node.async &&
      hasOnlyReturnsMatching({ node, predicate: isBooleanExpression })
    );
  }
  if (isJsxElement(annotation)) {
    return (
      !node.async &&
      hasOnlyReturnsMatching({ node, predicate: isJsxExpression })
    );
  }
  return false;
};

type IsSelfReferentialArgs = {
  readonly name: string | undefined;
  readonly node: FunctionNode;
};

const isSelfReferential = ({ name, node }: IsSelfReferentialArgs) =>
  name !== undefined &&
  contains({
    matches: (each) =>
      each.type === AST_NODE_TYPES.Identifier && each.name === name,
    root: node.body,
    skip: () => false,
  });

const functionName = (node: FunctionNode) => {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return node.id?.name;
  }
  const { parent } = node;
  return parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
    ? parent.id.name
    : undefined;
};

export default createRule<[], MessageIds>({
  create(context) {
    const check = (node: FunctionNode) => {
      const annotation = node.returnType?.typeAnnotation;
      if (annotation === undefined) return;
      if (!isRedundant({ annotation, node })) return;
      if (isSelfReferential({ name: functionName(node), node })) return;

      context.report({
        fix: (fixer) => fixer.remove(node.returnType as TSESTree.Node),
        messageId: 'redundant',
        node: node.returnType as TSESTree.Node,
      });
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Disallow a return-type annotation TypeScript would infer identically',
    },
    fixable: 'code',
    messages: {
      redundant:
        'Remove this return type — TypeScript infers exactly it from the body. Annotate only when inference fails or must be widened.',
    },
    schema: [],
    type: 'suggestion',
  },
  name: 'no-habit-return-types',
});
