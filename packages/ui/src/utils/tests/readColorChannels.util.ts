import type { ColorChannel } from './tests.types';

export const readColorChannels = (value: string) => {
  const fail = () => new TypeError(`Cannot read the channels of ${value}`);
  const readChannel = (channel: string): ColorChannel => {
    const number = Number(channel.replace(/%$/u, ''));

    if (!Number.isFinite(number)) throw fail();

    return { isPercent: channel.endsWith('%'), number };
  };
  const [colour = '', alpha, ...rest] = value
    .slice(value.indexOf('(') + 1, -1)
    .split('/');
  const [first, second, third, ...extra] = colour.split(' ').filter(Boolean);

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    extra.length > 0 ||
    rest.length > 0
  ) {
    throw fail();
  }

  const opacity =
    alpha === undefined
      ? { isPercent: false, number: 1 }
      : readChannel(alpha.trim());

  return {
    alpha: opacity.isPercent ? opacity.number / 100 : opacity.number,
    channels: [
      readChannel(first),
      readChannel(second),
      readChannel(third),
    ] as const,
  };
};
