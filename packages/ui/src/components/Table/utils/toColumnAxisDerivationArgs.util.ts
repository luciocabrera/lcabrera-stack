import { collectColumnAxisEmitted } from './collectColumnAxisEmitted.util';

type ToColumnAxisDerivationArgs = {
  readonly columnAxis?: string;
  readonly data?: readonly unknown[];
};

export const toColumnAxisDerivationArgs = ({
  columnAxis,
  data,
}: ToColumnAxisDerivationArgs) =>
  columnAxis === undefined
    ? {}
    : {
        columnAxis,
        columnAxisEmitted:
          data === undefined ? [] : collectColumnAxisEmitted(data),
      };
