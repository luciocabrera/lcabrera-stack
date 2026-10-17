type TaskVerdictArgs = {
  readonly k: number | undefined;
  readonly n: number | undefined;
};

export const taskVerdict = ({ k, n }: TaskVerdictArgs) => {
  if (n === undefined || k === undefined) {
    return 'absent' as const;
  }

  if (n === 0) {
    return 'unscored' as const;
  }

  if (k === n) {
    return 'pass' as const;
  }

  return k === 0 ? ('fail' as const) : ('mixed' as const);
};
