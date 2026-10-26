/**
 * The agent-facing artifact roster, enumerated from disk: every skill under
 * `.github/skills`, every path rule under `.claude/rules`, every subagent
 * under `.claude/agents`, and every artifact under a root the repository adds.
 *
 * Why: a roster written down anywhere but the filesystem stops covering an
 * artifact the day one is added, and reports the same clean pass either way.
 * Usage: `require('./conformance-artifacts.cjs').collectArtifacts(...)`.
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
    .toSorted(byName);

/**
 * @param {string} repoRoot
 * @param {{ kind: 'rule' | 'subagent', dir: string }} root
 */
const collectFlatKind = (repoRoot, root) =>
  markdownFileNames(path.join(repoRoot, root.dir)).map((fileName) =>
    readArtifact(
      root.kind,
      fileName.replace(/\.md$/, ''),
      `${root.dir}/${fileName}`,
      path.join(repoRoot, root.dir, fileName),
    ),
  );

/**
 * @param {string} repoRoot
 * @param {string} dir
 */
const collectSkills = (repoRoot, dir) => {
  const root = path.join(repoRoot, dir);
  const directories = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted(byName)
    .map((name) => ({ filePath: path.join(root, name, 'SKILL.md'), name }));

  const present = directories.filter((entry) => fs.existsSync(entry.filePath));
  const missing = directories.filter((entry) => !fs.existsSync(entry.filePath));

  return {
    artifacts: present.map((entry) =>
      readArtifact(
        'skill',
        entry.name,
        `${dir}/${entry.name}/SKILL.md`,
        entry.filePath,
      ),
    ),
    findings: missing
      .filter((entry) => !SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => ({
        kind: 'skill',
        label: `${dir}/${entry.name}`,
        message: `Missing SKILL.md in ${dir}/${entry.name} (not on the support allowlist: ${[...SUPPORT_DIRECTORIES].join(', ')})`,
      })),
    skippedDirectories: missing
      .filter((entry) => SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => entry.name),
    unreadableNames: missing
      .filter((entry) => !SUPPORT_DIRECTORIES.has(entry.name))
      .map((entry) => entry.name),
  };
};

/**
 * @param {string} repoRoot
 * @param {{ kind: string, dir: string }} root
 */
const collectRoot = (repoRoot, root) => {
  if (!fs.existsSync(path.join(repoRoot, root.dir))) {
    return {
      artifacts: [],
      findings: [
        {
          kind: root.kind,
          label: root.dir,
          message: `Artifact root not found: ${root.dir}`,
        },
      ],
      skippedDirectories: [],
      unreadableNames: [],
    };
  }

  return root.kind === 'skill'
    ? collectSkills(repoRoot, root.dir)
    : {
        artifacts: collectFlatKind(repoRoot, root),
        findings: [],
        skippedDirectories: [],
        unreadableNames: [],
      };
};

const DEFAULT_ROOTS = ['skill', 'rule', 'subagent'].map((kind) => ({
  dir: KINDS[kind].root,
  kind,
}));

/**
 * @param {{
 *   repoRoot: string;
 *   additionalRoots?: readonly { kind: 'rule' | 'skill' | 'subagent', dir: string }[];
 * }} args
 */
const collectArtifacts = ({ additionalRoots = [], repoRoot }) => {
  const collected = [...DEFAULT_ROOTS, ...additionalRoots].map((root) =>
    collectRoot(repoRoot, root),
  );

  return {
    artifacts: collected.flatMap((entry) => entry.artifacts),
    findings: collected.flatMap((entry) => entry.findings),
    skippedDirectories: collected.flatMap((entry) => entry.skippedDirectories),
    unreadableNames: collected.flatMap((entry) => entry.unreadableNames),
  };
};

module.exports = {
  collectArtifacts,
  KINDS,
  SUPPORT_DIRECTORIES,
};
