import { timingSafeEqual } from 'node:crypto';

type TimingSafeStringEqualArgs = {
  readonly a: string;
  readonly b: string;
};

export const timingSafeStringEqual = ({ a, b }: TimingSafeStringEqualArgs) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return bufferA.length === bufferB.length
    ? timingSafeEqual(bufferA, bufferB)
    : false;
};
