/**
 * Reads the false-positive list `repo-fallow-gate suppressions` checks a
 * marker against, and the date an entry's expiry is compared with. The list's
 * path is `registers.falsePositives` in devkit.config.json.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readRegisters } from './config.mjs';
import { readTextWithin } from './safe-read.mjs';

export const readFalsePositiveList = (root) => {
  const path = join(root, readRegisters(root).falsePositives);
  if (!existsSync(path)) return [];
  const list = JSON.parse(readTextWithin(path, root));
  if (!Array.isArray(list)) {
    throw new TypeError(
      `${path} is not a JSON array of false-positive entries.`,
    );
  }
  return list;
};

export const isoDay = (date) => date.toISOString().slice(0, 10);
