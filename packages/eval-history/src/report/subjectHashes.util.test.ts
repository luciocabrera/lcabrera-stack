import { describe, expect, it } from 'vite-plus/test';

import { subjectHashes } from './subjectHashes.util.ts';

describe('subjectHashes', () => {
  it('keys each content hash by the subject kind and name', () => {
    expect(
      subjectHashes({
        subjects: [
          { contentHash: 'c1', kind: 'skill', name: 'react-19' },
          { contentHash: 'c2', kind: 'rule', name: 'typescript' },
        ],
      }),
    ).toEqual([
      ['content:skill/react-19', 'c1'],
      ['content:rule/typescript', 'c2'],
    ]);
  });
});
