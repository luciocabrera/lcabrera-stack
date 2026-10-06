import path from 'node:path';

const missing = (target: string) =>
  Object.assign(new Error(`ENOENT: no such file or directory, ${target}`), {
    code: 'ENOENT',
  });

export const memoryFileSystem = (files: Readonly<Record<string, string>>) => {
  const names = Object.keys(files);
  const under = (directory: string) =>
    names.filter((name) => name.startsWith(`${directory}/`));

  return {
    readdir: async (directory: string) =>
      under(directory).map((name) => ({
        isFile: () => true,
        name: path.posix.basename(name),
        parentPath: path.posix.dirname(name),
      })),
    readFile: async (file: string) => {
      const text = files[file];

      if (text === undefined) {
        throw missing(file);
      }

      return new TextEncoder().encode(text);
    },
    stat: async (target: string) => {
      if (Object.hasOwn(files, target)) {
        return { isFile: () => true };
      }

      if (under(target).length > 0) {
        return { isFile: () => false };
      }

      throw missing(target);
    },
  };
};
