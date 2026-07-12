type BuildCookieStringArgs = {
  /** Expiry timestamp — injected by the caller so this util stays pure. */
  readonly expiresAt: Date;
  readonly key: string;
  readonly value: string;
};

/**
 * Build a cookie string with path=/ and SameSite=Lax. Pure: the expiry date
 * is supplied by the effectful write service that owns the clock.
 */
export const buildCookieString = ({
  expiresAt,
  key,
  value,
}: BuildCookieStringArgs) =>
  `${key}=${encodeURIComponent(value)}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax`;
