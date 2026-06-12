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

const REQUIRED_FRONTMATTER_FIELDS = ['name', 'description', 'license'];

/**
 * @param {string} dir
 * @returns {string[]}
 */
const getDirectories = (dir) => {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name));
};

/**
 * @param {string} filePath
 * @returns {{ frontmatter: Record<string, string>, body: string } | null}
 */
const parseFrontmatter = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

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
  const links = [];
  const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

  let match = markdownLinkRegex.exec(markdown);
  while (match !== null) {
    const rawLink = match[1].trim();
    if (
      rawLink.startsWith('http://') ||
      rawLink.startsWith('https://') ||
      rawLink.startsWith('mailto:') ||
      rawLink.startsWith('#')
    ) {
      match = markdownLinkRegex.exec(markdown);
      continue;
    }

    const sanitized = rawLink.split('#')[0].split('?')[0].trim();
    if (sanitized.length > 0) {
      links.push(sanitized);
    }

    match = markdownLinkRegex.exec(markdown);
  }

  return links;
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
    const skillNameFromFolder = path.basename(skillDir);
    const skillFilePath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFilePath)) {
      skippedDirectories.push(skillNameFromFolder);
      continue;
    }

    checkedSkills.push(skillNameFromFolder);

    const parsed = parseFrontmatter(skillFilePath);
    if (parsed === null) {
      errors.push(
        `Invalid or missing frontmatter in .github/skills/${skillNameFromFolder}/SKILL.md`,
      );
      continue;
    }

    for (const field of REQUIRED_FRONTMATTER_FIELDS) {
      const value = parsed.frontmatter[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push(
          `Missing required frontmatter field "${field}" in .github/skills/${skillNameFromFolder}/SKILL.md`,
        );
      }
    }

    const frontmatterName = parsed.frontmatter.name;
    if (
      typeof frontmatterName === 'string' &&
      frontmatterName !== skillNameFromFolder
    ) {
      errors.push(
        `Frontmatter name mismatch in .github/skills/${skillNameFromFolder}/SKILL.md: expected "${skillNameFromFolder}", got "${frontmatterName}"`,
      );
    }

    const links = extractRelativeLinks(parsed.body);
    for (const link of links) {
      const targetPath = path.resolve(path.dirname(skillFilePath), link);
      if (!fs.existsSync(targetPath)) {
        errors.push(
          `Broken relative link in .github/skills/${skillNameFromFolder}/SKILL.md: "${link}"`,
        );
      }
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
  validateSkills,
};
