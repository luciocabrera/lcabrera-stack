type AccuracyLabelArgs = {
  readonly correct: number;
  readonly scored: number;
};

export const accuracyLabel = ({ correct, scored }: AccuracyLabelArgs) =>
  scored === 0
    ? 'no true answer yet'
    : `${String(Math.round((correct / scored) * 100))}% (${String(correct)}/${String(scored)})`;
