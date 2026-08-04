// ✅ Enforces that every member of a component props type is `readonly`
//
// Non-Negotiable Rule 1 is "type, never interface; all properties readonly;
// never any; never React.FC". Three of those four already fail the build
// (consistent-type-definitions, no-explicit-any, Biome's
// useReactFunctionComponents) — the `readonly` clause was enforced by nothing,
// which is the dangerous shape: a rule that fails loudly three-quarters of the
// time reads as fully enforced.
//
// There is no debt to clear (a scan of 204 props types found no genuine
// violation), so this is a ratchet in the same spirit as the repo's Phase-1
// Biome rules: lock in a convention the codebase already follows so no agent
// can regress it.
//
// Scope is deliberately `*Props` type aliases rather than every type alias.
// That matches the props-typing convention in `.claude/rules/react-components.md`
// and keeps the rule free of judgement calls; broader readonly discipline stays
// documented but unmechanised.
//
// Only members the type itself declares are checked. `CardProps =
// ComponentPropsWithoutRef<'div'> & { readonly color?: CardColor }` inherits
// React's own non-readonly members through the intersection, and those are not
// ours to change — the rule reads the object literal(s) only.

import type { TSESTree } from '@typescript-eslint/utils';

import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

/** The object literals a props type declares itself, unwrapping intersections. */
const ownTypeLiterals = (
  node: TSESTree.TypeNode,
): readonly TSESTree.TSTypeLiteral[] => {
  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return [node];
  }
  if (node.type === AST_NODE_TYPES.TSIntersectionType) {
    return node.types.flatMap((member) => ownTypeLiterals(member));
  }
  return [];
};

/**
 * The declared members still missing `readonly`. Method signatures cannot carry
 * the modifier and an index signature's `readonly` sits in a different
 * position, so both are skipped.
 */
const mutableMembers = (node: TSESTree.TypeNode) =>
  ownTypeLiterals(node).flatMap((literal) =>
    literal.members.filter(
      (member) =>
        member.type === AST_NODE_TYPES.TSPropertySignature &&
        member.readonly !== true,
    ),
  );

export default createRule({
  create(context) {
    return {
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration) {
        if (!node.id.name.endsWith('Props')) {
          return;
        }

        for (const member of mutableMembers(node.typeAnnotation)) {
          context.report({
            data: { typeName: node.id.name },
            fix(fixer) {
              return fixer.insertTextBefore(member, 'readonly ');
            },
            messageId: 'requireReadonly',
            node: member,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        'Require every member of a component props type to be readonly',
    },
    fixable: 'code',
    messages: {
      requireReadonly:
        'Every property of `{{typeName}}` must be `readonly` (AGENTS.md Rule 1). Props are never mutated — mark it `readonly`.',
    },
    schema: [],
    type: 'problem',
  },
  name: 'readonly-props',
});
