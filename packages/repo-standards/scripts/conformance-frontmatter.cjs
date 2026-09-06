/**
 * Frontmatter reader for the agent-facing artifacts (skills, path rules,
 * subagents).
 *
 * Why: the line-at-a-time reader this replaces returned the literal "|" for a
 * block-scalar `description`, so such a description read as present and as
 * content-free at the same time.
 * Usage: `require('./conformance-frontmatter.cjs')`.
 */
'use strict';

const fs = require('node:fs');

const ENTRY_START = /^[A-Za-z][\w-]*:/;
const BLOCK_SCALAR = /^[|>][-+\d]*$/;

/**
 * @param {string} content
 * @returns {{ raw: string, body: string } | null}
 */
const splitFrontmatter = (content) => {
  if (!content.startsWith('---\n')) {
    return null;
  }

  const closingFenceIndex = content.indexOf('\n---\n', 4);
  if (closingFenceIndex === -1) {
    return null;
  }

  return {
    body: content.slice(closingFenceIndex + 5),
    raw: content.slice(4, closingFenceIndex),
  };
};

/**
 * @param {string} raw
 * @returns {readonly { key: string, lines: string[] }[]}
 */
const groupEntries = (raw) => {
  /** @type {{ key: string, lines: string[] }[]} */
  const entries = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    if (ENTRY_START.test(line)) {
      const separatorIndex = line.indexOf(':');
      entries.push({
        key: line.slice(0, separatorIndex).trim(),
        lines: [line.slice(separatorIndex + 1).trim()],
      });
      continue;
    }

    entries.at(-1)?.lines.push(trimmed);
  }

  return entries;
};

/**
 * @param {string} value
 * @returns {string}
 */
const unquote = (value) => value.replace(/^['"]|['"]$/g, '').trim();

/**
 * @param {readonly string[]} lines
 * @returns {string}
 */
const scalarValue = (lines) => {
  const [first = '', ...rest] = lines;
  return BLOCK_SCALAR.test(first)
    ? rest.join(' ').trim()
    : unquote(lines.join(' ').trim());
};

/**
 * @param {readonly string[]} lines
 * @returns {readonly string[] | undefined} the entries when the value is
 *   written as a list, `undefined` for a scalar
 */
const listValues = (lines) => {
  const text = lines.join(' ').trim();

  if (text.startsWith('[')) {
    return text
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map(unquote)
      .filter((entry) => entry.length > 0);
  }

  const items = lines.filter((line) => line.startsWith('- '));
  if (items.length === 0) {
    return undefined;
  }

  return items
    .map((line) => unquote(line.slice(2)))
    .filter((entry) => entry.length > 0);
};

/**
 * @param {string} rawContent
 * @returns {{
 *   body: string;
 *   frontmatter: Record<string, string>;
 *   lists: Record<string, readonly string[]>;
 * } | null}
 */
const parseFrontmatterContent = (rawContent) => {
  const split = splitFrontmatter(rawContent.replace(/\r\n?/g, '\n'));
  if (split === null) {
    return null;
  }

  const entries = groupEntries(split.raw);

  return {
    body: split.body,
    frontmatter: Object.fromEntries(
      entries.map((entry) => [entry.key, scalarValue(entry.lines)]),
    ),
    lists: Object.fromEntries(
      entries.flatMap((entry) => {
        const values = listValues(entry.lines);
        return values === undefined ? [] : [[entry.key, values]];
      }),
    ),
  };
};

/**
 * @param {string} filePath
 * @returns {ReturnType<typeof parseFrontmatterContent>}
 */
const parseFrontmatter = (filePath) =>
  parseFrontmatterContent(fs.readFileSync(filePath, 'utf8'));

module.exports = {
  parseFrontmatter,
  parseFrontmatterContent,
};
