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
 *
 * An h3 heading opens an issue and anything at h2 or above closes the section.
 * The trailing `note` group is load-bearing: an entry may carry an editorial
 * suffix after the title, and anchoring at the closing backtick instead
 * silently drops that whole issue — a failure with no symptom, the backlog
 * just comes out one issue short. `note` is captured greedily and trimmed in
 * JS rather than fenced by two whitespace runs around a lazy group, which is
 * super-linear backtracking (Sonar S8786).
 */

const HEADING_RE =
  /^###\s+(?<id>[EPG]-\d+)\s+—\s+`(?<title>[^`]+)`(?<note>.*)$/;

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

const yamlBlock = (body) => {
  const open = body.indexOf(YAML_FENCE);
  if (open === -1) {
    return '';
  }
  const start = open + YAML_FENCE.length;
  const close = body.indexOf('```', start);
  return close === -1 ? '' : body.slice(start, close);
};

const yamlValue = (yaml, key) =>
  new RegExp(String.raw`^${key}:\s*(?<value>.+)$`, 'm').exec(yaml)?.groups
    .value ?? '';

const commaList = (value) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

const bracketList = (value) => {
  const open = value.indexOf('[');
  const close = value.indexOf(']', open + 1);
  return open === -1 || close === -1
    ? []
    : commaList(value.slice(open + 1, close));
};

const parseLabels = (body) => {
  const fromYaml = bracketList(yamlValue(yamlBlock(body), 'labels'));
  if (fromYaml.length > 0) {
    return fromYaml;
  }
  const metadata =
    /^[ \t]*(?:[-*][ \t]*)?\*\*Metadata[.:]\*\*(?<rest>.*)$/m.exec(body);
  return bracketList(metadata?.groups.rest ?? '');
};

const parseMilestone = (body, milestoneNames) => {
  const fromYaml = yamlValue(yamlBlock(body), 'milestone').trim();
  if (fromYaml !== '') {
    return fromYaml;
  }
  const mention = /\bM(?<number>\d)\b/.exec(body)?.groups.number;
  return milestoneNames.find((name) => name.startsWith(`M${mention} `)) ?? '';
};

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

const parseParentFromProse = (body) =>
  /`parent:\s*(?<parent>[EPG]-\d+)`/.exec(body)?.groups.parent;

const parseChildrenFromProse = (body) =>
  commaList(
    /^[ \t]*(?:[-*][ \t]*)?\*\*Children[.:]\*\*(?<rest>.*)$/m.exec(body)?.groups
      .rest ?? '',
  ).filter((item) => /^[EPG]-\d+$/.test(item));

const LIST_LEAD_IN = String.raw`[ \t]*(?:[-*][ \t]*)?`;

const NEXT_SECTION = String.raw`\n(?:[ \t]*\n)*${LIST_LEAD_IN}\*\*`;

export const sectionText = (body, labels) => {
  const alternatives = labels.join('|');
  const pattern = new RegExp(
    String.raw`^${LIST_LEAD_IN}\*\*(?:\d+\.[ \t]*)?(?:${alternatives})[.:]?\*\*[.:]?(?<text>[\s\S]*?)(?=${NEXT_SECTION}|\n### |\n## |\n\`\`\`|(?![\s\S]))`,
    'm',
  );
  return dedent((pattern.exec(body)?.groups.text ?? '').trim());
};

const dedent = (text) => {
  const [first, ...rest] = text.split('\n');
  const indents = rest
    .filter((line) => line.trim() !== '')
    .map((line) => /^[ \t]*/.exec(line)[0].length);
  const shared = indents.length === 0 ? 0 : Math.min(...indents);
  return [first, ...rest.map((line) => line.slice(shared))].join('\n');
};

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

export const parsePlan = (markdown, { milestoneNames = [] } = {}) =>
  splitIssueBlocks(markdown).map((block) => toRecord(block, milestoneNames));

export const parseMilestoneNames = (markdown) =>
  [...markdown.matchAll(/^###\s+(?<title>M\d\s.*)$/gm)].map(({ groups }) =>
    groups.title
      .replaceAll(/[‐-―]/g, '-')
      .replaceAll(/\s+/g, ' ')
      .trim(),
  );
