const BYTE_ORDER_MARK = '﻿';

export const normalizeText = (input: string | Uint8Array) => {
  const text =
    typeof input === 'string' ? input : new TextDecoder('utf-8').decode(input);
  const withoutBom = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;

  const lineFeeds = withoutBom.replaceAll(/\r\n?/gu, '\n');
  let end = lineFeeds.length;

  while (end > 0 && lineFeeds[end - 1] === '\n') {
    end -= 1;
  }

  return `${lineFeeds.slice(0, end)}\n`;
};
