import { describe, expect, it } from 'vite-plus/test';

import { collectToolInputPaths } from './collectToolInputPaths.util.ts';

describe('collectToolInputPaths', () => {
  it('extracts Read file_path', () => {
    expect(
      collectToolInputPaths({
        toolInput: { file_path: '/repo/docker/local/.env' },
        toolName: 'Read',
      }),
    ).toEqual(['/repo/docker/local/.env']);
  });

  it('extracts Glob pattern and path with wildcards stripped', () => {
    expect(
      collectToolInputPaths({
        toolInput: { path: '/repo', pattern: '**/.env*' },
        toolName: 'Glob',
      }),
    ).toEqual(['/repo', '**/.env'.replaceAll('*', '')]);
  });

  it('extracts Grep glob and path but NOT its content pattern', () => {
    expect(
      collectToolInputPaths({
        toolInput: {
          glob: '*.pem',
          path: '/repo/src',
          pattern: String.raw`\.env`,
        },
        toolName: 'Grep',
      }),
    ).toEqual(['.pem', '/repo/src']);
  });

  it('tokenizes Bash commands on shell separators and equals signs', () => {
    expect(
      collectToolInputPaths({
        toolInput: {
          command:
            'node --env-file-if-exists=docker/local/.env script.ts && cat "secrets/id_rsa" | head',
        },
        toolName: 'Bash',
      }),
    ).toEqual([
      'node',
      '--env-file-if-exists',
      'docker/local/.env',
      'script.ts',
      'cat',
      'secrets/id_rsa',
      'head',
    ]);
  });

  it('yields nothing for unlisted tools and non-object input', () => {
    expect(
      collectToolInputPaths({
        toolInput: { file_path: '/x/.env' },
        toolName: 'Write',
      }),
    ).toEqual([]);
    expect(
      collectToolInputPaths({ toolInput: 'not-an-object', toolName: 'Read' }),
    ).toEqual([]);
  });
});
