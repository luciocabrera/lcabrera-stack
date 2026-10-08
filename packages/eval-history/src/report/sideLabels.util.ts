type LabelledRun = {
  readonly branch: string;
  readonly gitSha: string;
};

type SideLabelsArgs = {
  readonly a: LabelledRun;
  readonly b: LabelledRun;
};

const SHORT_SHA = 7;

const withSha = ({ branch, gitSha }: LabelledRun) =>
  `${branch}@${gitSha.slice(0, SHORT_SHA)}`;

export const sideLabels = ({ a, b }: SideLabelsArgs) =>
  a.branch === b.branch
    ? { a: withSha(a), b: withSha(b) }
    : { a: a.branch, b: b.branch };
