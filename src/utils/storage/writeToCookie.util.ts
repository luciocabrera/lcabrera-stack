type WriteToCookieArgs = {
  key: string;
  value: string;
};

/**
 * Write to cookie (expires in 1 year)
 */
export const writeToCookie = ({ key, value }: WriteToCookieArgs): void => {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const cookieValue = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  // Using assignment is required for cookie setting
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = cookieValue;
};
