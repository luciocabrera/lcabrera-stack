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
 * - `: void` on a block body with no `return <value>` whose end point is
 *   plainly reachable (see `mayNotCompleteNormally`)
 * - `: Promise<void>` on an `async` block body meeting the same two conditions
 * - `: boolean` where every returned expression is a comparison, a `!`, or a
 *   boolean literal
 * - `: JSX.Element` on a function whose every return is JSX
 *
 * Everywhere else it is silent, which is the point: there is no case where a
 * deliberate widening is reported, so there is no escape hatch to add. That
 * matters more than reach here — the repository forbids inline disables, so a
 * rule with false positives would have nowhere to go.
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

/** Functions that can carry a body, and so an inferrable return type. */
type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

type MessageIds = 'redundant';

/** `Promise<void>` is spelled as a reference with one argument. */
const isPromiseOfVoid = (node: TSESTree.TypeNode) =>
  node.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeName.name === 'Promise' &&
  node.typeArguments?.params.length === 1 &&
  node.typeArguments.params[0]?.type === AST_NODE_TYPES.TSVoidKeyword;

/**
 * `JSX.Element` and `React.JSX.Element` only — never `ReactNode` or a bare
 * `ReactElement`, both of which are wider than what a JSX body infers and so are
 * doing the job this rule must not report.
 */
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

/**
 * Visits every node beneath `root`, skipping `parent` links.
 *
 * `parent` is walked into by any naive `Object.values` traversal and closes a
 * cycle immediately — the first attempt here used `JSON.stringify` and threw
 * "Converting circular structure to JSON" on the simplest recursive case.
 *
 * `shouldDescend` both observes the node and decides whether its children are
 * worth walking; returning `false` prunes that subtree.
 */
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

const FUNCTION_NODE_TYPES = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/** Every `return <expr>` reachable in this function, skipping nested ones. */
const returnedExpressions = (body: TSESTree.Node) => {
  const found: TSESTree.Expression[] = [];

  walkNodes({
    root: body,
    shouldDescend: (node) => {
      if (node !== body && FUNCTION_NODE_TYPES.has(node.type)) return false;
      if (node.type === AST_NODE_TYPES.ReturnStatement) {
        if (node.argument !== null) found.push(node.argument);
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

/** An expression TypeScript infers as exactly `boolean`, never a literal type. */
const isBooleanExpression = (node: TSESTree.Expression): boolean =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean') ||
  (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === '!') ||
  (node.type === AST_NODE_TYPES.BinaryExpression &&
    BOOLEAN_OPERATORS.has(node.operator));

const isJsxExpression = (node: TSESTree.Expression) =>
  node.type === AST_NODE_TYPES.JSXElement ||
  node.type === AST_NODE_TYPES.JSXFragment;

/** A loop with nothing that can end it: `for (;;)` and `while (true)`. */
const isEndlessLoop = (node: TSESTree.Node) =>
  (node.type === AST_NODE_TYPES.ForStatement && node.test === null) ||
  (node.type === AST_NODE_TYPES.WhileStatement &&
    node.test.type === AST_NODE_TYPES.Literal &&
    node.test.value === true);

/**
 * Whether the block's end point might be unreachable.
 *
 * A function with no returned value whose end point cannot be reached infers
 * `never`, not `void` — so `: void` there is a *widening*, exactly what this
 * rule must not touch. Reachability is a property of the whole body, not of one
 * statement: an `if`/`else` where both arms throw, a `switch` whose `default`
 * throws, `for (;;)`, and a `finally` that throws all make the end unreachable,
 * and not one of them puts a `throw` among the block's direct children.
 *
 * With no type checker the test has to be lexical, so it is deliberately blunt:
 * any `throw` outside a nested function, or any endless loop, disqualifies the
 * block. That over-reports — a guard clause (`if (!a) { throw … }`) leaves the
 * end reachable and really does infer `void`, and the rule now stays silent on
 * it — which is the trade this rule makes everywhere. A missed habit costs a
 * review comment; a false positive auto-narrows a published signature to `never`
 * and, with inline disables forbidden, leaves the consumer nowhere to put the
 * exception.
 */
const mayNotCompleteNormally = (body: TSESTree.BlockStatement) => {
  let isFound = false;

  walkNodes({
    root: body,
    shouldDescend: (node) => {
      if (isFound) return false;
      if (node !== body && FUNCTION_NODE_TYPES.has(node.type)) return false;
      if (node.type === AST_NODE_TYPES.ThrowStatement || isEndlessLoop(node)) {
        isFound = true;
        return false;
      }
      return true;
    },
  });

  return isFound;
};

/**
 * Whether the annotation is one inference is guaranteed to reproduce.
 *
 * Each arm pairs a type with the body shape that pins it. The pairing is what
 * makes the rule safe: `: void` alone says nothing, `: void` on a block body
 * that returns no value cannot be hiding a wider contract.
 */
type IsRedundantArgs = {
  readonly annotation: TSESTree.TypeNode;
  readonly node: FunctionNode;
};

const isRedundant = ({ annotation, node }: IsRedundantArgs) => {
  // Narrowed inline rather than through an `isBlock` boolean, which does not
  // carry the narrowing to `mayNotCompleteNormally`.
  const { body } = node;
  const returned =
    body.type === AST_NODE_TYPES.BlockStatement
      ? returnedExpressions(body)
      : [body];
  const canCompleteNormally =
    body.type === AST_NODE_TYPES.BlockStatement &&
    !mayNotCompleteNormally(body);

  if (annotation.type === AST_NODE_TYPES.TSVoidKeyword) {
    return canCompleteNormally && returned.length === 0;
  }
  if (isPromiseOfVoid(annotation)) {
    return node.async && canCompleteNormally && returned.length === 0;
  }
  if (annotation.type === AST_NODE_TYPES.TSBooleanKeyword) {
    return (
      !node.async &&
      returned.length > 0 &&
      returned.every((each) => isBooleanExpression(each as TSESTree.Expression))
    );
  }
  if (isJsxElement(annotation)) {
    return (
      !node.async &&
      returned.length > 0 &&
      returned.every((each) => isJsxExpression(each as TSESTree.Expression))
    );
  }
  return false;
};

/**
 * A function that names itself in its own body. TypeScript can fail to infer a
 * recursive return type, so an annotation there may be load-bearing even when
 * the shape looks ordinary. Matched lexically, because that is all this rule
 * has, and erring towards silence is the whole design — a shadowing local of the
 * same name makes this over-cautious, never wrong.
 */
type IsSelfReferentialArgs = {
  readonly name: string | undefined;
  readonly node: FunctionNode;
};

const isSelfReferential = ({ name, node }: IsSelfReferentialArgs) => {
  if (name === undefined) return false;
  let isFound = false;

  walkNodes({
    root: node.body,
    shouldDescend: (each) => {
      if (isFound) return false;
      if (each.type === AST_NODE_TYPES.Identifier && each.name === name) {
        isFound = true;
        return false;
      }
      return true;
    },
  });

  return isFound;
};

/** The name a function is known by, for the recursion check. */
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
      if (isSelfReferential({ name: functionName(node), node })) return;
      if (!isRedundant({ annotation, node })) return;

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
