import { describe, expect, it } from 'vite-plus/test';

import { parseJsonc, stripJsoncComments } from './jsonc.mjs';

describe('stripJsoncComments', () => {
  it('removes a line comment outside a string, keeping the line break', () => {
    const text = '{\n  // a line comment\n  "a": 1, // trailing\n  "b": 2\n}';
    expect(JSON.parse(stripJsoncComments(text))).toEqual({ a: 1, b: 2 });
    expect(stripJsoncComments(text).split('\n')).toHaveLength(5);
  });

  it('leaves comment markers inside a string alone', () => {
    const text = '{ "url": "https://x.test/a", "note": "// not a comment" }';
    expect(JSON.parse(stripJsoncComments(text))).toEqual({
      note: '// not a comment',
      url: 'https://x.test/a',
    });
  });

  it('does not end a string at an escaped quote', () => {
    const text = '{ "quote": "she said \\"hi\\" // still text", "n": 1 }';
    expect(JSON.parse(stripJsoncComments(text))).toEqual({
      n: 1,
      quote: 'she said "hi" // still text',
    });
  });

  it('drops a comment that runs to the end of the text', () => {
    expect(stripJsoncComments('{ "a": 1 } // open').trim()).toBe('{ "a": 1 }');
  });
});

describe('parseJsonc', () => {
  it('parses a commented config with a trailing comma', () => {
    expect(parseJsonc('// top\n{ "x": [1, 2,], }')).toEqual({ x: [1, 2] });
  });

  it('throws on a malformed document rather than returning a default', () => {
    expect(() => parseJsonc('{ "x": }')).toThrow();
  });
});
