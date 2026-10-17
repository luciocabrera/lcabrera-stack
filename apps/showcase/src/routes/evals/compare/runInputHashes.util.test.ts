import { describe, expect, it } from 'vite-plus/test';

import { runInputHashes } from './runInputHashes.util';

describe('runInputHashes', () => {
  it('names each input a whole run shares', () => {
    expect(
      runInputHashes({
        catalogHash: undefined,
        harnessVersion: 'abc',
        modelId: 'model-a',
        sdkVersion: '1.0.0',
      }),
    ).toEqual({
      harness: 'abc',
      model: 'model-a',
      'SDK version': '1.0.0',
      'skill catalog': undefined,
    });
  });
});
