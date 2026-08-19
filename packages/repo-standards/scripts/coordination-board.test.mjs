import { describe, expect, it } from 'vite-plus/test';

import { renderBoard } from './coordination-board.mjs';

const task = (data) => ({ data, name: `${data.id}.md`, slug: data.id });

const A_TASK = {
  area: ['packages/ui/**'],
  branch: 'feat/1-a',
  id: 'a-task',
  owner: 'agent:claude',
  status: 'active',
  updated: '2026-08-19',
};

const A_BRANCH = {
  base: 'main',
  branch: 'feat/shared',
  integrator: 'agent:claude',
  status: 'active',
  target: 'main',
  updated: '2026-08-19',
};

describe('renderBoard', () => {
  it('says the register is empty rather than rendering an empty table', () => {
    const board = renderBoard([{ data: undefined }], [{ data: undefined }]);
    expect(board).toContain('No active tasks');
    expect(board).not.toContain('| Task |');
  });

  it('points an empty register at the configured template, not a guessed one', () => {
    const board = renderBoard([{ data: undefined }], [{ data: undefined }], {
      tasksRel: 'ops/claims',
    });

    expect(board).toContain('`ops/claims/_TEMPLATE.md`');
  });

  it('renders only the sections that have entries', () => {
    const board = renderBoard([task(A_TASK)], []);
    expect(board).toContain('## Tasks');
    expect(board).not.toContain('## Shared branches');
  });

  it('renders a shared branch and the tasks riding on it', () => {
    const board = renderBoard(
      [task({ ...A_TASK, branch: 'feat/shared' })],
      [{ data: A_BRANCH, name: 'shared.md', slug: 'shared' }],
    );
    expect(board).toContain('## Shared branches');
    expect(board).toContain('a-task');
    expect(board).toContain('main → main');
  });

  it('marks a shared branch nobody has claimed against', () => {
    const board = renderBoard(
      [],
      [{ data: A_BRANCH, name: 'shared.md', slug: 'shared' }],
    );
    expect(board).toContain('—');
  });

  it('ends with a newline so a regenerated board produces no incidental diff', () => {
    expect(renderBoard([task(A_TASK)], [])).toMatch(/\n$/u);
  });
});
