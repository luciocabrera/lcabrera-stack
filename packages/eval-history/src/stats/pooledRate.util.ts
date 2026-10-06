import type { RegressionConfig, TaskTrials } from './stats.types.ts';

import { countOutcomes } from './countOutcomes.util.ts';
import { wilson } from './wilson.util.ts';

type PooledRateArgs = {
  readonly config: Pick<RegressionConfig, 'minTrialsForRate' | 'z'>;
  readonly tasks: readonly TaskTrials[];
};

export const pooledRate = ({ config, tasks }: PooledRateArgs) => {
  const { k, n } = countOutcomes(tasks.flatMap(({ outcomes }) => outcomes));

  return wilson({ k, minN: config.minTrialsForRate, n, z: config.z });
};
