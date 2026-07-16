#!/usr/bin/env node

/*
 * Validates .github skills contracts:
 * - Skill folders with SKILL.md must have valid frontmatter.
 * - Required frontmatter fields are present.
 * - name matches folder name.
 * - Relative markdown links resolve.
 */

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_FRONTMATTER_FIELDS = ['name', 'description'];

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
 * @param {string} skillDir
 * @returns {{
 *   checkedSkillName: string | null;
 *   errors: readonly string[];
 *   skippedSkillName: string | null;
 * }}
 */
const validateSkillDirectory = (skillDir) => {
  const skillNameFromFolder = path.basename(skillDir);
  const skillFilePath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFilePath)) {
    return {
      checkedSkillName: null,
      errors: [],
      skippedSkillName: skillNameFromFolder,
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
    ],
    skippedSkillName: null,
  };
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
    const validation = validateSkillDirectory(skillDir);
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

  return {
    checkedSkillCount: checkedSkills.length,
    checkedSkills,
    errors,
    skippedDirectories,
  };
};

const runCli = () => {
  const shouldOutputJson = process.argv.includes('--json');
  const result = validateSkills({ repoRoot: process.cwd() });

  if (shouldOutputJson) {
    console.log(JSON.stringify(result, null, 2));
  }

  if (result.errors.length > 0) {
    console.error('Skill validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Skill validation passed for ${result.checkedSkillCount} skill directories.`,
  );
  if (result.skippedDirectories.length > 0) {
    console.log(
      `Skipped non-skill directories: ${result.skippedDirectories.join(', ')}`,
    );
  }
};

if (require.main === module) {
  runCli();
}

module.exports = {
  // Exported for packages/agent-runner's SKILL.md loader (TECH_SPEC §2.6) —
  // reuses this parser rather than re-implementing frontmatter parsing.
  parseFrontmatter,
  validateSkills,
};
