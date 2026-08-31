/**
 * Reports a comment written above a function, component or type declaration, or
 * inside one.
 *
 * A name, a signature and a type already say what the code is. Prose repeating
 * them is a second copy of a fact, kept in the one place nothing checks — which
 * is how `collectPersistedStateSlices.util.ts` came to advertise a
 * sessionStorage reader that has never existed, and how two later designs came
 * to offer that reader as a free fallback. The rationale a comment carries has
 * two durable homes instead: the decision record for a choice whose alternative
 * looks equally reasonable, and the pull request or issue for an investigation.
 *
 * Three positions are exempt, each for a reason the AST can check.
 *
 * The **file-level header** stays: it describes the module, not a declaration,
 * and `.claude/rules/scripts.md` mandates one for every `.mjs`/`.cjs` script.
 * Every comment before the first token of the file is in that position.
 *
 * A **tool directive** stays, because it is not prose — deleting one changes
 * what another engine reports. `@vitest-environment` is the case that makes this
 * more than a formality: import sorting leaves it below the imports, so it is
 * not in header position and a rule without this exemption would demand its
 * removal from every jsdom suite in a repository.
 *
 * An **annotated JSDoc block in a JavaScript file** stays, and only there. A
 * TypeScript declaration carries its own types, so a `@param` beside one is
 * prose; a published `.mjs` package's `.d.mts` is derived from the block, so
 * dropping it ships an option defaulting to `[]` as `never[]`. The exemption
 * covers the whole block because the description a tool emits and prose that
 * merely shares the block are the same text to a parser — narrowing that is a
 * review's job, not this rule's.
 *
 * Deliberately not fixable. Deleting the comment is the right outcome for most
 * findings and the wrong one for the few that carry a trap nothing else records,
 * and the rule cannot tell those apart — an autofix would make the difference
 * invisible exactly where it matters, and `vp run lint` chains `--fix`.
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';

import { createRule } from './create-rule.ts';

type MessageIds = 'aboveDeclaration' | 'insideDeclaration';

type Options = readonly [
  {
    readonly annotationTags?: readonly string[];
    readonly directives?: readonly string[];
  }?,
];

const DEFAULT_DIRECTIVES = [
  '#__PURE__',
  '#endregion',
  '#region',
  '@__NO_SIDE_EFFECTS__',
  '@__PURE__',
  '@jsx',
  '@license',
  '@preserve',
  '@ts-check',
  '@ts-expect-error',
  '@ts-ignore',
  '@ts-nocheck',
  '@vite-ignore',
  '@vitest-environment',
  'biome-ignore',
  'c8 ignore',
  'eslint-disable',
  'eslint-enable',
  'eslint-env',
  'istanbul ignore',
  'oxlint-disable',
  'oxlint-enable',
  'prettier-ignore',
  'stylelint-disable',
  'type-coverage:',
  'v8 ignore',
  'webpackChunkName',
  'webpackIgnore',
] as const;

const DEFAULT_ANNOTATION_TAGS = [
  '@callback',
  '@overload',
  '@param',
  '@property',
  '@return',
  '@satisfies',
  '@template',
  '@type',
] as const;

const FUNCTION_EXPRESSION_TYPES = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionExpression,
]);

const EXPORT_TYPES = new Set<string>([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
]);

const TYPESCRIPT_FILE = /\.[cm]?tsx?$/;

const contentLines = (comment: TSESTree.Comment) =>
  comment.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*+/, '').trim())
    .filter((line) => line !== '');

const startsWithAny = (line: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => line.startsWith(prefix));

const holdsFunction = (declaration: TSESTree.VariableDeclaration) =>
  declaration.declarations.some((declarator) => {
    const { init } = declarator;
    if (init === null) return false;
    if (FUNCTION_EXPRESSION_TYPES.has(init.type)) return true;
    return (
      init.type === AST_NODE_TYPES.CallExpression &&
      init.arguments.some((argument) =>
        FUNCTION_EXPRESSION_TYPES.has(argument.type),
      )
    );
  });

const attachmentTarget = (node: TSESTree.Node) => {
  const { parent } = node;
  return parent !== undefined && EXPORT_TYPES.has(parent.type) ? parent : node;
};

export default createRule<Options, MessageIds>({
  create(context) {
    const [options] = context.options;
    const directives = options?.directives ?? DEFAULT_DIRECTIVES;
    const annotationTags = options?.annotationTags ?? DEFAULT_ANNOTATION_TAGS;
    const { sourceCode } = context;
    const isTypeScript = TYPESCRIPT_FILE.test(context.filename);
    const headerEnd =
      sourceCode.getFirstToken(sourceCode.ast)?.range[0] ??
      Number.POSITIVE_INFINITY;
    const reported = new Set<TSESTree.Comment>();

    const isExempt = (comment: TSESTree.Comment) => {
      const lines = contentLines(comment);
      const [first] = lines;
      if (first !== undefined && startsWithAny(first, directives)) return true;
      return (
        !isTypeScript &&
        comment.type === AST_TOKEN_TYPES.Block &&
        lines.some((line) => startsWithAny(line, annotationTags))
      );
    };

    const flag = (comment: TSESTree.Comment, messageId: MessageIds) => {
      if (reported.has(comment)) return;
      if (comment.range[1] <= headerEnd) return;
      if (isExempt(comment)) return;
      reported.add(comment);
      context.report({ loc: comment.loc, messageId });
    };

    const flagAbove = (node: TSESTree.Node) => {
      const target = attachmentTarget(node);
      const previous = sourceCode.getTokenBefore(target);
      for (const comment of sourceCode.getCommentsBefore(target)) {
        if (previous?.loc.end.line === comment.loc.start.line) continue;
        flag(comment, 'aboveDeclaration');
      }
    };

    const flagInside = (node: TSESTree.Node) => {
      for (const comment of sourceCode.getCommentsInside(node)) {
        flag(comment, 'insideDeclaration');
      }
    };

    const flagBoth = (node: TSESTree.Node) => {
      flagInside(node);
      flagAbove(node);
    };

    return {
      ArrowFunctionExpression: flagInside,
      ClassBody: flagInside,
      ClassDeclaration: flagAbove,
      FunctionDeclaration: flagBoth,
      FunctionExpression: flagInside,
      MethodDefinition: flagAbove,
      PropertyDefinition: flagAbove,
      TSDeclareFunction: flagAbove,
      TSEnumDeclaration: flagBoth,
      TSInterfaceDeclaration: flagBoth,
      TSTypeAliasDeclaration: flagBoth,
      VariableDeclaration(node: TSESTree.VariableDeclaration) {
        if (holdsFunction(node)) flagAbove(node);
      },
    } satisfies TSESLint.RuleListener;
  },
  defaultOptions: [{}],
  meta: {
    docs: {
      description:
        'Disallow a comment above a function, component or type declaration, or inside one',
    },
    messages: {
      aboveDeclaration:
        'Remove this comment. The declaration below it already states what it is; a choice whose alternative looks reasonable belongs in the ADR that owns it, and an investigation in the pull request or issue.',
      insideDeclaration:
        'Remove this comment. Prose inside a declaration is the copy nothing keeps true; a choice whose alternative looks reasonable belongs in the ADR that owns it, and an investigation in the pull request or issue.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          annotationTags: { items: { type: 'string' }, type: 'array' },
          directives: { items: { type: 'string' }, type: 'array' },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: 'no-explanatory-comments',
});
