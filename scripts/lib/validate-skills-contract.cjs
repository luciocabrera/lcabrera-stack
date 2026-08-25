/**
 * The skill-contract checks used by `scripts/validate-skills.cjs`.
 *
 * Why: a directory under `.github/skills/` with no SKILL.md used to be skipped
 * with no error, and a SKILL.md or `.claude/agents/*.md` could name
 * a script that was not there (the stale fallow-scan runner) and still pass.
 * This module is the pure half — classify, parse, collect errors. The CLI
 * prints them and sets the exit code.
 *
 * Script-path matching is deliberately narrow. The word-boundary after
 * `.sh`/`.mjs`/`.cjs`/`.js` keeps `.json` (and similar) from counting as a
 * missing script. Paths under `node_modules/` and URLs (`://`) are excluded
 * because they are consumer/install paths, not repo files this gate can
 * resolve. Changing the regex without those two exclusions re-opens those
 * false-positive classes.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_FRONTMATTER_FIELDS = ['name', 'description'];

/** Directories under `.github/skills/` that are shared support, not skills. */
const SUPPORT_DIRECTORIES = new Set(['code-smell-shared']);

const SCRIPT_PATH_PATTERN =
  /(?<![\w./@-])((?:\.\.\/|\.\/)?(?:[\w.@-]+\/)+[\w.-]+\.(?:sh|mjs|cjs|js))\b/g;

/**
 * @param {string} dir
 * @returns {string[]}
 */
const getDirectories = (dir) => {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));
};

/**
 * @param {string} filePath
 * @returns {{ frontmatter: Record<string, string>, body: string } | null}
 */
const parseFrontmatter = (filePath) => {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const content = rawContent.replace(/\r\n?/g, '\n');

  if (!content.startsWith('---\n')) {
    return null;
  }

  const secondFenceIndex = content.indexOf('\n---\n', 4);
  if (secondFenceIndex === -1) {
    return null;
  }

  const rawFrontmatter = content.slice(4, secondFenceIndex).trim();
  const body = content.slice(secondFenceIndex + 5);

  /** @type {Record<string, string>} */
  const frontmatter = {};

  for (const line of rawFrontmatter.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key.length > 0) {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
};

/**
 * @param {string} markdown
 * @returns {string[]}
 */
const extractRelativeLinks = (markdown) => {
  /** @type {string[]} */
  const links = [];
  let cursor = 0;

  while (cursor < markdown.length) {
    const openLabel = markdown.indexOf('[', cursor);
    if (openLabel === -1) {
      break;
    }

    const closeLabel = markdown.indexOf(']', openLabel + 1);
    if (closeLabel === -1) {
      break;
    }

    if (markdown[closeLabel + 1] !== '(') {
      cursor = closeLabel + 1;
      continue;
    }

    const closeTarget = markdown.indexOf(')', closeLabel + 2);
    if (closeTarget === -1) {
      break;
    }

    const rawLink = markdown.slice(closeLabel + 2, closeTarget).trim();
    if (
      rawLink.startsWith('./') ||
      rawLink.startsWith('../') ||
      !rawLink.includes('://')
    ) {
      links.push(rawLink);
    }

    cursor = closeTarget + 1;
  }

  return links;
};

/**
 * Repo-relative or file-relative script paths mentioned in prose, backticks,
 * or commands — the class a stale `bash path/to/missing.sh` belongs to.
 *
 * @param {string} markdown
 * @returns {readonly string[]}
 */
const extractScriptPaths = (markdown) => {
  const seen = new Set();
  for (const match of markdown.matchAll(SCRIPT_PATH_PATTERN)) {
    const candidate = match[1];
    if (
      candidate === undefined ||
      candidate.includes('node_modules/') ||
      candidate.includes('://')
    ) {
      continue;
    }
    seen.add(candidate);
  }
  return [...seen];
};

/**
 * @param {{ [key: string]: string }} frontmatter
 * @param {string} skillNameFromFolder
 * @returns {readonly string[]}
 */
const validateRequiredFields = (frontmatter, skillNameFromFolder) => {
  /** @type {string[]} */
  const errors = [];

  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    const value = frontmatter[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(
        `Missing required frontmatter field "${field}" in .github/skills/${skillNameFromFolder}/SKILL.md`,
      );
    }
  }

  return errors;
};

/**
 * @param {{ [key: string]: string }} frontmatter
 * @param {string} skillNameFromFolder
 * @returns {readonly string[]}
 */
const validateNameMatch = (frontmatter, skillNameFromFolder) => {
  const frontmatterName = frontmatter.name;
  if (
    typeof frontmatterName === 'string' &&
    frontmatterName !== skillNameFromFolder
  ) {
    return [
      `Frontmatter name mismatch in .github/skills/${skillNameFromFolder}/SKILL.md: expected "${skillNameFromFolder}", got "${frontmatterName}"`,
    ];
  }

  return [];
};

/**
 * @param {{ body: string }} parsed
 * @param {string} skillFilePath
 * @param {string} skillNameFromFolder
 * @returns {readonly string[]}
 */
const validateSkillLinks = (parsed, skillFilePath, skillNameFromFolder) => {
  /** @type {string[]} */
  const errors = [];

  for (const link of extractRelativeLinks(parsed.body)) {
    const targetPath = path.resolve(path.dirname(skillFilePath), link);
    if (!fs.existsSync(targetPath)) {
      errors.push(
        `Broken relative link in .github/skills/${skillNameFromFolder}/SKILL.md: "${link}"`,
      );
    }
  }

  return errors;
};

/**
 * @param {string} markdown
 * @param {string} fromFile
 * @param {string} repoRoot
 * @param {string} label
 * @returns {readonly string[]}
 */
const validateScriptPaths = (markdown, fromFile, repoRoot, label) => {
  /** @type {string[]} */
  const errors = [];

  for (const scriptPath of extractScriptPaths(markdown)) {
    const isFileRelative =
      scriptPath.startsWith('./') || scriptPath.startsWith('../');
    const resolved = path.resolve(
      isFileRelative ? path.dirname(fromFile) : repoRoot,
      scriptPath,
    );
    if (!fs.existsSync(resolved)) {
      errors.push(`Broken script path in ${label}: "${scriptPath}"`);
    }
  }

  return errors;
};

/**
 * @param {string} skillDir
 * @param {string} repoRoot
 * @returns {{
 *   checkedSkillName: string | null;
 *   errors: readonly string[];
 *   skippedSkillName: string | null;
 * }}
 */
const validateSkillDirectory = (skillDir, repoRoot) => {
  const skillNameFromFolder = path.basename(skillDir);
  const skillFilePath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFilePath)) {
    if (SUPPORT_DIRECTORIES.has(skillNameFromFolder)) {
      return {
        checkedSkillName: null,
        errors: [],
        skippedSkillName: skillNameFromFolder,
      };
    }

    return {
      checkedSkillName: skillNameFromFolder,
      errors: [
        `Missing SKILL.md in .github/skills/${skillNameFromFolder} (not on the support allowlist: ${[...SUPPORT_DIRECTORIES].join(', ')})`,
      ],
      skippedSkillName: null,
    };
  }

  const parsed = parseFrontmatter(skillFilePath);
  if (parsed === null) {
    return {
      checkedSkillName: skillNameFromFolder,
      errors: [
        `Invalid or missing frontmatter in .github/skills/${skillNameFromFolder}/SKILL.md`,
      ],
      skippedSkillName: null,
    };
  }

  return {
    checkedSkillName: skillNameFromFolder,
    errors: [
      ...validateRequiredFields(parsed.frontmatter, skillNameFromFolder),
      ...validateNameMatch(parsed.frontmatter, skillNameFromFolder),
      ...validateSkillLinks(parsed, skillFilePath, skillNameFromFolder),
      ...validateScriptPaths(
        parsed.body,
        skillFilePath,
        repoRoot,
        `.github/skills/${skillNameFromFolder}/SKILL.md`,
      ),
    ],
    skippedSkillName: null,
  };
};

/**
 * @param {string} repoRoot
 * @returns {readonly string[]}
 */
const validateAgentScriptPaths = (repoRoot) => {
  const agentsRoot = path.join(repoRoot, '.claude', 'agents');
  if (!fs.existsSync(agentsRoot)) {
    return [];
  }

  return fs
    .readdirSync(agentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const filePath = path.join(agentsRoot, entry.name);
      return validateScriptPaths(
        fs.readFileSync(filePath, 'utf8'),
        filePath,
        repoRoot,
        `.claude/agents/${entry.name}`,
      );
    });
};

/**
 * @typedef {Object} ValidateSkillsResult
 * @property {number} checkedSkillCount
 * @property {readonly string[]} checkedSkills
 * @property {readonly string[]} skippedDirectories
 * @property {readonly string[]} errors
 */

/**
 * @param {{ repoRoot?: string }} [args]
 * @returns {ValidateSkillsResult}
 */
const validateSkills = (args = {}) => {
  const effectiveRepoRoot = args.repoRoot ?? process.cwd();
  const skillsRoot = path.join(effectiveRepoRoot, '.github', 'skills');

  if (!fs.existsSync(skillsRoot)) {
    return {
      checkedSkillCount: 0,
      checkedSkills: [],
      errors: ['ERROR: .github/skills directory not found.'],
      skippedDirectories: [],
    };
  }

  const skillDirectories = getDirectories(skillsRoot);
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const checkedSkills = [];
  /** @type {string[]} */
  const skippedDirectories = [];

  for (const skillDir of skillDirectories) {
    const validation = validateSkillDirectory(skillDir, effectiveRepoRoot);
    if (validation.skippedSkillName !== null) {
      skippedDirectories.push(validation.skippedSkillName);
      continue;
    }

    if (validation.checkedSkillName !== null) {
      checkedSkills.push(validation.checkedSkillName);
    }

    for (const error of validation.errors) {
      errors.push(error);
    }
  }

  for (const error of validateAgentScriptPaths(effectiveRepoRoot)) {
    errors.push(error);
  }

  return {
    checkedSkillCount: checkedSkills.length,
    checkedSkills,
    errors,
    skippedDirectories,
  };
};

module.exports = {
  SUPPORT_DIRECTORIES,
  extractRelativeLinks,
  extractScriptPaths,
  parseFrontmatter,
  validateSkills,
};
