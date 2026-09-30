/*
 * The part of a materialised file its consumer owns, split off before the file
 * is hashed and put back after it is written.
 *
 * A region is one top-level YAML key the shipped file never carries, so every
 * line under it is the consumer's by construction and the recorded hash covers
 * everything else. ADR-126 is the decision and names the one region there is.
 */

const REGIONS = new Map([['workspace/pnpm-workspace.yaml', 'catalog']]);

/**
 * @param {string} assetPath
 * @returns {string | undefined}
 */
export const consumerRegionKey = (assetPath) => REGIONS.get(assetPath);

const isBlank = (line) => line.trim() === '';

const isColumnComment = (line) => line.startsWith('#');

const isTopLevel = (line) => !isBlank(line) && !/^\s/.test(line);

const opensRegion = (line, key) => {
  const bare = line.trimEnd();
  return bare === `${key}:` || bare.startsWith(`${key}: `);
};

const runStartingBefore = (lines, index, belongs) =>
  lines.slice(0, index).findLastIndex((line) => !belongs(line)) + 1;

const runEndingAfter = (lines, index, belongs) => {
  const offset = lines.slice(index).findIndex((line) => !belongs(line));
  return offset === -1 ? lines.length : index + offset;
};

const blockEnd = (lines, header) => {
  const next = runEndingAfter(
    lines,
    header + 1,
    (line) => !isTopLevel(line) && !isColumnComment(line),
  );
  const lastFilled = lines
    .slice(header, next)
    .findLastIndex((line) => !isBlank(line));
  return header + lastFilled + 1;
};

/**
 * @param {{ content: string, key: string }} args
 * @returns {{ kit: string, region: string }}
 */
export const splitConsumerRegion = ({ content, key }) => {
  const lines = content.split('\n');
  const header = lines.findIndex((line) => opensRegion(line, key));
  if (header === -1) return { kit: content, region: '' };

  const start = runStartingBefore(lines, header, isColumnComment);
  const end = blockEnd(lines, header);
  const before = runStartingBefore(lines, start, isBlank);
  const after = before === 0 ? runEndingAfter(lines, end, isBlank) : end;

  return {
    kit: [...lines.slice(0, before), ...lines.slice(after)].join('\n'),
    region: lines.slice(start, end).join('\n'),
  };
};

/**
 * @param {{ kit: string, region?: string }} args
 * @returns {string}
 */
export const joinConsumerRegion = ({ kit, region = '' }) => {
  if (region === '') return kit;
  const terminated = kit.endsWith('\n') ? kit : `${kit}\n`;
  return `${terminated}\n${region}\n`;
};
