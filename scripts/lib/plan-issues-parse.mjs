/**
 * Pure half of `plan-issues.mjs`: turn a planning document into issue records.
 *
 * Why this exists: a planning session writes its backlog as prose, and the
 * three shapes it uses (numbered epics, full 8-section issues, compact
 * governance entries) all have to become bodies that pass the issue gate. That
 * mapping is the part worth testing, so it lives here with no `gh` and no fs.
 *
 * The document contract, which a plan file must follow:
 * an issue is an h3 whose text is `<ID> — \`<conventional title>\``, and its
 * planning metadata is either a fenced yaml block or a `Metadata` line.
 */

/**
 * An h3 heading opens an issue; anything at h2 or above closes the section.
 *
 * The trailing `note` group is load-bearing: an entry may carry an editorial
 * suffix after the title (`_(optional)_`). Anchoring the pattern at the closing
 * backtick instead silently drops that whole issue from the run, which is a
 * failure mode with no symptom — the backlog just comes out one issue short.
 *
 * `note` is captured greedily and trimmed in JS rather than fenced by
 * `\s*(?<note>.*?)\s*$`: two whitespace runs around a lazy group give the
 * engine many equivalent ways to split the same trailing spaces, which is
 * super-linear backtracking (Sonar S8786).
 */
const HEADING_RE =
  /^###\s+(?<id>[EPG]-\d+)\s+—\s+`(?<title>[^`]+)`(?<note>.*)$/;

/** Splits the document into `{ id, title, lines }` blocks, in document order. */
export const splitIssueBlocks = (markdown) => {
  const blocks = [];
  for (const line of markdown.split('\n')) {
    const heading = HEADING_RE.exec(line);
    if (heading !== null) {
      const { id, title, note } = heading.groups;
      blocks.push({ id, title, note: note.trim(), lines: [] });
    } else if (blocks.length > 0 && !/^#{1,2}\s/.test(line)) {
      blocks.at(-1).lines.push(line);
    }
  }
  return blocks.map((block) => ({ ...block, body: block.lines.join('\n') }));
};

const YAML_FENCE = '```yaml\n';

/**
 * Content of the first fenced yaml block, or '' when there is none.
 *
 * Index arithmetic for the same reason as `bracketList`: a lazy `[\s\S]*?`
 * hunting a closing fence rescans from every candidate opening when there
 * isn't one.
 */
const yamlBlock = (body) => {
  const open = body.indexOf(YAML_FENCE);
  if (open === -1) {
    return '';
  }
  const start = open + YAML_FENCE.length;
  const close = body.indexOf('```', start);
  return close === -1 ? '' : body.slice(start, close);
};

/** `key: value` from a yaml block, untyped and untrimmed of list syntax. */
const yamlValue = (yaml, key) =>
  new RegExp(String.raw`^${key}:\s*(?<value>.+)$`, 'm').exec(yaml)?.groups
    .value ?? '';

/** Splits `a, b, c` into trimmed non-empty parts. */
const commaList = (value) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

/**
 * `[a, b]` → `['a','b']`; anything else → [].
 *
 * Index arithmetic rather than `/\[([^\]]*)\]/`: on a value with many `[` and
 * no closing bracket, that regex rescans to the end from every one of them —
 * quadratic (Sonar S8786). Finding the two delimiters is a single pass.
 */
const bracketList = (value) => {
  const open = value.indexOf('[');
  const close = value.indexOf(']', open + 1);
  return open === -1 || close === -1
    ? []
    : commaList(value.slice(open + 1, close));
};

/**
 * Labels come from the yaml `labels:` list, or from a `Metadata` line's
 * backticked `labels: [...]`. Both spellings appear in the source document.
 */
const parseLabels = (body) => {
  const fromYaml = bracketList(yamlValue(yamlBlock(body), 'labels'));
  if (fromYaml.length > 0) {
    return fromYaml;
  }
  const metadata =
    /^[ \t]*(?:[-*][ \t]*)?\*\*Metadata[.:]\*\*(?<rest>.*)$/m.exec(body);
  return bracketList(metadata?.groups.rest ?? '');
};

/** Milestone name, from yaml or from an `M<n>` mention on the Metadata line. */
const parseMilestone = (body, milestoneNames) => {
  const fromYaml = yamlValue(yamlBlock(body), 'milestone').trim();
  if (fromYaml !== '') {
    return fromYaml;
  }
  const mention = /\bM(?<number>\d)\b/.exec(body)?.groups.number;
  return milestoneNames.find((name) => name.startsWith(`M${mention} `)) ?? '';
};

/** `dependencies: { blocking: [...], parent: E-1, ... }` → a plain object. */
const parseDependencies = (body) => {
  const raw = yamlValue(yamlBlock(body), 'dependencies');
  const field = (key) =>
    new RegExp(String.raw`${key}:\s*(?<value>\[[^\]]*\]|[A-Za-z0-9-]+)`).exec(
      raw,
    )?.groups.value ?? '';
  const scalar = (key) => {
    const value = field(key);
    return value === '' || value === 'null' ? undefined : value;
  };
  return {
    blocking: bracketList(field('blocking')),
    blockedBy: bracketList(field('blockedBy')),
    parent: scalar('parent') ?? parseParentFromProse(body),
    children: bracketList(field('children')).concat(
      parseChildrenFromProse(body),
    ),
  };
};

/** Epics and governance entries name their parent inline: `` `parent: E-4` ``. */
const parseParentFromProse = (body) =>
  /`parent:\s*(?<parent>[EPG]-\d+)`/.exec(body)?.groups.parent;

/** Epics list `- **Children:** P-01, P-02` rather than a yaml `children`. */
const parseChildrenFromProse = (body) =>
  commaList(
    /^[ \t]*(?:[-*][ \t]*)?\*\*Children[.:]\*\*(?<rest>.*)$/m.exec(body)?.groups
      .rest ?? '',
  ).filter((item) => /^[EPG]-\d+$/.test(item));

/**
 * Optional list bullet before a bold lead-in.
 *
 * Two rules keep this linear, and both are Sonar S8786 in practice:
 *
 * - The bullet lives INSIDE the optional group (`(?:[-*][ \t]*)?`, never
 *   `[-*]?[ \t]*`). Two whitespace runs separated by an merely optional
 *   character can split the same spaces countless equivalent ways.
 * - The whitespace is `[ \t]`, never `\s`. `\s` matches a newline, so under the
 *   `m` flag every earlier line start could reach the same lead-in by having
 *   `\s*` swallow the lines between — many paths to one position, which is the
 *   definition of the backtracking being avoided. Indentation before a bullet
 *   is spaces and tabs anyway.
 */
const LIST_LEAD_IN = String.raw`[ \t]*(?:[-*][ \t]*)?`;

/** The next section: a line break, any blank lines, then a bold lead-in. */
const NEXT_SECTION = String.raw`\n(?:[ \t]*\n)*${LIST_LEAD_IN}\*\*`;

/**
 * Pulls one narrative section out of a block. The document writes them three
 * ways — `**1. Problem Statement.**`, `**Problem.**` and `- **Problem:**` — so
 * the label is matched loosely and the value runs to the next bold lead-in.
 */
export const sectionText = (body, labels) => {
  const alternatives = labels.join('|');
  // Two details, each of which cost a wrong result:
  //   - the terminator spells end-of-input as `(?![\s\S])`, not `$`. The `m`
  //     flag the lead-in needs also makes `$` match at every line break, so a
  //     lazy body would stop at the end of its FIRST line.
  //   - no `\s*` sits before `(?<text>…)`. A whitespace run in front of a lazy
  //     group is ambiguous — both can match the same spaces — and the text is
  //     trimmed afterwards regardless.
  const pattern = new RegExp(
    String.raw`^${LIST_LEAD_IN}\*\*(?:\d+\.[ \t]*)?(?:${alternatives})[.:]?\*\*[.:]?(?<text>[\s\S]*?)(?=${NEXT_SECTION}|\n### |\n## |\n\`\`\`|(?![\s\S]))`,
    'm',
  );
  return dedent((pattern.exec(body)?.groups.text ?? '').trim());
};

/**
 * Strips the common leading indent. A section written as a list item
 * (`- **Problem:** …`) carries its continuation lines indented to the bullet,
 * which reads as an indented code block once the lead-in is gone. Only the
 * shared indent goes, so relative nesting inside the section survives.
 */
const dedent = (text) => {
  const [first, ...rest] = text.split('\n');
  // The first line is already flush — it followed the bold lead-in — so the
  // shared indent is whatever the continuation lines agree on.
  const indents = rest
    .filter((line) => line.trim() !== '')
    .map((line) => /^[ \t]*/.exec(line)[0].length);
  const shared = indents.length === 0 ? 0 : Math.min(...indents);
  return [first, ...rest.map((line) => line.slice(shared))].join('\n');
};

/** Parses one block into the record the renderer consumes. */
const toRecord = ({ id, title, note, body }, milestoneNames) => ({
  id,
  title,
  note: note.replaceAll(/[_*]/g, '').trim(),
  kind: id.startsWith('E-') ? 'epic' : 'issue',
  labels: parseLabels(body),
  milestone: parseMilestone(body, milestoneNames),
  dependencies: parseDependencies(body),
  sections: {
    problem: sectionText(body, ['Problem Statement', 'Problem']),
    objective: sectionText(body, ['Objective']),
    context: sectionText(body, ['Context & Background', 'Context']),
    reproduction: sectionText(body, ['Reproduction Steps', 'Reproduction']),
    scope: sectionText(body, ['Scope Definition', 'Scope']),
    acceptance: sectionText(body, ['Acceptance Criteria', 'Acceptance']),
    notes: sectionText(body, ['Implementation Notes']),
    related: sectionText(body, ['Related Work']),
  },
});

/** Every issue record in the document, in document order. */
export const parsePlan = (markdown, { milestoneNames = [] } = {}) =>
  splitIssueBlocks(markdown).map((block) => toRecord(block, milestoneNames));

/**
 * Milestone titles from the naming scheme.
 *
 * The scheme's headings are typed with an en dash and a non-breaking hyphen
 * (`M1 – Foundation`, `Cross‑App`) while its own yaml example and the backlog
 * use a plain ASCII hyphen. GitHub milestone titles are matched literally, so
 * the two spellings would create two milestones; normalising here makes the
 * scheme document the single source and the ASCII form canonical.
 */
export const parseMilestoneNames = (markdown) =>
  // Greedy `.*` with the trim in JS, not `.+?\s*$` — a lazy group followed by
  // optional trailing whitespace backtracks super-linearly (Sonar S8786).
  [...markdown.matchAll(/^###\s+(?<title>M\d\s.*)$/gm)].map(({ groups }) =>
    groups.title
      .replaceAll(/[‐-―]/g, '-')
      .replaceAll(/\s+/g, ' ')
      .trim(),
  );
