/**
 * The agent-facing artifact roster, enumerated from disk: every skill under
 * `.github/skills`, every path rule under `.claude/rules`, every subagent
 * under `.claude/agents`.
 *
 * Why: a roster written down anywhere but the filesystem stops covering an
 * artifact the day one is added, and reports the same clean pass either way.
 * Usage: `require('./lib/conformance-artifacts.cjs').collectArtifacts(...)`.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseFrontmatter } = require('./conformance-frontmatter.cjs');

const SUPPORT_DIRECTORIES = new Set(['code-smell-shared']);

const KINDS = {
  rule: {
    nameSource: 'file',
    requiredFields: ['paths'],
    root: '.claude/rules',
    triggerField: 'paths',
  },
  skill: {
    nameSource: 'directory',
    requiredFields: ['name', 'description'],
    root: '.github/skills',
    triggerField: 'description',
  },
  subagent: {
    nameSource: 'file',
    requiredFields: ['name', 'description'],
    root: '.claude/agents',
    triggerField: 'description',
  },
};

const byName = (a, b) => a.localeCompare(b);

/**
 * @param {string} kind
 * @param {string} name
 * @param {string} label
 * @param {string} filePath
 */
const readArtifact = (kind, name, label, filePath) => ({
  filePath,
  kind,
  label,
  name,
  parsed: parseFrontmatter(filePath),
});

/**
 * @param {string} directory
 * @returns {readonly string[]}
 */
const markdownFileNames = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort(byName);

/**
 * @param {string} repoRoot
 * @param {'rule' | 'subagent'} kind
 */
const collectFlatKind = (repoRoot, kind) => {
  const root = path.join(repoRoot, KINDS[kind].root);

  return markdownFileNames(root).map((fileName) =>
    readArtifact(
      kind,
      fileName.replace(/\.md$/, ''),
      `${KINDS[kind].root}/${fileName}`,
      path.join(root, fileName),
    ),
  );
};

/**
 * @param {string} repoRoot
 */
const collectSkills = (repoRoot) => {
  const root = path.join(repoRoot, KINDS.skill.root);
  const directories = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byName)
    .map((name) => ({ filePath: path.join(root, name, 'SKILL.md'), name }));

  const present = directories.filter((entry) => fs.existsSync(entry.filePath));
  const missing = directories.filter((entry) => !fs.existsSync(entry.filePath));

  return {
    artifacts: present.map((entry) =>
      readArtifact(
        'skill',
        entry.name,
        `${KINDS.skill.root}/${entry.name}/SKILL.md`,
        entry.filePath,
      ),
    ),
    findings: missing
      .filter((entry) => !SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => ({
        kind: 'skill',
        label: `${KINDS.skill.root}/${entry.name}`,
        message: `Missing SKILL.md in ${KINDS.skill.root}/${entry.name} (not on the support allowlist: ${[...SUPPORT_DIRECTORIES].join(', ')})`,
      })),
    unreadableNames: missing
      .filter((entry) => !SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => entry.name),
    skippedDirectories: missing
      .filter((entry) => SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => entry.name),
  };
};

/**
 * @param {string} kind
 */
const missingRootFinding = (kind) => ({
  kind,
  label: KINDS[kind].root,
  message: `Artifact root not found: ${KINDS[kind].root}`,
});

/**
 * @param {string} repoRoot
 * @param {'rule' | 'subagent'} kind
 */
const collectFlatKindOrFinding = (repoRoot, kind) =>
  fs.existsSync(path.join(repoRoot, KINDS[kind].root))
    ? { artifacts: collectFlatKind(repoRoot, kind), findings: [] }
    : { artifacts: [], findings: [missingRootFinding(kind)] };

/**
 * @param {string} repoRoot
 */
const collectSkillsOrFinding = (repoRoot) =>
  fs.existsSync(path.join(repoRoot, KINDS.skill.root))
    ? collectSkills(repoRoot)
    : {
        artifacts: [],
        findings: [missingRootFinding('skill')],
        skippedDirectories: [],
        unreadableNames: [],
      };

/**
 * @param {{ repoRoot: string }} args
 */
const collectArtifacts = ({ repoRoot }) => {
  const skills = collectSkillsOrFinding(repoRoot);
  const rules = collectFlatKindOrFinding(repoRoot, 'rule');
  const subagents = collectFlatKindOrFinding(repoRoot, 'subagent');

  return {
    artifacts: [
      ...skills.artifacts,
      ...rules.artifacts,
      ...subagents.artifacts,
    ],
    findings: [...skills.findings, ...rules.findings, ...subagents.findings],
    skippedDirectories: skills.skippedDirectories,
    unreadableNames: skills.unreadableNames,
  };
};

module.exports = {
  KINDS,
  SUPPORT_DIRECTORIES,
  collectArtifacts,
};
