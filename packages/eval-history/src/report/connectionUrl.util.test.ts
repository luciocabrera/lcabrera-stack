import { describe, expect, it } from 'vite-plus/test';

import { connectionUrl } from './connectionUrl.util.ts';
import { ReportInputError } from './reportInput.error.ts';

describe('connectionUrl', () => {
  it('returns a postgres URL', () => {
    expect(connectionUrl('postgres://evals@localhost:5434/eval_history')).toBe(
      'postgres://evals@localhost:5434/eval_history',
    );
  });

  it('says an unset variable leaves only envelope files to compare', () => {
    expect(() => connectionUrl(undefined)).toThrow(
      /pass two envelope files to --a and --b/u,
    );
  });

  it('rejects a URL of another protocol without echoing it', () => {
    expect(() => connectionUrl('mysql://user:secret@host/db')).toThrow(
      ReportInputError,
    );
    expect(() => connectionUrl('mysql://user:secret@host/db')).not.toThrow(
      /secret/u,
    );
  });
});
