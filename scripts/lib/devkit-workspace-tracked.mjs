/**
 * The created-tree gates' finding for a committed file a task rewrote, carrying
 * the file's diff so a failure names what was written.
 *
 * Pure: the caller hands in `git status --porcelain` and a diff reader.
 */

import { trackedPathsIn } from './devkit-workspace.mjs';

const DIFF_HEAD_LINES = 80;

/**
 * @param {string} diff
 * @returns {string}
 */
export const diffHead = (diff) => {
  const lines = diff.split('\n').filter((line) => line !== '');
  if (lines.length === 0) return 'no diff';
  const hidden = lines.length - DIFF_HEAD_LINES;
  return hidden > 0
    ? [...lines.slice(0, DIFF_HEAD_LINES), `… ${hidden} more line(s)`].join(
        '\n',
      )
    : lines.join('\n');
};

/**
 * @param {{ diffOf: (path: string) => string, porcelain: string }} args
 * @returns {string[]}
 */
export const modifiedTrackedFiles = ({ diffOf, porcelain }) =>
  trackedPathsIn(porcelain).map(
    (path) =>
      `\`${path}\` changed while the gate ran — a task rewrote a file the blueprint shipped, so a consumer's fresh tree goes dirty the first time they run it:\n${diffHead(diffOf(path))}`,
  );
