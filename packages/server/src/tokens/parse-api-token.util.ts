export type ParsedApiToken = {
  readonly secret: string;
  readonly tokenId: string;
};

type ParseApiTokenArgs = {
  readonly plaintext: string;
  readonly prefix?: string;
};

export const parseApiToken = ({
  plaintext,
  prefix = '',
}: ParseApiTokenArgs): ParsedApiToken | undefined => {
  if (!plaintext.startsWith(prefix)) {
    return undefined;
  }

  const body = plaintext.slice(prefix.length);
  const separatorIndex = body.indexOf('.');
  if (separatorIndex <= 0) {
    return undefined;
  }

  const secret = body.slice(separatorIndex + 1);
  if (secret.length === 0) {
    return undefined;
  }

  return {
    secret,
    tokenId: body.slice(0, separatorIndex),
  };
};
