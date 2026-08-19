/**
 * Generates CHANGELOG.md from Conventional-Commit history, grouped by version
 * (git tags) then by type (Features / Bug Fixes / …), each entry scope-labelled
 * and linked to its commit, with breaking changes called out. Reuses the one
 * commit spec (`packages/repo-standards/scripts/commit-convention.mjs`) so the changelog groups by the same
 * types the commit-msg gate enforces.
 *
 * It reads `git log` on stdin rather than shelling out, so this file stays free of
 * a `git` subprocess (the caller owns the `git log` invocation — see the
 * `changelog:generate` script). Expected format, one record per commit:
 *   %H \x1f %D \x1f %cI \x1f %s \x1f %b \x1e
 *
 * Usage:
 *   git log --no-merges --format=… | node scripts/generate-changelog.mjs
 *   … | node scripts/generate-changelog.mjs --stdout      (print, don't write)
 *   … | node scripts/generate-changelog.mjs --release vX  (print only vX's notes)
 *
 * Exit codes: 0 = written/printed, 1 = an unexpected error.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import { parseCommitHeader } from '../packages/repo-standards/scripts/commit-convention.mjs';
import { readRepoSlug } from './lib/git-remote.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
// Field / record separators matching the git `--format` bytes (%x1f / %x1e).
const UNIT = String.fromCodePoint(0x1f);
const RECORD = String.fromCodePoint(0x1e);

/** commit type → section heading, in the order sections should appear. */
const TYPE_SECTIONS = [
  ['feat', '✨ Features'],
  ['fix', '🐛 Bug Fixes'],
  ['perf', '⚡ Performance'],
  ['refactor', '♻️ Refactoring'],
  ['docs', '📝 Documentation'],
  ['build', '📦 Build System'],
  ['ci', '👷 CI'],
  ['test', '✅ Tests'],
  ['style', '🎨 Styles'],
  ['chore', '🔧 Chores'],
  ['revert', '⏪ Reverts'],
];
const SECTION_TITLE = new Map(TYPE_SECTIONS);
const TYPE_RANK = new Map(TYPE_SECTIONS.map(([type], index) => [type, index]));
const TAG_REF = /tag:\s*(v[^\s,]+)/;
const BREAKING_FOOTER = /BREAKING[ -]CHANGE/;

const HEADER = `# Changelog

All notable changes to this project, grouped by [Conventional Commit](https://www.conventionalcommits.org)
type. This file is generated — run \`vp run changelog:generate\`. Do not edit by hand.
`;

const parseRecords = (raw) =>
  raw
    .split(RECORD)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, decoration, date, subject, body = ''] = record.split(UNIT);
      return { hash, decoration, date, subject, body };
    });

/** Walks newest→oldest, opening a new section at each tagged commit. */
const groupByVersion = (records) => {
  const versions = [{ version: 'Unreleased', commits: [] }];
  for (const record of records) {
    const tag = TAG_REF.exec(record.decoration ?? '');
    if (tag !== null) {
      versions.push({ version: tag[1], commits: [] });
    }
    versions.at(-1).commits.push(record);
  }
  return versions.filter((version) => version.commits.length > 0);
};

const isBreaking = ({ parsed, record }) =>
  parsed.breaking || BREAKING_FOOTER.test(record.body ?? '');

const formatEntry = ({ parsed, record }, slug) => {
  const scope = parsed.scope ? `**${parsed.scope}:** ` : '';
  const short = record.hash.slice(0, 7);
  const link = slug
    ? `([\`${short}\`](${slug.httpsUrl}/commit/${record.hash}))`
    : `(\`${short}\`)`;
  return `- ${scope}${parsed.subject} ${link}`;
};

const bySectionRank = (a, b) =>
  (TYPE_RANK.get(a) ?? Number.MAX_SAFE_INTEGER) -
  (TYPE_RANK.get(b) ?? Number.MAX_SAFE_INTEGER);

const byScope = (a, b) =>
  (a.parsed.scope ?? '').localeCompare(b.parsed.scope ?? '');

const renderTypeSection = (type, commits, slug) => {
  const heading = SECTION_TITLE.get(type) ?? `🔖 ${type}`;
  const entries = [...commits]
    .sort(byScope)
    .map((commit) => formatEntry(commit, slug));
  return [`### ${heading}`, '', ...entries, ''];
};

const renderVersion = ({ version, commits }, slug) => {
  const parsed = commits
    .map((record) => ({ record, parsed: parseCommitHeader(record.subject) }))
    .filter((commit) => commit.parsed !== null);
  const lines = [`## ${version}`, ''];

  const breaking = parsed.filter(isBreaking);
  if (breaking.length > 0) {
    lines.push('### ⚠ BREAKING CHANGES', '');
    for (const commit of breaking) {
      lines.push(formatEntry(commit, slug));
    }
    lines.push('');
  }

  const byType = new Map();
  for (const commit of parsed) {
    byType.set(commit.parsed.type, [
      ...(byType.get(commit.parsed.type) ?? []),
      commit,
    ]);
  }
  for (const type of [...byType.keys()].sort(bySectionRank)) {
    lines.push(...renderTypeSection(type, byType.get(type), slug));
  }
  return lines.join('\n');
};

const main = () => {
  const versions = groupByVersion(parseRecords(readFileSync(0, 'utf8')));
  const slug = readRepoSlug(REPO_ROOT);

  const release = flagValue('--release');
  if (release !== undefined) {
    const version = versions.find((entry) => entry.version === release);
    if (version === undefined) {
      console.error(`No changelog entries for release ${release}.`);
      return;
    }
    process.stdout.write(renderVersion(version, slug));
    return;
  }

  const total = versions.reduce(
    (count, version) => count + version.commits.length,
    0,
  );
  // Each rendered version ends in a blank line, so the join leaves a trailing
  // one. Oxfmt strips it, which would make every regeneration produce a diff
  // the formatter then has to undo — emit the file the way `vp fmt` wants it.
  const body = versions
    .map((version) => renderVersion(version, slug))
    .join('\n')
    .trimEnd();
  const content = `${HEADER}\n${body}\n`;
  if (process.argv.includes('--stdout')) {
    process.stdout.write(content);
    return;
  }
  writeFileSync(join(REPO_ROOT, 'CHANGELOG.md'), content);
  console.log(
    `Wrote CHANGELOG.md (${versions.length} version(s), ${total} commit(s)).`,
  );
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
