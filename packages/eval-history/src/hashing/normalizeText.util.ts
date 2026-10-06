const BYTE_ORDER_MARK = '﻿';

export const normalizeText = (input: string | Uint8Array) => {
  const text =
    typeof input === 'string' ? input : new TextDecoder('utf-8').decode(input);
  const withoutBom = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;

  return `${withoutBom.replaceAll(/\r\n?/gu, '\n').replace(/\n+$/u, '')}\n`;
};
