import { describe, expect, it } from 'vite-plus/test';

import { toHexString } from './toHexString.util';

describe('toHexString', () => {
  it('renders bytes as lowercase two-character pairs', () => {
    expect(toHexString(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBe(
      '68656c6c6f',
    );
  });

  it('pads a byte below 0x10 rather than emitting one character', () => {
    expect(toHexString(new Uint8Array([0x00, 0x0a, 0xff]))).toBe('000aff');
  });

  it('renders an empty array as an empty string', () => {
    expect(toHexString(new Uint8Array())).toBe('');
  });
});
