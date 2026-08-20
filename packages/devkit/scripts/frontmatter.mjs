/*
 * Reading the declarations a shipped file makes about what it needs: the config
 * keys it cannot run without (`requires:`), and the peer package versions it
 * cannot run against (`peer:`).
 *
 * Why: `sync` only refuses to write a file whose `{{commands.*}}` placeholders
 * cannot be substituted, and a skill can depend on a consumer's config without
 * ever emitting a placeholder for it — prose that says "your repository's agent
 * document" reads the key without interpolating it. That dependency is invisible
 * to the placeholder gate, so the file lands in a consumer who cannot satisfy it
 * and fails at the moment an agent follows it. `requires:` makes the dependency
 * something a machine can check, here and in `closure`. `peer:` makes the other
 * half checkable — the gate runtime a skill's prose shells out to, which a
 * consumer can upgrade or never install (ADR-081).
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
 * Those spellings are the whole of what it reads. Anything else — a block
 * scalar, an anchor, a key quoted or held off its colon — reads as no
 * declaration rather than as an empty one, and that complement is open: YAML
 * admits more spellings than can be listed here, so what keeps the gate sound
 * is not naming them but that none is reachable by the edit it guards against,
 * someone restyling a declaration into another ordinary spelling. Widen it only
 * for a shape a person would write in frontmatter, and pin the widening in
 * `frontmatter.test.mjs`.
 *
 * Only `config.`-prefixed entries are claims on the consumer's configuration.
 * `requires:` already means other things in frontmatter written for humans — a
 * shipped reference file names a library version range with it — and reading
 * those as config keys would refuse to write a file that needs nothing. `peer:`
 * carries no competing meaning in the frontmatter this repository ships, so
 * every entry under it is read; give it one and it needs the same filter.
 *
 * A peer is spelled `name@range`, one entry per package, rather than as a
 * `{name: range}` flow map. The entry form costs no second parser: it travels
 * through every spelling above unchanged, so the gate cannot be disabled by
 * restyling a one-package declaration into a list. A map would need its own
 * body reader and its own key/value split for the sake of one key, and would
 * still have to be quoted — `@` and `>` are both YAML indicators, so neither
 * spelling escapes quoting.
 */

const FENCE = '---';

const CONFIG_PREFIX = 'config.';

/**
 * The keys read here, one literal regex each rather than one built from a
 * string: a computed pattern is both a lint finding and a way for a key to stop
 * matching without the change looking like one.
 */
const REQUIRES_KEY = /^requires:[ \t]*/;

const PEER_KEY = /^peer:[ \t]*/;

/** What a peer entry declaring no range means: installed, at any version. */
const ANY_VERSION = '*';

/**
 * One item of a block sequence, at any indent YAML would accept for one. The
 * capture opens at the first space after the dash rather than after the whole
 * run of them, so that no two quantifiers can split that run between them — the
 * shape that costs an expression its linear runtime. `ITEM_SPACING` takes the
 * rest of the run off in JS, where it is one pass.
 */
const SEQUENCE_ITEM = /^[ \t]*-([ \t].*)$/;

/**
 * The spaces or tabs a `SEQUENCE_ITEM` capture still opens with. Not
 * `trimStart()`, which also takes non-breaking and vertical space — characters
 * an item may open with and this reader has always kept.
 */
const ITEM_SPACING = /^[ \t]+/;

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
    (line) => SEQUENCE_ITEM.exec(line)?.[1].replace(ITEM_SPACING, '') ?? '',
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

/**
 * One key's declaration: its line in the file, and its entries as one delimited
 * string. Taking the key as a parameter is what keeps `peer:` from growing a
 * second reader — a spelling either key can be written in is read for both, so
 * the two gates cannot drift apart in what they can see.
 */
const declarationFor = ({ content, key }) => {
  const lines = frontmatterLines(content);
  const index = lines.findIndex((line) => key.test(line));
  if (index === -1) return undefined;
  const [declared = '', ...following] = significantLines(lines.slice(index));
  const entries = declaredEntries(declared.replace(key, '').trim(), following);
  return entries === undefined ? undefined : { entries, line: index + 2 };
};

/** The individual entries of a declaration, unquoted and stripped of padding. */
const entriesOf = (declaration) =>
  declaration === undefined
    ? []
    : declaration.entries
        .split(',')
        .map((entry) => entry.trim().replaceAll(QUOTES, ''))
        .filter((entry) => entry !== '');

/** The config keys a piece of content declares it cannot run without. */
export const requiredConfigKeys = (content) => [
  ...new Set(
    entriesOf(declarationFor({ content, key: REQUIRES_KEY }))
      .filter((entry) => entry.startsWith(CONFIG_PREFIX))
      .map((entry) => entry.slice(CONFIG_PREFIX.length))
      .filter((key) => key !== ''),
  ),
];

/**
 * One `name@range` entry. Split at the LAST `@`, because a scoped package name
 * opens with one and a semver range never contains one — `@repo/x@>=1 <2` has
 * to read as that package and that range, not as a package called `repo/x@>=1`.
 * An entry with no separator declares a package and no constraint, which still
 * has to be installed for the file to be written.
 */
const peerFromEntry = (entry) => {
  const separator = entry.lastIndexOf('@');
  if (separator <= 0) return { name: entry, range: ANY_VERSION };
  const range = entry.slice(separator + 1).trim();
  return {
    name: entry.slice(0, separator).trim(),
    range: range === '' ? ANY_VERSION : range,
  };
};

/**
 * The peer packages, with their ranges, a piece of content declares it cannot
 * run against. A name declared twice keeps its first range, matching how
 * `requiredConfigKeys` keeps the first of a repeated key.
 */
export const requiredPeers = (content) => {
  const byName = new Map();
  for (const entry of entriesOf(declarationFor({ content, key: PEER_KEY }))) {
    const peer = peerFromEntry(entry);
    if (peer.name !== '' && !byName.has(peer.name)) byName.set(peer.name, peer);
  }
  return [...byName.values()];
};

/**
 * Where the declaration sits, so a closure finding points at the line a reader
 * has to edit. Undefined when there is no declaration — which is also when
 * there is nothing to report.
 */
export const requiresDeclarationLine = (content) =>
  declarationFor({ content, key: REQUIRES_KEY })?.line;
