import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { parseFrontmatter } from '../../packages/repo-standards/scripts/coordination-parse.mjs';
import { taskErrors } from '../../packages/repo-standards/scripts/coordination-schema.mjs';

// Runs the coordination README's worked example through the register's own
// parser and schema, so an example that would be rejected as a claim fails the
// build here. The register is not read by a YAML library, so a trailing
// `# note` is part of the value — the failure this pins is #993.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const README = 'docs/coordination/README.md';

/** The first fenced `yaml` block in the README — the task-file example. */
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
