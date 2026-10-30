import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vite-plus/test';

import { PANEL_TOOLS, scopeDecision, scopeHook } from './panel-scope.mjs';

const tree = realpathSync(mkdtempSync(join(tmpdir(), 'panel-scope-')));
const outside = realpathSync(mkdtempSync(join(tmpdir(), 'panel-outside-')));
mkdirSync(join(tree, 'src'));
writeFileSync(join(tree, 'src/a.ts'), 'a');
writeFileSync(join(outside, 'secret.txt'), 'secret');
symlinkSync(join(outside, 'secret.txt'), join(tree, 'src/link.txt'));

afterAll(() => {
  for (const path of [tree, outside])
    rmSync(path, { force: true, recursive: true });
});

const decide = (toolName, input) => scopeDecision({ input, toolName, tree });

describe('scopeDecision', () => {
  it('names the three read-only file tools', () => {
    expect(PANEL_TOOLS).toEqual(['Read', 'Glob', 'Grep']);
  });

  it.each([
    ['Read', { file_path: join(tree, 'src/missing.ts') }],
    ['Read', { file_path: join(tree, 'src/a.ts') }],
    ['Read', { file_path: 'src/a.ts' }],
    ['Glob', { pattern: 'src/**/*.ts' }],
    ['Glob', { path: tree, pattern: '**/*' }],
    ['Grep', { glob: '*.ts', path: join(tree, 'src'), pattern: 'a' }],
    ['Grep', { pattern: 'a' }],
  ])('allows %s call %# inside the tree', (toolName, input) => {
    expect(decide(toolName, input)).toEqual({ allow: true });
  });

  it.each([
    ['Read', { file_path: join(outside, 'secret.txt') }],
    ['Read', { file_path: '../secret.txt' }],
    ['Read', { file_path: join(tree, 'src/link.txt') }],
    ['Read', { file_path: 7 }],
    ['Glob', { pattern: `${outside}/*` }],
    ['Glob', { pattern: '../**' }],
    ['Glob', { pattern: '~/.ssh/*' }],
    ['Glob', { path: outside, pattern: '*' }],
    ['Grep', { path: outside, pattern: 'secret' }],
    ['Grep', { glob: '../*', pattern: 'secret' }],
  ])('refuses %s call %# outside the tree', (toolName, input) => {
    expect(decide(toolName, input)).toMatchObject({ allow: false });
    expect(decide(toolName, input).reason).toContain(
      'is outside the case tree',
    );
  });

  it.each(['Bash', 'Write', 'Edit', 'WebFetch', 'Task'])(
    'refuses %s',
    (toolName) => {
      expect(decide(toolName, {})).toEqual({
        allow: false,
        reason: `${toolName} is not a panel tool`,
      });
    },
  );
});

describe('scopeDecision — the reason', () => {
  it('names every path that leaves the tree', () => {
    expect(
      decide('Grep', { glob: '../*', path: outside, pattern: 'secret' }),
    ).toEqual({
      allow: false,
      reason: `${outside}, ../* is outside the case tree`,
    });
  });
});

describe('scopeHook', () => {
  it('answers a PreToolUse call with the decision', async () => {
    const hook = scopeHook({ tree });
    expect(
      await hook({ tool_input: { file_path: 'src/a.ts' }, tool_name: 'Read' }),
    ).toStrictEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    });
    expect(
      await hook({
        tool_input: { file_path: '/etc/passwd' },
        tool_name: 'Read',
      }),
    ).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '/etc/passwd is outside the case tree',
      },
    });
  });
});
