import type { RunInputs } from './EvalsCompare.types';

export const runInputHashes = (run: RunInputs) => ({
  harness: run.harnessVersion,
  model: run.modelId,
  'SDK version': run.sdkVersion,
  'skill catalog': run.catalogHash,
});
