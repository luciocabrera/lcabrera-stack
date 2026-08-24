export const parseCookies = (cookieHeader: string) => {
  const cookies: Record<string, string> = {};

  for (const cookie of cookieHeader.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  }

  return cookies;
};
