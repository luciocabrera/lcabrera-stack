/**
 * Build the cookie string (expires in 1 year)
 */
export const buildCookieString = ({
  key,
  value,
}: {
  readonly key: string;
  readonly value: string;
}): string => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  return `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};
