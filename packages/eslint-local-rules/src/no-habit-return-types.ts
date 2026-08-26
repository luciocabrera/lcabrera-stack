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

/**
 * Whether any node beneath `root` matches, pruning subtrees `skip` claims.
 *
 * `root` itself is never skipped, so a caller can hand in the very construct
 * whose nested twins it wants pruned — a loop looking for its own `break`.
 */
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

/**
 * Every `return` reachable in this function, skipping nested ones.
 *
 * The statements rather than their arguments, because `return;` and `return x`
 * answer different questions here: the first says the function returns `void` on
 * that path, the second says what it returns.
 */
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

/** An expression TypeScript infers as exactly `boolean`, never a literal type. */
const isBooleanExpression = (node: TSESTree.Expression) =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean') ||
  (node.type === AST_NODE_TYPES.UnaryExpression && node.operator === '!') ||
  (node.type === AST_NODE_TYPES.BinaryExpression &&
    BOOLEAN_OPERATORS.has(node.operator));

const isJsxExpression = (node: TSESTree.Expression) =>
  node.type === AST_NODE_TYPES.JSXElement ||
  node.type === AST_NODE_TYPES.JSXFragment;

/**
 * TypeScript's own test for a loop that never ends, which is syntactic: the test
 * expression is absent, or it is the `true` keyword. It is not "can this loop be
 * shown to run forever" — `while (x)` with `x` a `true` constant is still a
 * loop the compiler treats as terminating. Mirrored rather than approximated so
 * that all four spellings agree with what inference actually does.
 */
const isAlwaysTrue = (test: null | TSESTree.Expression) =>
  test === null ||
  (test.type === AST_NODE_TYPES.Literal && test.value === true);

/** Statements that own an unlabelled `break`, so a nested one is not ours. */
const BREAK_SCOPE_TYPES = new Set<string>([
  AST_NODE_TYPES.DoWhileStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.SwitchStatement,
  AST_NODE_TYPES.WhileStatement,
]);

/**
 * Whether an unlabelled `break` inside this loop or switch belongs to it.
 *
 * Nested loops and switches are pruned, because their `break` is theirs. A
 * labelled `break` is not counted at all: it can leave through an enclosing
 * label, and counting one would say a loop finishes when it may not — the
 * direction that ends in a wrong report, which this rule cannot afford.
 */
const hasOwnBreak = (root: TSESTree.Node) =>
  contains({
    matches: (node) =>
      node.type === AST_NODE_TYPES.BreakStatement && node.label === null,
    root,
    skip: (node) =>
      BREAK_SCOPE_TYPES.has(node.type) || FUNCTION_NODE_TYPES.has(node.type),
  });

/**
 * Whether control can fall out of the bottom of a statement.
 *
 * This is the question TypeScript asks to decide between `void` and `never`: a
 * function with no returned value infers `void` if its bottom is reachable and
 * `never` if it is not. Getting it approximately right is not good enough in
 * either direction — saying "unreachable" too often silences the rule (the
 * first version disqualified any body containing a `throw`, which is most guard
 * clauses and cost almost all of its reach), and saying "reachable" too often
 * removes an annotation that was widening `never` to `void`.
 *
 * So the shapes are enumerated rather than approximated, and where a shape is
 * genuinely ambiguous the answer is `false`, which only ever costs silence.
 *
 * ONE CASE IS OUT OF REACH AND STAYS WRONG: a call to a function declared to
 * return `never` also makes the bottom unreachable, and `process.exit(1)` is the
 * everyday example. Deciding it means resolving the callee's signature, and an
 * ESLint rule in this plugin has the AST and `context.filename` — no type
 * checker. `(): void => { process.exit(1); }` is therefore reported and fixed to
 * `never`. It is written down here, in the README and in the changeset because
 * it cannot be fixed lexically; closing it needs a type-aware rule.
 */
const canCompleteNormally = (node: TSESTree.Statement): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.BlockStatement: {
      return node.body.every((statement) => canCompleteNormally(statement));
    }
    // `break` and `continue` leave through an enclosing statement, which that
    // statement's own case accounts for; neither reaches the next line here.
    case AST_NODE_TYPES.BreakStatement:
    case AST_NODE_TYPES.ContinueStatement:
    case AST_NODE_TYPES.ReturnStatement:
    case AST_NODE_TYPES.ThrowStatement: {
      return false;
    }
    // A loop the compiler treats as endless finishes only through a `break`.
    case AST_NODE_TYPES.DoWhileStatement:
    case AST_NODE_TYPES.ForStatement:
    case AST_NODE_TYPES.WhileStatement: {
      // The loop itself, not its body. `contains` exempts `root` from `skip` so
      // that a caller can hand in the construct whose nested twins it wants
      // pruned — hand it the body and that exemption lands on the wrong
      // statement whenever the body IS a break scope, which an unbraced
      // `while (true) while (x) break;` makes it. The inner `break` would then
      // count as this loop's.
      return !isAlwaysTrue(node.test) || hasOwnBreak(node);
    }
    // No `else` means the skip path reaches the bottom whatever the body does.
    case AST_NODE_TYPES.IfStatement: {
      return (
        node.alternate === null ||
        canCompleteNormally(node.consequent) ||
        canCompleteNormally(node.alternate)
      );
    }
    // A `break` to this label would finish it; not counted, per `hasOwnBreak`.
    case AST_NODE_TYPES.LabeledStatement: {
      return canCompleteNormally(node.body);
    }
    // Without a `default` every case can be skipped, so the bottom is reached.
    // With one, it takes a `break` or a last clause that falls off the end.
    case AST_NODE_TYPES.SwitchStatement: {
      return (
        node.cases.every((each) => each.test !== null) ||
        hasOwnBreak(node) ||
        (node.cases.at(-1)?.consequent ?? []).every((statement) =>
          canCompleteNormally(statement),
        )
      );
    }
    // A `finally` that cannot finish decides the whole statement; otherwise
    // either the body or the handler reaching the bottom is enough.
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

/** No returned value, and the function can still return — so `void`, not `never`. */
const canReturnVoid = (node: FunctionNode) => {
  // Narrowed inline rather than through an `isBlock` boolean, which does not
  // carry the narrowing to `canCompleteNormally`.
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

/**
 * Every path out of the function returns a value the predicate claims.
 *
 * Matching returns is not enough on its own — the bottom has to be unreachable
 * too. A block that can fall off its end returns `undefined` on that path, so
 * inference gives `T | undefined` and removing the annotation widens the
 * contract. That the annotated form is a `TS2366` under `strictNullChecks` is no
 * protection: lint runs on red trees constantly and `vp run lint` chains
 * `eslint --fix`, so the autofix would clear the type error by widening the
 * return type instead of by adding the missing return.
 *
 * A bare `return;` is the same hole with a statement in front of it, so every
 * return has to carry a value. A concise arrow body always returns its
 * expression, and neither question arises.
 */
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
  // The annotation is matched BEFORE anything walks the body. The common case
  // here is `: SomeType`, which no arm claims, and computing the returns and the
  // reachability first meant every one of those paid for two full subtree walks
  // to learn that the annotation was never a candidate.
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

const isSelfReferential = ({ name, node }: IsSelfReferentialArgs) =>
  name !== undefined &&
  contains({
    matches: (each) =>
      each.type === AST_NODE_TYPES.Identifier && each.name === name,
    root: node.body,
    skip: () => false,
  });

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
      // `isRedundant` first: it is cheap and rejects nearly everything, so the
      // whole-body walk `isSelfReferential` does runs only for a candidate.
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
