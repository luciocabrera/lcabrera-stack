import { buildCookieString } from '#ui/utils/storage/buildCookieString.util';

type BuildSetCookieHeadersArgs = {
  readonly entries: readonly CookiePair[];
  readonly expiresAt: Date;
};

type CookiePair = {
  readonly key: string;
  readonly value: string;
};

export const buildSetCookieHeaders = ({
  entries,
  expiresAt,
}: BuildSetCookieHeadersArgs) =>
  entries
    .filter(({ key, value }) => key !== '' && value !== '')
    .reduce((headers, { key, value }) => {
      headers.append(
        'Set-Cookie',
        buildCookieString({ expiresAt, key, value }),
      );
      return headers;
    }, new Headers());
