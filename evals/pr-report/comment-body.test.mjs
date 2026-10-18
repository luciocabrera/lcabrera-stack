import { describe, expect, it } from 'vite-plus/test';

import {
  COMMENT_MARKER,
  commentBody,
  newestEnvelope,
  reportCommentOf,
  selectionLine,
  selectionOf,
  upsertOptionProblems,
  upsertRequest,
} from './comment-body.mjs';

const bot = (id, body) => ({ body, id, user: { type: 'Bot' } });

const candidate = (file, status, startedAt) => ({
  envelope: { run: { started_at: startedAt, status } },
  file,
});

describe('commentBody', () => {
  it('starts with the marker the upsert finds it by', () => {
    const body = commentBody(['One.', 'Two.']);
    expect(body.startsWith(`${COMMENT_MARKER}\n`)).toBe(true);
    expect(body).toBe(`${COMMENT_MARKER}\n\n## Eval report\n\nOne.\n\nTwo.\n`);
  });
});

describe('selectionLine', () => {
  it('names the skills that ran, or says why every skill ran', () => {
    expect(
      selectionLine({ scope: 'some', skills: ['react-19', 'unslop'] }),
    ).toContain('`react-19`, `unslop`');
    expect(selectionLine({ scope: 'all', skills: [] })).toContain(
      "Ran every skill's trigger tasks",
    );
  });
});

describe('reportCommentOf', () => {
  it('finds the marked bot comment on any page', () => {
    const pages = [
      [
        bot(1, 'Coverage'),
        { body: COMMENT_MARKER, id: 2, user: { type: 'User' } },
      ],
      [
        bot(3, `${COMMENT_MARKER}\n\nold report`),
        bot(4, `${COMMENT_MARKER}\n\nlater`),
      ],
    ];
    expect(reportCommentOf(pages)?.id).toBe(3);
  });

  it('finds nothing on a pull request without one', () => {
    expect(
      reportCommentOf([[bot(1, `Quoting ${COMMENT_MARKER}`)], []]),
    ).toBeUndefined();
  });
});

describe('upsertRequest', () => {
  const args = { bodyFile: 'body.md', pr: '7', repo: 'o/r' };

  it('posts when no report comment exists', () => {
    expect(upsertRequest({ ...args, existing: undefined }).args).toStrictEqual([
      'api',
      '--method',
      'POST',
      'repos/o/r/issues/7/comments',
      '--field',
      'body=@body.md',
    ]);
  });

  it('edits the existing report comment in place', () => {
    expect(upsertRequest({ ...args, existing: { id: 42 } }).args).toStrictEqual(
      [
        'api',
        '--method',
        'PATCH',
        'repos/o/r/issues/comments/42',
        '--field',
        'body=@body.md',
      ],
    );
  });
});

describe('newestEnvelope', () => {
  const candidates = [
    candidate('old.json', 'complete', '2026-10-01T00:00:00.000Z'),
    candidate('new.json', 'partial', '2026-10-03T00:00:00.000Z'),
    candidate('mid.json', 'complete', '2026-10-02T00:00:00.000Z'),
  ];

  it('picks the newest run, or the newest complete one', () => {
    expect(newestEnvelope({ candidates, completeOnly: false })?.file).toBe(
      'new.json',
    );
    expect(newestEnvelope({ candidates, completeOnly: true })?.file).toBe(
      'mid.json',
    );
    expect(
      newestEnvelope({ candidates: [], completeOnly: true }),
    ).toBeUndefined();
  });
});

describe('selectionOf', () => {
  it('keeps the skills only for a scope that names some', () => {
    expect(selectionOf({ scope: 'some', skill: ['unslop'] })).toStrictEqual({
      scope: 'some',
      skills: ['unslop'],
    });
    expect(selectionOf({ scope: 'all', skill: ['unslop'] })).toStrictEqual({
      scope: 'all',
      skills: [],
    });
  });

  it('refuses an unknown scope and a some with no skill', () => {
    expect(() => selectionOf({ scope: 'out' })).toThrow('--scope must be');
    expect(() => selectionOf({ scope: 'some', skill: [] })).toThrow(
      'at least one --skill',
    );
  });
});

describe('upsertOptionProblems', () => {
  it('names every option that is missing or malformed', () => {
    expect(
      upsertOptionProblems({ pr: '0', repo: 'owner/name/extra' }),
    ).toStrictEqual([
      'pass --repo <owner/name>',
      'pass --pr <number>',
      'pass --body-file <path>',
    ]);
    expect(
      upsertOptionProblems({ 'body-file': 'b.md', pr: '12', repo: 'o/r' }),
    ).toStrictEqual([]);
  });
});
