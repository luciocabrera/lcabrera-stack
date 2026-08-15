import { describe, expect, it } from 'vite-plus/test';

import {
  jsonBlock,
  MAX_VERDICT_BODY_BYTES,
  markerSha,
  readVerdictDocument,
  selectVerdictComment,
  verdictComments,
} from './agent-review-discovery.mjs';

const HEAD = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

const comment = (body, url = 'https://example.test/c') => ({
  body,
  html_url: url,
});

const verdictBody = (sha, json) =>
  `Agent-review verdict: ${sha}\n\n\`\`\`json\n${json}\n\`\`\`\n`;

describe('markerSha', () => {
  it('reads the SHA from a first line that is exactly the marker', () => {
    expect(markerSha(verdictBody(HEAD, '{}'))).toBe(HEAD);
  });

  it('ignores a marker that is not the first line', () => {
    // Otherwise any comment quoting the format would be discovered as a verdict.
    expect(
      markerSha(`Some prose\nAgent-review verdict: ${HEAD}`),
    ).toBeUndefined();
  });

  it('rejects a SHA that is not 40 lowercase hex characters', () => {
    expect(
      markerSha(`Agent-review verdict: ${HEAD.toUpperCase()}`),
    ).toBeUndefined();
    expect(
      markerSha(`Agent-review verdict: ${'a'.repeat(39)}`),
    ).toBeUndefined();
    expect(markerSha('Agent-review verdict: HEAD')).toBeUndefined();
  });

  it('rejects trailing text on the marker line', () => {
    expect(
      markerSha(`Agent-review verdict: ${HEAD} (round 2)`),
    ).toBeUndefined();
  });

  it('does not confuse the override marker with the verdict marker', () => {
    // §6's override shares the shape; only the word before the SHA separates them.
    expect(markerSha(`Agent-review override: ${HEAD}`)).toBeUndefined();
  });

  it('survives a non-string body', () => {
    expect(markerSha(undefined)).toBeUndefined();
    expect(markerSha(null)).toBeUndefined();
  });
});

describe('jsonBlock', () => {
  it('returns the contents of the first fenced json block', () => {
    expect(jsonBlock(verdictBody(HEAD, '{"a":1}'))).toBe('{"a":1}\n');
  });

  it('returns undefined when the block is never closed', () => {
    expect(
      jsonBlock(`Agent-review verdict: ${HEAD}\n\n\`\`\`json\n{"a":1}\n`),
    ).toBeUndefined();
  });

  it('returns undefined when there is no fence at all', () => {
    expect(
      jsonBlock(`Agent-review verdict: ${HEAD}\n\n{"a":1}\n`),
    ).toBeUndefined();
  });
});

describe('verdictComments', () => {
  it('keeps only the marked comments, in order', () => {
    const found = verdictComments([
      comment('unrelated chatter'),
      comment(verdictBody(HEAD, '{}')),
      comment(verdictBody(OTHER, '{}')),
    ]);
    expect(found.map((entry) => entry.sha)).toEqual([HEAD, OTHER]);
  });
});

describe('selectVerdictComment', () => {
  it('reports none when no comment carries the marker', () => {
    expect(selectVerdictComment([comment('LGTM')], HEAD)).toEqual({
      outcome: 'none',
    });
  });

  it('reports stale when every marker names another commit (§2.5)', () => {
    expect(
      selectVerdictComment([comment(verdictBody(OTHER, '{}'))], HEAD),
    ).toEqual({ otherSha: OTHER, outcome: 'stale' });
  });

  it('reports duplicate rather than picking the newest', () => {
    // Picking the newest would let a `pass` be appended after a `fail`.
    const selection = selectVerdictComment(
      [
        comment(verdictBody(HEAD, '{"verdict":"fail"}')),
        comment(verdictBody(HEAD, '{"verdict":"pass"}')),
      ],
      HEAD,
    );
    expect(selection).toEqual({ count: 2, outcome: 'duplicate' });
  });

  it('returns the single verdict naming this head', () => {
    const wanted = comment(
      verdictBody(HEAD, '{}'),
      'https://example.test/wanted',
    );
    const selection = selectVerdictComment(
      [comment(verdictBody(OTHER, '{}')), wanted],
      HEAD,
    );
    expect(selection.outcome).toBe('one');
    expect(selection.entry.comment.html_url).toBe(
      'https://example.test/wanted',
    );
  });
});

describe('readVerdictDocument', () => {
  it('parses the document out of the fenced block', () => {
    const { document, errors } = readVerdictDocument(
      verdictBody(HEAD, '{"verdict":"pass"}'),
    );
    expect(errors).toBeUndefined();
    expect(document).toEqual({ verdict: 'pass' });
  });

  it('reports truncated JSON rather than throwing', () => {
    const { document, errors } = readVerdictDocument(
      verdictBody(HEAD, '{"verdict":"pa'),
    );
    expect(document).toBeUndefined();
    expect(errors[0]).toContain('not parseable JSON');
  });

  it('refuses a JSON array or scalar — a verdict is an object', () => {
    expect(readVerdictDocument(verdictBody(HEAD, '[]')).errors[0]).toContain(
      'not a JSON object',
    );
    expect(
      readVerdictDocument(verdictBody(HEAD, '"pass"')).errors[0],
    ).toContain('not a JSON object');
    expect(readVerdictDocument(verdictBody(HEAD, 'null')).errors[0]).toContain(
      'not a JSON object',
    );
  });

  it('reports a missing json block', () => {
    expect(
      readVerdictDocument(`Agent-review verdict: ${HEAD}\n\npass, all good\n`)
        .errors[0],
    ).toContain('no fenced `json` block');
  });

  it('refuses a body above the size cap before parsing it', () => {
    const padding = 'x'.repeat(MAX_VERDICT_BODY_BYTES);
    const { document, errors } = readVerdictDocument(
      `${verdictBody(HEAD, '{"verdict":"pass"}')}${padding}`,
    );
    expect(document).toBeUndefined();
    expect(errors[0]).toContain('cap');
  });
});
