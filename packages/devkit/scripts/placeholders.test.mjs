import { describe, expect, test } from 'vite-plus/test';

import { requiredCommands, substituteCommands } from './placeholders.mjs';

describe('requiredCommands', () => {
  test('lists each key once, whatever the spacing', () => {
    expect(
      requiredCommands(
        '{{commands.install}} then {{ commands.install }} and {{commands.claim}}',
      ),
    ).toEqual(['install', 'claim']);
  });

  test('finds nothing in content that asks for nothing', () => {
    expect(requiredCommands('run the gate')).toEqual([]);
  });
});

describe('substituteCommands', () => {
  test('replaces every occurrence with the consumer command', () => {
    expect(
      substituteCommands({
        commands: { install: 'vp install' },
        content: 'First {{commands.install}}, then {{commands.install}} again.',
      }),
    ).toEqual({
      content: 'First vp install, then vp install again.',
      missing: [],
    });
  });

  test('reports a missing key and leaves the content untouched', () => {
    const content = 'Run {{commands.claim}}.';
    expect(substituteCommands({ commands: {}, content })).toEqual({
      content,
      missing: ['claim'],
    });
  });

  test('treats an empty command as missing rather than substituting nothing', () => {
    expect(
      substituteCommands({
        commands: { claim: '' },
        content: '{{commands.claim}}',
      }).missing,
    ).toEqual(['claim']);
  });
});
