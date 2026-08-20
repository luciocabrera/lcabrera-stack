/*
 * Reading one declaration out of a shipped file's frontmatter: the config keys
 * it cannot run without.
 *
 * Why: `sync` only refuses to write a file whose `{{commands.*}}` placeholders
 * cannot be substituted, and a skill can depend on a consumer's config without
 * ever emitting a placeholder for it — prose that says "your repository's agent
 * document" reads the key without interpolating it. That dependency is invisible
 * to the placeholder gate, so the file lands in a consumer who cannot satisfy it
 * and fails at the moment an agent follows it. `requires:` makes the dependency
 * something a machine can check, here and in `closure`.
 *
 * Deliberately not a YAML parser. One key is read out of a block that is
 * otherwise none of this package's business, and a parser would buy a dependency
 * and a large surface for a single list. The narrow form is the same bargain
 * `placeholders.mjs` makes — narrow in what it reads, not in how the list may be
 * spelled, since a spelling this cannot see is a gate that stops firing quietly.
 * So every shape a person writes a short list in is read: a flow array, on the
 * key's own line or opening on the next; a block sequence; and a lone scalar,
 * quoted or not. Comments and blank lines are dropped wherever YAML allows them,
 * which includes between the key and its items.
 *
 * Two YAML spellings are knowingly not read: a block scalar (`|`, `>`) and an
 * anchor or alias. Neither is a way anyone writes a list of short keys, so
 * neither is reachable by the edit this guards against — someone restyling a
 * declaration into another ordinary spelling.
 *
 * Only `config.`-prefixed entries are claims on the consumer's configuration.
 * `requires:` already means other things in frontmatter written for humans — a
 * shipped reference file names a library version range with it — and reading
 * those as config keys would refuse to write a file that needs nothing.
 */

const FENCE = '---';

const CONFIG_PREFIX = 'config.';

const REQUIRES_KEY = /^requires:[ \t]*/;

/** One item of a block sequence, at any indent YAML would accept for one. */
const SEQUENCE_ITEM = /^[ \t]*-[ \t]+(.*)$/;

const QUOTES = /^['"]|['"]$/g;

/** A `# comment` running to end of line, which YAML does not read as value. */
const COMMENT = /(?:^|[ \t])#.*$/;

/**
 * The frontmatter body, line by line, or nothing when the file does not open
 * with a fence. The first line must be exactly the fence so that a horizontal
 * rule or a longer run of dashes is not read as the start of a block.
 */
const frontmatterLines = (content) => {
  if (!content.startsWith(FENCE)) return [];
  const lines = content.replaceAll('\r\n', '\n').split('\n');
  if (lines[0] !== FENCE) return [];
  const end = lines.findIndex(
    (line, index) => index > 0 && line.trim() === FENCE,
  );
  return end === -1 ? [] : lines.slice(1, end);
};

/**
 * The lines that carry value: comments removed, then anything left blank
 * dropped. Done once, up front, so every spelling below reads a declaration the
 * same way — a note above the first item of a block sequence is where an author
 * most naturally puts one, and it would otherwise separate the key from its own
 * list.
 */
const significantLines = (lines) =>
  lines
    .map((line) => line.replace(COMMENT, ''))
    .filter((line) => line.trim() !== '');

/** Whether a line's first non-space character is the given one. */
const opensWith = (line, character) =>
  (line ?? '').trimStart().startsWith(character);

/**
 * The comma-separated body of a flow array. The caller establishes that the
 * value opens with a bracket before calling, so this cannot reach forward and
 * adopt a bracket belonging to a later key. It is read across lines because a
 * formatter breaks a long array over several — `.claude/rules/routes-data.md` is
 * already written that way — and a matcher bound to a single line would read
 * such a declaration as absent, which is the silent form of this gate not
 * firing.
 */
const flowArrayBody = (value) => {
  const open = value.indexOf('[');
  const close = value.indexOf(']', open + 1);
  return close === -1 ? undefined : value.slice(open + 1, close);
};

/** The same body from the block spelling, up to the next key. */
const blockSequenceBody = (lines) => {
  const end = lines.findIndex((line) => !SEQUENCE_ITEM.test(line));
  const items = (end === -1 ? lines : lines.slice(0, end)).map(
    (line) => SEQUENCE_ITEM.exec(line)?.[1] ?? '',
  );
  return items.length === 0 ? undefined : items.join(',');
};

/**
 * The entries a declaration holds, whichever way it is spelled. A scalar is its
 * own single entry; anything the value cannot be read out of is undefined,
 * which is also how "no declaration" is reported.
 */
const declaredEntries = (inline, following) => {
  if (inline !== '') {
    return opensWith(inline, '[')
      ? flowArrayBody([inline, ...following].join('\n'))
      : inline;
  }
  return opensWith(following[0], '[')
    ? flowArrayBody(following.join('\n'))
    : blockSequenceBody(following);
};

/** The declaration's line in the file, and its entries as one delimited string. */
const requiresDeclaration = (content) => {
  const lines = frontmatterLines(content);
  const index = lines.findIndex((line) => REQUIRES_KEY.test(line));
  if (index === -1) return undefined;
  const [declared = '', ...following] = significantLines(lines.slice(index));
  const entries = declaredEntries(
    declared.replace(REQUIRES_KEY, '').trim(),
    following,
  );
  return entries === undefined ? undefined : { entries, line: index + 2 };
};

/** The config keys a piece of content declares it cannot run without. */
export const requiredConfigKeys = (content) => {
  const declaration = requiresDeclaration(content);
  if (declaration === undefined) return [];
  return [
    ...new Set(
      declaration.entries
        .split(',')
        .map((entry) => entry.trim().replaceAll(QUOTES, ''))
        .filter((entry) => entry.startsWith(CONFIG_PREFIX))
        .map((entry) => entry.slice(CONFIG_PREFIX.length))
        .filter((key) => key !== ''),
    ),
  ];
};

/**
 * Where the declaration sits, so a closure finding points at the line a reader
 * has to edit. Undefined when there is no declaration — which is also when
 * there is nothing to report.
 */
export const requiresDeclarationLine = (content) =>
  requiresDeclaration(content)?.line;
