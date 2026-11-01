/**
 * Finds directive-shaped text in the real comments of a source file, as the
 * TypeScript parser reads them, so a string, a regex literal, JSX text or a
 * template interpolation can neither hide a directive nor fake one. A
 * directive counts where an analyzer reads one: at the start of a comment, at
 * the start of a line inside a block comment, or after an opener nested in the
 * comment text.
 */
import { ts } from 'ts-morph';

const SCRIPT_KINDS = {
  cjs: ts.ScriptKind.JS,
  cts: ts.ScriptKind.TS,
  js: ts.ScriptKind.JS,
  jsx: ts.ScriptKind.JSX,
  mjs: ts.ScriptKind.JS,
  mts: ts.ScriptKind.TS,
  ts: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX,
};

const scriptKind = (file) =>
  SCRIPT_KINDS[file.split('.').at(-1)] ?? ts.ScriptKind.TSX;

const rangesAround = ({ node, text }) => [
  ...(ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []),
  ...(ts.getTrailingCommentRanges(text, node.getEnd()) ?? []),
];

export const commentRanges = ({ file, text }) => {
  const source = ts.createSourceFile(
    file,
    text,
    { languageVersion: ts.ScriptTarget.Latest },
    undefined,
    scriptKind(file),
  );
  const found = new Map();
  const jsxText = new Set();
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.JsxText) jsxText.add(node.pos);
    for (const range of rangesAround({ node, text })) {
      found.set(range.pos, range);
    }
    for (const child of node.getChildren(source)) visit(child);
  };
  visit(source);
  return {
    ranges: [...found.values()]
      .filter(({ pos }) => !jsxText.has(pos))
      .toSorted((left, right) => left.pos - right.pos),
    source,
  };
};

const isDirectiveSpot = (before) => {
  const trimmed = before.trimEnd();
  if (trimmed.endsWith('//') || trimmed.endsWith('/*')) return true;
  const leading = before.trim();
  return leading === '' || leading === '*';
};

const lineStart = ({ comment, index }) => comment.lastIndexOf('\n', index) + 1;

const restOf = ({ comment, end, next }) => {
  const lineEnd = comment.indexOf('\n', end);
  const stops = [next, lineEnd === -1 ? undefined : lineEnd].filter(
    (stop) => stop !== undefined,
  );
  return comment.slice(end, Math.min(comment.length, ...stops));
};

const directivesIn = ({ comment, pattern }) => {
  const matches = [...comment.matchAll(pattern)];
  return matches.flatMap((match, position) =>
    isDirectiveSpot(
      comment.slice(lineStart({ comment, index: match.index }), match.index),
    )
      ? [
          {
            offset: match.index,
            rest: restOf({
              comment,
              end: match.index + match[0].length,
              next: matches[position + 1]?.index,
            }),
            token: match[0],
          },
        ]
      : [],
  );
};

export const findCommentDirectives = ({ file, pattern, text }) => {
  const { ranges, source } = commentRanges({ file, text });
  return ranges.flatMap(({ end, pos }) =>
    directivesIn({ comment: text.slice(pos, end), pattern }).map(
      ({ offset, rest, token }) => {
        const { character, line } = source.getLineAndCharacterOfPosition(
          pos + offset,
        );
        return { column: character, line: line + 1, rest, token };
      },
    ),
  );
};
