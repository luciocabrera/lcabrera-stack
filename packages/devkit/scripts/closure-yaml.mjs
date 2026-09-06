/*
 * Pulling the references out of a workflow file: the actions it uses, the shell
 * its steps run, and the repository secrets it reads.
 *
 * Reads three constructs out of a document that is otherwise none of this
 * package's business, so it is a narrow reader rather than a YAML parser — the
 * same bargain `frontmatter.mjs` makes, for the same reason.
 *
 * The patterns hold the constraint `closure-extract.mjs` records: none of them
 * restarts a scan inside a run it has already read.
 */

const USES_KEY = /^[ \t]*(?:-[ \t]+)?uses:(.+)/;

const RUN_KEY = /^[ \t]*(?:-[ \t]+)?run:(.*)/;

const BLOCK_SCALAR = /^[|>][-+\d]*$/;

const TRAILING_COMMENT = /(?:^|[ \t])#.*/;

const QUOTED = /^(['"])(.*)\1$/;

const SECRET_REFERENCE = /\bsecrets\.([A-Za-z_][A-Za-z0-9_-]*)/g;

const unquote = (value) => QUOTED.exec(value)?.[2] ?? value;

const indentOf = (line) => line.length - line.trimStart().length;

const blockBody = ({ keyIndent, lines, start }) => {
  const rest = lines.slice(start);
  const end = rest.findIndex(
    (line) => line.trim() !== '' && indentOf(line) <= keyIndent,
  );
  return (end === -1 ? rest : rest.slice(0, end))
    .map((text, offset) => ({ line: start + offset + 1, text }))
    .filter((entry) => entry.text.trim() !== '');
};

/** @param {string} content */
export const extractUses = (content) =>
  content.split('\n').flatMap((line, index) => {
    const declared = USES_KEY.exec(line)?.[1];
    if (declared === undefined) return [];
    const target = unquote(declared.replace(TRAILING_COMMENT, '').trim());
    return target === '' ? [] : [{ line: index + 1, target }];
  });

/** @param {string} content */
export const extractRunScripts = (content) => {
  const lines = content.split('\n');
  return lines.flatMap((line, index) => {
    const declared = RUN_KEY.exec(line)?.[1];
    if (declared === undefined) return [];
    const inline = declared.trim();
    if (inline !== '' && !BLOCK_SCALAR.test(inline)) {
      return [{ line: index + 1, text: unquote(inline) }];
    }
    return blockBody({
      keyIndent: line.indexOf('run:'),
      lines,
      start: index + 1,
    });
  });
};

const expressionsIn = (line) => {
  const bodies = [];
  let open = line.indexOf('${{');
  while (open !== -1) {
    const close = line.indexOf('}}', open + 3);
    if (close === -1) return bodies;
    bodies.push(line.slice(open + 3, close));
    open = line.indexOf('${{', close + 2);
  }
  return bodies;
};

const referencesIn = ({ expression, line }) =>
  expression.split('||').flatMap((operand, position, operands) =>
    [...operand.matchAll(SECRET_REFERENCE)].map((reference) => ({
      fallback: position < operands.length - 1,
      line,
      name: reference[1],
    })),
  );

/** @param {string} content */
export const extractSecretReferences = (content) =>
  content
    .split('\n')
    .flatMap((line, index) =>
      expressionsIn(line).flatMap((expression) =>
        referencesIn({ expression, line: index + 1 }),
      ),
    );
