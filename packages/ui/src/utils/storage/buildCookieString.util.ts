type BuildCookieStringArgs = {
  readonly expiresAt: Date;
  readonly key: string;
  readonly value: string;
};

export const buildCookieString = ({
  expiresAt,
  key,
  value,
}: BuildCookieStringArgs) =>
  `${key}=${encodeURIComponent(value)}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax`;
