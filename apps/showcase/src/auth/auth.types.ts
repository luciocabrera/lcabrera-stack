export type AuthClaims = {
  readonly exp: number;
  readonly iat: number;
  readonly jti: string;
  readonly sub: string;
};

export type DemoCredential = {
  readonly email: string;
  readonly secretHash: string;
};
