type AuthorOfArgs = {
  readonly email: string | undefined;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly user: string;
};

export const authorOf = ({ email, env, user }: AuthorOfArgs) =>
  env.GITHUB_ACTOR || email?.split('@', 1)[0] || user;
