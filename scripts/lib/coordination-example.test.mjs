import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { parseFrontmatter } from '../../packages/repo-standards/scripts/coordination-parse.mjs';
import { taskErrors } from '../../packages/repo-standards/scripts/coordination-schema.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const README = 'docs/coordination/README.md';

const EXAMPLE = /```yaml\n(---\n[\s\S]*?\n---\n)```/u;

const example = () => {
  const source = readFileSync(join(REPO_ROOT, README), 'utf8');
  const [, block] = EXAMPLE.exec(source) ?? [];
  return block;
};

describe(`${README} task-file example`, () => {
  it('is present', () => {
    expect(example()).toBeDefined();
  });

  it('parses under the register parser', () => {
    const data = parseFrontmatter(example());
    expect(data).toBeDefined();
    expect(Array.isArray(data.area)).toBe(true);
    expect(data.area.length).toBeGreaterThan(0);
  });

  it('satisfies the register schema, so copying it yields a valid claim', () => {
    const data = parseFrontmatter(example());
    expect(taskErrors({ data, slug: data.id }, new Map())).toEqual([]);
  });

  it('would report the trailing-comment form as broken', () => {
    const commented = example().replace(
      /^status: (\S+)$/mu,
      'status: $1 # active | blocked | review | paused | done',
    );
    const data = parseFrontmatter(commented);
    expect(
      taskErrors({ data, slug: data.id }, new Map()).length,
    ).toBeGreaterThan(0);
  });
});
