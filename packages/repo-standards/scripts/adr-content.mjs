/**
 * What an ADR says about itself: the block that classifies it, and the sections
 * a decision record cannot be missing.
 *
 * Why this exists: the gate read filenames, numbers and placement and never
 * opened the record. An ADR with no context, no decision and no consequences
 * passed exactly like a complete one, and nothing said which packages a decision
 * constrains — so an agent about to touch one had to read every filename and
 * guess. Both halves live here because they are the same act: reading the
 * document rather than its name.
 *
 * The block is ADDITIVE CLASSIFICATION, not an amendment. An ADR is a dated
 * record and its body is never rewritten; `governs` states what the decision
 * applies to, which is a fact about the tree the reader is standing in rather
 * than a change to what was decided. Records written before the block existed
 * are grandfathered in a baseline instead of being edited.
 *
 * The frontmatter is read here rather than through the parser the product and
 * planning registers share, and the dispatch loop below is knowingly a near-copy
 * of it. Two reasons, in order.
 *
 * The first is not preference: that parser lives in the host repository's own
 * script directory, and this gate SHIPS. A published bin importing it resolves
 * to nothing wherever the package is installed, so the edge would only exist
 * in-repo — the case ADR-039 settles as duplicate rather than declare.
 *
 * The second is that the two are not the same parser. This one reports a line it
 * cannot read and a key declared twice; the shared one drops both silently, the
 * duplicate key being last-wins. Silently losing a key is precisely the failure
 * a gate whose whole purpose is to read the record must not have. Neither does
 * this one need the shared parser's list-of-maps, which exists for the
 * requirement register's `evidence` and for nothing here.
 *
 * Pure: callers hand in markdown and get findings back. The reading, the
 * writing and the exit code are `verify-adrs.mjs`.
 */

/** What `governs` says when a decision constrains no single workspace. */
export const REPOSITORY_SCOPE = 'repository';

const GOVERNS = 'governs';

/**
 * Every key the block may carry.
 *
 * An unknown key is a finding rather than something ignored: `package:` written
 * for `governs:` would otherwise parse cleanly and leave the required key
 * absent, and the reader would be told the block is missing a key they can see
 * on the screen.
 */
const KNOWN_KEYS = new Set([GOVERNS]);

/** The three sections a decision record is not a decision record without. */
export const REQUIRED_SECTIONS = ['Context', 'Decision', 'Consequences'];

/**
 * The template's own rule, not a new one: a decision that chose between
 * comparable designs writes `Options considered`, one that answered objections
 * writes `Alternatives considered`, and a small decision needs only one of the
 * two. So at least one of them, filled.
 */
export const ALTERNATIVE_SECTIONS = [
  'Options considered',
  'Alternatives considered',
];

const OPENING = '---\n';

/** Where the closing fence's newline is, or -1 when the record opens no block. */
const fenceEnd = (markdown) =>
  markdown.startsWith(OPENING) ? markdown.indexOf('\n---', 3) : -1;

/**
 * The record itself, with any block taken off the front.
 *
 * Every body rule reads this rather than the raw file, including the heading
 * number the gate already checked: a `# comment` line inside the block would
 * otherwise be picked up as the H1 and the number check would silently stop
 * firing.
 */
export const adrBody = (markdown) => {
  const end = fenceEnd(markdown);
  if (end === -1) {
    return markdown;
  }
  const newline = markdown.indexOf('\n', end + 1);
  return newline === -1 ? '' : markdown.slice(newline + 1);
};

/** Lower-case, dash-separated: narrow enough that `__proto__` is not a key. */
const KEY = /^[a-z][a-z-]*$/;

/**
 * `key: value` → its parts, or undefined when the text is not a pair. Split on
 * the FIRST colon with `indexOf`, so a value keeps its own colons and no regex
 * backtracks over a long line.
 */
const readPair = (text) => {
  const colon = text.indexOf(':');
  if (colon <= 0) {
    return undefined;
  }
  const key = text.slice(0, colon);
  return KEY.test(key)
    ? { key, value: text.slice(colon + 1).trim() }
    : undefined;
};

/** `[a, b]` → `['a', 'b']`; spacing and a trailing comma are tolerated. */
const flowList = (value) =>
  value
    .slice(1, -1)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');

const indentOf = (line) => line.length - line.trimStart().length;

const readTopLevel = (state, text, line) => {
  const pair = readPair(text);
  if (pair === undefined) {
    state.errors.push(`line ${line}: cannot read \`${text}\``);
    return;
  }
  if (Object.hasOwn(state.fields, pair.key)) {
    state.errors.push(`line ${line}: \`${pair.key}\` is declared twice`);
    return;
  }
  state.open = undefined;
  if (pair.value === '') {
    state.fields[pair.key] = [];
    state.open = pair.key;
  } else if (!pair.value.startsWith('[')) {
    state.fields[pair.key] = pair.value;
  } else if (pair.value.endsWith(']')) {
    state.fields[pair.key] = flowList(pair.value);
  } else {
    state.errors.push(`line ${line}: unterminated list`);
    state.fields[pair.key] = [];
  }
};

const readItem = (state, text, line) => {
  if (state.open === undefined) {
    state.errors.push(`line ${line}: \`${text}\` belongs to no field`);
    return;
  }
  state.fields[state.open].push(text.slice(2).trim());
};

/**
 * The block as `{ errors, fields }`, or undefined when the record opens with no
 * `---` block at all — which the caller reports as its own finding, since a
 * missing block and an unreadable one are different mistakes.
 */
export const parseAdrBlock = (markdown) => {
  if (fenceEnd(markdown) === -1) {
    return undefined;
  }
  const state = { errors: [], fields: {}, open: undefined };
  for (const [index, raw] of markdown
    .slice(4, fenceEnd(markdown))
    .split('\n')
    .entries()) {
    const text = raw.trim();
    if (text === '' || text.startsWith('#')) {
      continue;
    }
    if (indentOf(raw) === 0) {
      readTopLevel(state, text, index + 2);
    } else if (text.startsWith('- ')) {
      readItem(state, text, index + 2);
    } else {
      state.errors.push(`line ${index + 2}: cannot read \`${text}\``);
    }
  }
  return { errors: state.errors, fields: state.fields };
};

/** The workspaces a record declares, or none when it declares no readable block. */
export const governedBy = (markdown) => {
  const value = parseAdrBlock(markdown)?.fields[GOVERNS];
  return Array.isArray(value) ? value : [];
};

const unknownName = (name, workspaces) =>
  workspaces.size === 0
    ? `\`${GOVERNS}\` names \`${name}\`, but no workspace roster could be derived from pnpm-workspace.yaml — a decision that governs no one workspace declares \`${REPOSITORY_SCOPE}\``
    : `\`${GOVERNS}\` names \`${name}\`, which is no workspace in this repository (${[...workspaces].toSorted((left, right) => left.localeCompare(right)).join(', ')})`;

/**
 * What `governs` has to be. The empty list is rejected rather than read as
 * repository-wide: a record that governs everything says so, so that "nobody
 * filled this in" cannot be spelled the same way as an answer.
 */
const governsFindings = (value, workspaces) => {
  if (value === undefined) {
    return [
      `no \`${GOVERNS}\` — declare the workspace directories the decision applies to, or \`${REPOSITORY_SCOPE}\``,
    ];
  }
  if (!Array.isArray(value)) {
    return [`\`${GOVERNS}\` must be a list, not \`${value}\``];
  }
  if (value.length === 0) {
    return [
      `\`${GOVERNS}\` is empty — a decision that governs no one workspace declares \`${REPOSITORY_SCOPE}\``,
    ];
  }
  if (value.includes(REPOSITORY_SCOPE) && value.length > 1) {
    return [
      `\`${GOVERNS}\` mixes \`${REPOSITORY_SCOPE}\` with workspace names — it is one or the other`,
    ];
  }
  return value
    .filter((name) => name !== REPOSITORY_SCOPE && !workspaces.has(name))
    .map((name) => unknownName(name, workspaces));
};

/** The classification block's findings for one record. */
export const blockFindings = ({ markdown, workspaces }) => {
  const block = parseAdrBlock(markdown);
  if (block === undefined) {
    return [
      `no metadata block — an ADR opens with a \`---\` block declaring \`${GOVERNS}\``,
    ];
  }
  return [
    ...block.errors,
    ...Object.keys(block.fields)
      .filter((key) => !KNOWN_KEYS.has(key))
      .map((key) => `\`${key}\` is not a key of the block`),
    ...governsFindings(block.fields[GOVERNS], workspaces),
  ];
};

/**
 * A `##` heading and its title.
 *
 * The title group is required to START with a non-space, which is what keeps
 * this linear: the run of spaces after `##` and the title itself must not both
 * be able to match the same character, or the engine has a choice at every space
 * and backtracks super-linearly over a long run of them (Sonar S8786; the first
 * spelling here measured quadratic). Trailing spaces are left to `trim`, where
 * there is no second quantifier to be ambiguous with.
 *
 * The group is optional so that `##` followed by nothing but spaces still parses
 * — it yields no title, and the caller treats that as not a heading.
 *
 * `###` does not match, because the character after `##` must be a space or a
 * tab — so a subsection stays part of the section it sits in.
 */
const SECTION = /^##[ \t]+([^ \t].*)?$/;
const TITLE = /^#[ \t]+/;
/**
 * An HTML comment, INCLUDING an unterminated one, which runs to the end of the
 * input — which is what a markdown renderer does with it too, so a heading swept
 * up by one is a heading no reader sees either.
 *
 * Matching only the terminated form left `<!--` in the stripped text, so a
 * section whose sole content was an unterminated comment read as filled: the
 * `not empty` check was lenient in exactly the direction it exists to catch.
 * CodeQL flags the same shape as incomplete sanitization; the injection it has
 * in mind needs an HTML sink and there is none here, but the incompleteness was
 * real on its own terms.
 */
const COMMENT = /<!--[\s\S]*?(?:-->|$)/g;

/**
 * Each `##` section's lines, keyed by its lower-cased title. Comments are
 * stripped first, so the prompts the template ships do not read as content —
 * a scaffolded record with every prompt still in place has said nothing.
 */
export const sectionsOf = (body) => {
  const sections = new Map();
  let open;
  for (const line of body.replaceAll(COMMENT, '').split('\n')) {
    const heading = SECTION.exec(line);
    const title =
      heading === null ? '' : (heading[1] ?? '').trim().toLowerCase();
    if (title !== '') {
      open = title;
      sections.set(open, []);
    } else if (TITLE.test(line)) {
      open = undefined;
    } else if (open !== undefined) {
      sections.get(open).push(line);
    }
  }
  return sections;
};

const sectionProblem = (sections, title) => {
  const lines = sections.get(title.toLowerCase());
  if (lines === undefined) {
    return `no \`## ${title}\` section`;
  }
  return lines.some((line) => line.trim() !== '')
    ? undefined
    : `\`## ${title}\` is empty`;
};

/** The required sections, plus the one-of-two rule the template states. */
export const sectionFindings = (body) => {
  const sections = sectionsOf(body);
  const required = REQUIRED_SECTIONS.map((title) =>
    sectionProblem(sections, title),
  ).filter((finding) => finding !== undefined);

  const alternatives = ALTERNATIVE_SECTIONS.some(
    (title) => sectionProblem(sections, title) === undefined,
  );
  return alternatives
    ? required
    : [
        ...required,
        `neither \`## ${ALTERNATIVE_SECTIONS[0]}\` nor \`## ${ALTERNATIVE_SECTIONS[1]}\` is filled in — a record carries at least one`,
      ];
};

/** Everything one record gets wrong, block and body together. */
export const recordFindings = ({ markdown, workspaces }) => [
  ...blockFindings({ markdown, workspaces }),
  ...sectionFindings(adrBody(markdown)),
];
