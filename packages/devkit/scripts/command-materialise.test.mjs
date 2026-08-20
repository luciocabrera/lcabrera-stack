import { describe, expect, test } from 'vite-plus/test';

import { countsFor, renderPlan } from './command-materialise.mjs';

const entry = (state, missing) => ({
  missing,
  path: '.github/skills/demo/SKILL.md',
  state,
});

describe('renderPlan', () => {
  test('names what is missing behind each refusal, and keeps the two apart', () => {
    // A missing command and a missing config key need different edits to
    // devkit.config.json, so one shared wording would name the file without
    // saying what to do about it.
    expect(
      renderPlan([
        entry('unresolved', ['install']),
        entry('unmet', ['paths.workflows']),
      ]),
    ).toBe(
      [
        '  unresolved   .github/skills/demo/SKILL.md  (not written — no command configured for install)',
        '  unmet        .github/skills/demo/SKILL.md  (not written — no config key set for paths.workflows)',
      ].join('\n'),
    );
  });

  test('says so when a plan has nothing worth reporting', () => {
    expect(renderPlan([entry('current')])).toBe('Everything is up to date.');
  });
});

describe('countsFor', () => {
  test('a refused asset counts as reported and never as written', () => {
    expect(
      countsFor([entry('unmet', ['paths.workflows']), entry('added')]),
    ).toEqual({ reported: 1, written: 1 });
  });
});
