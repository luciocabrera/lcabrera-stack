const DOLLAR_QUOTED_BODY = /\$(\w*)\$([\s\S]*?)\$\1\$/;

const TYPE_CAST = /::\s*(?:double\s+precision|[a-z_][\w.]*)(?:\[\])?/gi;

export const sqlWithoutTypes = (sql: string) => {
  const body = DOLLAR_QUOTED_BODY.exec(sql)?.[2] ?? sql;

  return body.replaceAll(TYPE_CAST, ' ');
};
