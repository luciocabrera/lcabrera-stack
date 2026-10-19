type TaskTallyArgs = {
  readonly k: number | undefined;
  readonly n: number | undefined;
  readonly outcomes: readonly string[] | undefined;
};

export const taskTally = ({ k, n, outcomes }: TaskTallyArgs) => {
  if (k === undefined || n === undefined) {
    return 'not run';
  }

  const unscored = (outcomes?.length ?? n) - n;

  return unscored > 0
    ? `${String(k)}/${String(n)}, ${String(unscored)} not scored`
    : `${String(k)}/${String(n)}`;
};
