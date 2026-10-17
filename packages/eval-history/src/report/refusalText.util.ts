import type { Refusal } from './report.types.ts';

export const refusalText = ({ a, b, reason }: Refusal) =>
  reason === 'model-changed'
    ? `Run A used \`${a.modelId ?? 'no model'}\` and run B used \`${b.modelId ?? 'no model'}\`. A pass rate measures the model as much as the inputs, so a difference between two models would be blamed on whichever hash changed. Pass \`--allow-model-change\` to compare them anyway; the model is then listed among the changes.`
    : `Run A is from the ${a.suite} suite and run B from the ${b.suite} suite. Only runs of one suite share tasks to compare.`;
