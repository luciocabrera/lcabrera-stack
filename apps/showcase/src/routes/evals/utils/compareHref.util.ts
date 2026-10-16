type CompareHrefArgs = {
  readonly a: string;
  readonly b: string;
};

export const compareHref = ({ a, b }: CompareHrefArgs) =>
  `/evals/compare?${new URLSearchParams({ a, b }).toString()}`;
