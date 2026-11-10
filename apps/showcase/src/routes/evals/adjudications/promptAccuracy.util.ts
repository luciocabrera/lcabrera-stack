import type { ScoredVerdict } from './EvalsAdjudications.types';

import { accuracyLabel } from './accuracyLabel.util';
import { accuracyTally } from './accuracyTally.util';

type PromptGroup = {
  readonly first: ScoredVerdict;
  readonly prompted: readonly ScoredVerdict[];
};

export const promptAccuracy = (verdicts: readonly ScoredVerdict[]) =>
  [
    ...verdicts
      .toSorted(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      )
      .reduce((byPrompt, verdict) => {
        const id = `${verdict.role}/${verdict.agentPromptHash}`;
        const group = byPrompt.get(id) ?? { first: verdict, prompted: [] };

        byPrompt.set(id, { ...group, prompted: [...group.prompted, verdict] });

        return byPrompt;
      }, new Map<string, PromptGroup>()),
  ]
    .map(([id, { first, prompted }]) => ({
      accuracy: accuracyLabel(accuracyTally(prompted)),
      firstSeen: first.createdAt.toISOString().slice(0, 10),
      id,
      prompt: first.agentPromptHash.slice(0, 12),
      role: first.role,
      verdicts: prompted.length,
    }))
    .toSorted(
      (left, right) =>
        left.role.localeCompare(right.role) ||
        left.firstSeen.localeCompare(right.firstSeen) ||
        left.id.localeCompare(right.id),
    );
