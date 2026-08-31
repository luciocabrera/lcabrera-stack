/**
 * Reads the coordination register's `.md` entries off disk — the one fs-touching
 * helper shared by `verify-coordination.mjs` (the checks + board writer) and
 * `coordination-board-live.mjs` (the live view). Kept apart from
 * `coordination-parse.mjs` (which stays pure — no fs) and
 * `coordination-board.mjs` (pure rendering) so each lib has a single concern.
 *
 * `_TEMPLATE.md` and any `_*`-prefixed file are ignored, matching the register
 * convention.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseFrontmatter } from './coordination-parse.mjs';

export const readEntries = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_'),
        )
        .map((e) => ({
          name: e.name,
          slug: e.name.replace(/\.md$/, ''),
          data: parseFrontmatter(readFileSync(join(dir, e.name), 'utf8')),
        }))
    : [];
