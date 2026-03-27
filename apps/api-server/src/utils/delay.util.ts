type DelayArgs = {
  readonly milliseconds: number;
};

/**
 * Sleep helper used for intentional API latency in development/testing.
 */
export const delay = ({ milliseconds }: DelayArgs): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
