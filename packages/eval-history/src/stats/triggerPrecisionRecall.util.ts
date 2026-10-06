import type { RegressionConfig, TriggerTrial } from './stats.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { isExcludedOutcome } from './isExcludedOutcome.util.ts';
import { wilson } from './wilson.util.ts';

type ShareArgs = {
  readonly of: readonly TriggerTrial[];
  readonly where: (trial: TriggerTrial) => boolean;
};

type TriggerPrecisionRecallArgs = {
  readonly config: Pick<RegressionConfig, 'minTrialsForRate' | 'z'>;
  readonly trials: readonly TriggerTrial[];
};

export const triggerPrecisionRecall = ({
  config,
  trials,
}: TriggerPrecisionRecallArgs) => {
  const valid = trials.filter(({ outcome }) => !isExcludedOutcome(outcome));
  const skills = [
    ...new Set(
      valid.flatMap(({ expected, invoked }) => [...expected, ...invoked]),
    ),
  ].toSorted(compareCodeUnits);
  const share = ({ of, where }: ShareArgs) =>
    wilson({
      k: of.filter((trial) => where(trial)).length,
      minN: config.minTrialsForRate,
      n: of.length,
      z: config.z,
    });

  return skills.map((skill) => {
    const expects = ({ expected }: TriggerTrial) => expected.includes(skill);
    const loads = ({ invoked }: TriggerTrial) => invoked.includes(skill);

    return {
      precision: share({
        of: valid.filter((trial) => loads(trial)),
        where: expects,
      }),
      recall: share({
        of: valid.filter((trial) => expects(trial)),
        where: loads,
      }),
      skill,
    };
  });
};
