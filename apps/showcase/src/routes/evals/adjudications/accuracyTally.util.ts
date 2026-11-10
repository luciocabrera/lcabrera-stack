type Scored = {
  readonly isCorrect: boolean | undefined;
};

export const accuracyTally = (verdicts: readonly Scored[]) => {
  const scored = verdicts.filter(({ isCorrect }) => isCorrect !== undefined);

  return {
    correct: scored.filter(({ isCorrect }) => isCorrect).length,
    scored: scored.length,
  };
};
