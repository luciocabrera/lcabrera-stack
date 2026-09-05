/**
 * Path references an artifact makes — markdown links and script paths named in
 * prose or a command — and whether each one still resolves.
 *
 * Why: a skill, rule or subagent that points at a moved file fails silently;
 * the stale fallow-scan runner path is the case this was written for.
 * The two classes resolve differently and must not share a resolver: a
 * markdown link is read by a renderer, so it is file-relative unless it leads
 * with `/`, while a bare script path is typed at the repository root.
 * Matching stays narrow on purpose: the word boundary after a script extension
 * keeps `.json` out, and `node_modules/` and URLs are consumer paths this
 * repository cannot resolve.
 * Usage: `require('./lib/conformance-references.cjs')`.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SCRIPT_PATH_PATTERN =
  /(?<![\w./@-])((?:\.\.\/|\.\/)?(?:[\w.@-]+\/)+[\w.-]+\.(?:sh|mjs|cjs|js))\b/g;

/**
 * @param {string} markdown
 * @returns {readonly string[]}
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
    if (!rawLink.includes('://') && !rawLink.startsWith('mailto:')) {
      links.push(rawLink);
    }

    cursor = closeTarget + 1;
  }

  return links;
};

/**
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
 * @param {string} link
 * @returns {string}
 */
const withoutFragment = (link) => link.split('#')[0]?.split('?')[0] ?? '';

/**
 * @param {{ fromFile: string, reference: string, repoRoot: string }} args
 * @returns {boolean}
 */
const linkResolves = ({ fromFile, reference, repoRoot }) =>
  fs.existsSync(
    reference.startsWith('/')
      ? path.resolve(repoRoot, reference.slice(1))
      : path.resolve(path.dirname(fromFile), reference),
  );

/**
 * @param {{ fromFile: string, reference: string, repoRoot: string }} args
 * @returns {boolean}
 */
const scriptPathResolves = ({ fromFile, reference, repoRoot }) =>
  fs.existsSync(
    reference.startsWith('./') || reference.startsWith('../')
      ? path.resolve(path.dirname(fromFile), reference)
      : path.resolve(repoRoot, reference),
  );

/**
 * @param {{
 *   filePath: string;
 *   label: string;
 *   markdown: string;
 *   repoRoot: string;
 * }} args
 * @returns {readonly { message: string, reference: string }[]}
 */
const referenceFindings = ({ filePath, label, markdown, repoRoot }) => {
  const links = extractRelativeLinks(markdown)
    .filter((link) => withoutFragment(link).length > 0)
    .filter(
      (link) =>
        !linkResolves({
          fromFile: filePath,
          reference: withoutFragment(link),
          repoRoot,
        }),
    )
    .map((link) => ({
      message: `Broken relative link in ${label}: "${link}"`,
      reference: link,
    }));

  const scripts = extractScriptPaths(markdown)
    .filter(
      (scriptPath) =>
        !scriptPathResolves({
          fromFile: filePath,
          reference: scriptPath,
          repoRoot,
        }),
    )
    .map((scriptPath) => ({
      message: `Broken script path in ${label}: "${scriptPath}"`,
      reference: scriptPath,
    }));

  return [...links, ...scripts];
};

module.exports = {
  extractRelativeLinks,
  extractScriptPaths,
  referenceFindings,
};
