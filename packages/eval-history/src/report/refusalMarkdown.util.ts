import type { RunComparison } from './report.types.ts';

import { sideLabels } from './sideLabels.util.ts';

type Refusal = Extract<RunComparison, { readonly kind: 'refused' }>;

const reasonText = ({ a, b, reason }: Refusal) =>
  reason === 'model-changed'
    ? `Run A used \`${a.modelId ?? 'no model'}\` and run B used \`${b.modelId ?? 'no model'}\`. A pass rate measures the model as much as the inputs, so a difference between two models would be blamed on whichever hash changed. Pass \`--allow-model-change\` to compare them anyway; the model is then listed among the changes.`
    : `Run A is from the ${a.suite} suite and run B from the ${b.suite} suite. Only runs of one suite share tasks to compare.`;

export const refusalMarkdown = (refusal: Refusal) => {
  const labels = sideLabels(refusal);

  return `### ${refusal.suite}: ${labels.b} vs ${labels.a}: not compared\n\n${reasonText(refusal)}`;
};
