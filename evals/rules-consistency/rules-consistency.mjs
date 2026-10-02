/**
 * The pure half of the rules-consistency eval: given the rule files, the
 * AGENTS.md text and the tracked file list, decide what disagrees.
 *
 * Why: a path rule nobody indexes is one other harnesses never read, and a rule
 * whose globs match no tracked file never loads at all; both pass silently.
 * Usage: imported by `verify-rules-consistency.mjs`.
 */
import { matchesGlob } from 'node:path';

import { parse } from 'yaml';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const RULE_REFERENCE = /`(\.claude\/rules\/[^`]+\.md)`/;
const SECTION_PREFIX = '## ';

const frontmatterOf = (source) => parse(FRONTMATTER.exec(source)?.[1] ?? '');

export const ruleGlobs = (source) => {
  const paths = frontmatterOf(source)?.paths;
  return (Array.isArray(paths) ? paths : []).filter(
    (glob) => typeof glob === 'string',
  );
};

const sectionLines = (markdown, heading) => {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return [];
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith(SECTION_PREFIX));
  return end === -1 ? rest : rest.slice(0, end);
};

export const indexedRules = (agentsMarkdown, heading) =>
  sectionLines(agentsMarkdown, heading)
    .filter((line) => line.startsWith('|'))
    .map((line) => RULE_REFERENCE.exec(line.split('|')[1] ?? '')?.[1])
    .filter((label) => label !== undefined);

export const indexFindings = ({ indexed, onDisk, indexFile }) => {
  const indexedSet = new Set(indexed);
  const onDiskSet = new Set(onDisk);
  const unindexed = onDisk
    .filter((label) => !indexedSet.has(label))
    .map((label) => `${label} is not listed in the ${indexFile} rules index`);
  const dangling = indexed
    .filter((label) => !onDiskSet.has(label))
    .map((label) => `${indexFile} indexes ${label}, which does not exist`);
  return [...unindexed, ...dangling];
};

const matchesAny = (file, globs) =>
  globs.some((glob) => matchesGlob(file, glob));

export const coverage = ({ rules, files }) =>
  new Map(
    rules.map(({ label, globs }) => [
      label,
      files.filter((file) => matchesAny(file, globs)),
    ]),
  );

export const coverageFindings = ({ rules, covered }) =>
  rules
    .filter(({ label }) => (covered.get(label) ?? []).length === 0)
    .map(({ label, globs }) =>
      globs.length === 0
        ? `${label} declares no paths, so it never loads`
        : `${label} matches no tracked file, so it never loads`,
    );

export const overlaps = ({ rules, covered }) =>
  rules
    .flatMap((first, index) =>
      rules.slice(index + 1).map((second) => {
        const secondFiles = new Set(covered.get(second.label));
        const shared = (covered.get(first.label) ?? []).filter((file) =>
          secondFiles.has(file),
        );
        return { first: first.label, second: second.label, shared };
      }),
    )
    .filter(({ shared }) => shared.length > 0);
