type SignedChangeArgs = {
  readonly after: number | undefined;
  readonly before: number | undefined;
  readonly format: (magnitude: number) => string;
};

export const signedChange = ({ after, before, format }: SignedChangeArgs) => {
  if (after === undefined || before === undefined) {
    return 'not comparable';
  }

  if (after === before) {
    return 'no change';
  }

  return `${after > before ? '+' : '-'}${format(Math.abs(after - before))}`;
};
