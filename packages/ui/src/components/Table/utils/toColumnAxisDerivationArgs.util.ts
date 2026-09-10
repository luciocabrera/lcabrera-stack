import { collectColumnAxisEmitted } from './collectColumnAxisEmitted.util';

type ToColumnAxisDerivationArgsArgs = {
  readonly columnAxis?: string;
  readonly data?: readonly unknown[];
};

export const toColumnAxisDerivationArgs = ({
  columnAxis,
  data,
}: ToColumnAxisDerivationArgsArgs) =>
  columnAxis === undefined
    ? {}
    : {
        columnAxis,
        columnAxisEmitted:
          data === undefined ? [] : collectColumnAxisEmitted(data),
      };
