/**
 * Reports a comment written above a declaration, or inside a function,
 * component or type declaration.
 *
 * A name, a signature and a type already say what the code is. Prose repeating
 * them is a second copy of a fact, kept in the one place nothing checks — which
 * is how `collectPersistedStateSlices.util.ts` came to advertise a
 * sessionStorage reader that has never existed, and how two later designs came
 * to offer that reader as a free fallback. The rationale a comment carries has
 * two durable homes instead: the decision record for a choice whose alternative
 * looks equally reasonable, and the pull request or issue for an investigation.
 *
 * These positions are exempt, each for a reason the AST can check.
 *
 * The **file-level header** stays: it describes the module, not a declaration,
 * and `.claude/rules/scripts.md` mandates one for every `.mjs`/`.cjs` script.
 * The file's first comment block is in that position — adjacent `//` lines count
 * as one block, and a shebang does not start it. A later block is not: keying the
 * exemption on the first token instead exempts every comment before it, so in a
 * file that imports nothing a per-declaration JSDoc above the first declaration
 * went unreported.
 *
 * A **tool directive** stays, because it is not prose — deleting one changes
 * what another engine reports. The two positions where that bites are the
 * ordinary ones: a disable comment immediately above the declaration it covers,
 * and a coverage or type-checker directive inside a body. Both are positions
 * this rule reports, so without the exemption it would order a suppression
 * another engine reads to be deleted. ESLint's own inline forms are all in the
 * default list, not just the disabling ones: `global`, `globals`, `exported`
 * and the bare `eslint rule: "off"` config comment are read by ESLint too, and
 * deleting one makes `no-undef` fire on the name it declared.
 *
 * A note on a **member of an exported type** stays, in one shape only: a single
 * line, within `memberNoteMaxLength`, naming no record. The declaration is the
 * package's published surface, so the note reaches an installer's editor and the
 * API-surface snapshot, and a precondition, a default or an encoding is not
 * derivable from the member's type — while the rationale behind it, and a
 * pointer to a record that installer cannot open, are exactly what does not
 * belong there. Keying the exemption on the export alone would permit both.
 *
 * "Exported" is resolved by reachability within the module rather than by the
 * `export` keyword on the declaration itself. TypeScript reads a property's doc
 * comment from the type that declares it however that type is reached, so an
 * unexported alias intersected into an exported one still reaches an installer's
 * editor, and a type exported through a separate `export { … }` list carries no
 * keyword at all. Keying on the keyword reported both, which is how a usage
 * precondition on a published member came to be deleted for being "private".
 * The walk is name-based and stops at the module edge: a type imported from
 * another file is that file's to decide.
 *
 * An **annotated JSDoc block in a JavaScript file** stays, and only there. A
 * TypeScript declaration carries its own types, so a `@param` beside one is
 * prose; a published `.mjs` package's `.d.mts` is derived from the block, so
 * dropping it ships an option defaulting to `[]` as `never[]`. The exemption
 * covers the whole block because the description a tool emits and prose that
 * merely shares the block are the same text to a parser — narrowing that is a
 * review's job, not this rule's.
 *
 * The tags TypeScript itself reads are the exception to "and only there".
 * `@deprecated` and `@internal` change what the compiler emits and reports in
 * every language: dropping `@deprecated` takes the strike-through out of an
 * installer's editor, takes the tag out of the emitted declarations and
 * silences `no-deprecated` at every call site, and `@internal` is what
 * `stripInternal` keys on. They stay in a `.ts` file as well, which is what
 * `retainedTags` names.
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
    readonly memberNoteMaxLength?: number;
    readonly retainedTags?: readonly string[];
  }?,
];

const DEFAULT_MEMBER_NOTE_MAX_LENGTH = 120;

const RECORD_REFERENCE = /\badr[-\s]?\d/i;

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
  'NOSONAR',
  'biome-ignore',
  'c8 ignore',
  'eslint ',
  'eslint-disable',
  'eslint-enable',
  'eslint-env',
  'exported ',
  'fallow-ignore',
  'global ',
  'globals ',
  'istanbul ignore',
  'oxlint-disable',
  'oxlint-enable',
  'prettier-ignore',
  'react-doctor-disable',
  'stylelint-disable',
  'type-coverage:',
  'v8 ignore',
  'webpackChunkName',
  'webpackIgnore',
] as const;

const DEFAULT_RETAINED_TAGS = ['@deprecated', '@internal'] as const;

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

const EXPORT_TYPES = new Set<string>([
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
]);

const TYPE_DECLARATION_TYPES = new Set<string>([
  AST_NODE_TYPES.TSEnumDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
]);

type NamedTypeDeclaration =
  | TSESTree.TSEnumDeclaration
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSTypeAliasDeclaration;

const TYPESCRIPT_FILE = /\.[cm]?tsx?$/;

const contentLines = (comment: TSESTree.Comment) =>
  comment.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*+/, '').trim())
    .filter((line) => line !== '');

type StartsWithAnyArgs = {
  readonly line: string;
  readonly prefixes: readonly string[];
};

const startsWithAny = ({ line, prefixes }: StartsWithAnyArgs) =>
  prefixes.some((prefix) => line.startsWith(prefix));

type CarriesTagArgs = {
  readonly lines: readonly string[];
  readonly prefixes: readonly string[];
};

const carriesTag = ({ lines, prefixes }: CarriesTagArgs) =>
  lines.some((line) => startsWithAny({ line, prefixes }));

type FlagArgs = {
  readonly comment: TSESTree.Comment;
  readonly messageId: MessageIds;
};

const attachmentTarget = (node: TSESTree.Node) => {
  const { parent } = node;
  return parent !== undefined && EXPORT_TYPES.has(parent.type) ? parent : node;
};

const namedTypeDeclarations = (program: TSESTree.Program) => {
  const declarations = new Map<string, NamedTypeDeclaration>();
  for (const statement of program.body) {
    const node =
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      statement.declaration !== null
        ? statement.declaration
        : statement;
    if (TYPE_DECLARATION_TYPES.has(node.type)) {
      const declaration = node as NamedTypeDeclaration;
      declarations.set(declaration.id.name, declaration);
    }
  }
  return declarations;
};

const directlyExportedNames = (program: TSESTree.Program) => {
  const names = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) continue;
    const { declaration, specifiers } = statement;
    if (declaration !== null && TYPE_DECLARATION_TYPES.has(declaration.type)) {
      names.add((declaration as NamedTypeDeclaration).id.name);
    }
    for (const specifier of specifiers) {
      if (specifier.local.type === AST_NODE_TYPES.Identifier) {
        names.add(specifier.local.name);
      }
    }
  }
  return names;
};

const referencedTypeName = (record: Record<string, unknown>) => {
  const referenced =
    record.type === AST_NODE_TYPES.TSTypeReference
      ? record.typeName
      : record.expression;
  const identifier = referenced as undefined | { name?: string; type?: string };
  return identifier?.type === AST_NODE_TYPES.Identifier
    ? identifier.name
    : undefined;
};

const collectTypeReferences = (root: TSESTree.Node) => {
  const names = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (
      record.type === AST_NODE_TYPES.TSTypeReference ||
      record.type === AST_NODE_TYPES.TSInterfaceHeritage
    ) {
      const name = referencedTypeName(record);
      if (name !== undefined) names.add(name);
    }
    for (const [key, child] of Object.entries(record)) {
      if (key !== 'parent') visit(child);
    }
  };
  visit(root);
  return names;
};

type UnseenReferencesArgs = {
  readonly declaration: NamedTypeDeclaration;
  readonly declarations: ReadonlyMap<string, NamedTypeDeclaration>;
  readonly seen: ReadonlySet<string>;
};

const unseenReferences = ({
  declaration,
  declarations,
  seen,
}: UnseenReferencesArgs) =>
  [...collectTypeReferences(declaration)].filter(
    (name) => declarations.has(name) && !seen.has(name),
  );

const resolveExportedTypeNames = (program: TSESTree.Program) => {
  const declarations = namedTypeDeclarations(program);
  const exported = directlyExportedNames(program);
  const pending = [...exported];
  while (pending.length > 0) {
    const name = pending.pop();
    const declaration = name === undefined ? undefined : declarations.get(name);
    const referenced =
      declaration === undefined
        ? []
        : unseenReferences({ declaration, declarations, seen: exported });
    for (const reference of referenced) {
      exported.add(reference);
      pending.push(reference);
    }
  }
  return exported;
};

const resolveHeaderEnd = (sourceCode: TSESLint.SourceCode) => {
  const firstToken = sourceCode.getFirstToken(sourceCode.ast)?.range[0];
  if (firstToken === undefined) return Infinity;

  const hasShebang = sourceCode.getText().startsWith('#!');
  const before = sourceCode
    .getAllComments()
    .filter((comment) => comment.range[1] <= firstToken);
  const isShebang = (comment: TSESTree.Comment) =>
    hasShebang && comment.range[0] === 0;
  const shebangEnd =
    before.find((comment) => isShebang(comment))?.range[1] ?? 0;

  const leading = before.filter((comment) => !isShebang(comment));
  const [head] = leading;
  if (head === undefined) return shebangEnd;

  let last = head;
  for (const comment of leading.slice(1)) {
    if (comment.loc.start.line !== last.loc.end.line + 1) break;
    last = comment;
  }
  return last.range[1];
};

export default createRule<Options, MessageIds>({
  create(context) {
    const [options] = context.options;
    const directives = options?.directives ?? DEFAULT_DIRECTIVES;
    const annotationTags = options?.annotationTags ?? DEFAULT_ANNOTATION_TAGS;
    const retainedTags = options?.retainedTags ?? DEFAULT_RETAINED_TAGS;
    const memberNoteMaxLength =
      options?.memberNoteMaxLength ?? DEFAULT_MEMBER_NOTE_MAX_LENGTH;
    const { sourceCode } = context;
    const isTypeScript = TYPESCRIPT_FILE.test(context.filename);
    const headerEnd = resolveHeaderEnd(sourceCode);
    const exportedTypeNames = resolveExportedTypeNames(sourceCode.ast);
    const reported = new Set<TSESTree.Comment>();

    const isExempt = (comment: TSESTree.Comment) => {
      const lines = contentLines(comment);
      const [first] = lines;
      if (
        first !== undefined &&
        startsWithAny({ line: first, prefixes: directives })
      )
        return true;
      if (comment.type !== AST_TOKEN_TYPES.Block) return false;
      return (
        carriesTag({ lines, prefixes: retainedTags }) ||
        (!isTypeScript && carriesTag({ lines, prefixes: annotationTags }))
      );
    };

    const flag = ({ comment, messageId }: FlagArgs) => {
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
        flag({ comment, messageId: 'aboveDeclaration' });
      }
    };

    const flagInside = (node: TSESTree.Node) => {
      for (const comment of sourceCode.getCommentsInside(node)) {
        flag({ comment, messageId: 'insideDeclaration' });
      }
    };

    const flagBoth = (node: TSESTree.Node) => {
      flagInside(node);
      flagAbove(node);
    };

    const isMemberNote = (comment: TSESTree.Comment) =>
      comment.type === AST_TOKEN_TYPES.Block &&
      comment.loc.start.line === comment.loc.end.line &&
      comment.range[1] - comment.range[0] <= memberNoteMaxLength &&
      !RECORD_REFERENCE.test(comment.value);

    const flagInsideExportedType = (node: TSESTree.Node) => {
      for (const comment of sourceCode.getCommentsInside(node)) {
        if (isMemberNote(comment)) continue;
        flag({ comment, messageId: 'insideDeclaration' });
      }
    };

    const flagTypeDeclaration = (node: NamedTypeDeclaration) => {
      if (exportedTypeNames.has(node.id.name)) flagInsideExportedType(node);
      else flagInside(node);
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
      TSEnumDeclaration: flagTypeDeclaration,
      TSInterfaceDeclaration: flagTypeDeclaration,
      TSTypeAliasDeclaration: flagTypeDeclaration,
      VariableDeclaration: flagAbove,
    } satisfies TSESLint.RuleListener;
  },
  defaultOptions: [{}],
  meta: {
    docs: {
      description:
        'Disallow a comment above a declaration, or inside a function, component or type declaration',
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
          memberNoteMaxLength: { minimum: 0, type: 'number' },
          retainedTags: { items: { type: 'string' }, type: 'array' },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
  name: 'no-explanatory-comments',
});
