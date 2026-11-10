import type { ScoredVerdict } from './EvalsAdjudications.types';

import { accuracyLabel } from './accuracyLabel.util';
import { accuracyTally } from './accuracyTally.util';

export const promptAccuracy = (verdicts: readonly ScoredVerdict[]) =>
  [
    ...new Set(
      verdicts.map(({ agentPromptHash, role }) => `${role}/${agentPromptHash}`),
    ),
  ]
    .map((id) => {
      const prompted = verdicts.filter(
        ({ agentPromptHash, role }) => `${role}/${agentPromptHash}` === id,
      );
      const [first] = prompted.toSorted(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      );

      return {
        accuracy: accuracyLabel(accuracyTally(prompted)),
        firstSeen: first?.createdAt.toISOString().slice(0, 10) ?? '',
        id,
        prompt: first?.agentPromptHash.slice(0, 12) ?? '',
        role: first?.role ?? 'judge',
        verdicts: prompted.length,
      };
    })
    .toSorted(
      (left, right) =>
        left.role.localeCompare(right.role) ||
        left.firstSeen.localeCompare(right.firstSeen) ||
        left.id.localeCompare(right.id),
    );
