import { decodeSrgbChannel } from './decodeSrgbChannel.util';

const HEX_COLOR = /^#(?:[\da-f]{6}|[\da-f]{8})$/iu;

export const hexToLinearSrgb = (value: string) => {
  if (!HEX_COLOR.test(value)) {
    throw new Error(`Unsupported colour value ${value}`);
  }

  const readByte = (start: number) =>
    Number.parseInt(value.slice(start, start + 2), 16) / 255;
  const readChannel = (start: number) => decodeSrgbChannel(readByte(start));

  return {
    alpha: value.length === 9 ? readByte(7) : 1,
    rgb: [readChannel(1), readChannel(3), readChannel(5)] as const,
  };
};
