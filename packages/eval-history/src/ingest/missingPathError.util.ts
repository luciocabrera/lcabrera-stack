export const missingPathError = (target: string) =>
  Object.assign(new Error(`ENOENT: no such file or directory, ${target}`), {
    code: 'ENOENT',
  });
