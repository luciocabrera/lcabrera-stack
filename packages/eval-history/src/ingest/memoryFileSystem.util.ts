import path from 'node:path';

import { missingPathError } from './missingPathError.util.ts';

export const memoryFileSystem = (files: Readonly<Record<string, string>>) => {
  const names = Object.keys(files);
  const under = (directory: string) =>
    names.filter((name) => name.startsWith(`${directory}/`));
  const isFile = (target: string) => Object.hasOwn(files, target);

  return {
    readdir: (directory: string) =>
      Promise.resolve(
        under(directory).map((name) => ({
          isFile: () => true,
          name: path.posix.basename(name),
          parentPath: path.posix.dirname(name),
        })),
      ),
    readFile: (file: string) => {
      const text = files[file];

      return text === undefined
        ? Promise.reject(missingPathError(file))
        : Promise.resolve(new TextEncoder().encode(text));
    },
    stat: (target: string) =>
      isFile(target) || under(target).length > 0
        ? Promise.resolve({ isFile: () => isFile(target) })
        : Promise.reject(missingPathError(target)),
  };
};
