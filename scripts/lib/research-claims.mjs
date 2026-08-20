/**
 * Which quantity claims in a research write-up are not re-derivable.
 *
 * Why this exists: the first documents filed under `docs/agents/research/`
 * shipped a run of wrong counts — sibling plugins, seed templates, playbooks,
 * test files, skills per bucket, published pages, promoted skills. Every one
 * was refutable in seconds against a clone that was sitting on disk the whole
 * time, and none was caught by reading. Prose alone did not hold either: the
 * convention was broken in the commit after the one that wrote it.
 *
 * The rule this encodes is AGENTS.md §7 narrowed to the one claim shape that
 * actually rotted. A count is accountable when a reader can re-derive it
 * without trusting the author — either the paragraph names the command that
 * produces it, or it enumerates the things it counts. Anything else is a bare
 * assertion about someone else's tree.
 *
 * Deliberately narrow. Small number-words used narratively ("two packages",
 * "three commits") are not counts of artifacts and are excluded by the floor,
 * because a gate that reports them would be argued with rather than obeyed.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** Number-words worth gating; below the floor they read as prose, not counts. */
const NUMBER_WORDS = Object.freeze({
  eight: 8,
  eighteen: 18,
  eleven: 11,
  fifteen: 15,
  five: 5,
  four: 4,
  fourteen: 14,
  nine: 9,
  nineteen: 19,
  seven: 7,
  seventeen: 17,
  six: 6,
  sixteen: 16,
  ten: 10,
  thirteen: 13,
  thirty: 30,
  twelve: 12,
  twenty: 20,
});

/** Nouns that name a countable artifact in someone else's repository. */
const ARTIFACT_NOUNS = [
  'buckets',
  'directories',
  'entries',
  'files',
  'pages',
  'playbooks',
  'plugins',
  'principles',
  'scripts',
  'skills',
  'templates',
  'tests',
];

/** Commands whose presence makes a number re-derivable by the reader. */
const PROBE_COMMANDS = [
  'cat',
  'find',
  'git',
  'grep',
  'jq',
  'ls',
  'node',
  'rg',
  'wc',
];

const numberPattern = `(?:\\d+|${Object.keys(NUMBER_WORDS).join('|')})`;
const nounPattern = `(?:${ARTIFACT_NOUNS.join('|')})`;

/**
 * A count, and the noun it counts. The lookbehind drops `ADR-081`, `#833` and
 * `v1.2.2`, where the digits identify a thing rather than counting one.
 */
const CLAIM = new RegExp(
  `(?<![-#\\w])(${numberPattern})\\b(?:\\s+[\\w./*-]+){0,3}\\s+\\*{0,2}(${nounPattern})\\b`,
  'gi',
);

const PROBE = new RegExp(
  `\`[^\`]*\\b(?:${PROBE_COMMANDS.join('|')})\\b[^\`]*\``,
);

const BACKTICKED = /`[^`]+`/g;

/** The smallest count worth gating. Below it, a number-word is prose. */
const FLOOR = 4;

/** (pure) */
const countValue = (token) =>
  /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token.toLowerCase()];

/**
 * Paragraphs, kept with the line they start on so a finding can be located.
 *
 * A `for...of` building a local array rather than a fold: spreading an
 * accumulator is quadratic in the length of the document, which Biome rejects
 * and AGENTS.md §5 rule 6 steers away from anyway.
 */
export const paragraphsOf = (text) => {
  const blocks = [];
  let open = false;
  for (const [index, line] of text.split('\n').entries()) {
    if (line.trim() === '') {
      open = false;
    } else if (open) {
      blocks.at(-1).lines.push(line);
    } else {
      blocks.push({ line: index + 1, lines: [line] });
      open = true;
    }
  }
  return blocks.map(({ line, lines }) => ({ line, text: lines.join('\n') }));
};

/**
 * A count is answered when the paragraph names a command that produces it, or
 * lists at least as many backticked items as it claims. (pure)
 */
export const isAnswered = (paragraph, count) =>
  PROBE.test(paragraph) || (paragraph.match(BACKTICKED) ?? []).length >= count;

/** Every count in one document that a reader cannot re-derive. (pure) */
export const unprobedClaims = (docPath, text) =>
  paragraphsOf(text).flatMap(({ line, text: paragraph }) =>
    [...paragraph.matchAll(CLAIM)]
      .map((match) => ({
        count: countValue(match[1]),
        phrase: match[0].replace(/\s+/gu, ' '),
      }))
      .filter(({ count }) => count >= FLOOR)
      .filter(({ count }) => !isAnswered(paragraph, count))
      .map(({ count, phrase }) => ({ count, docPath, line, phrase })),
  );

/** (pure) */
export const describeClaim = ({ docPath, line, phrase }) =>
  `  - ${docPath}:${line} — "${phrase}" states a count with nothing to re-derive it from.`;
