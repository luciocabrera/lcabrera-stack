/**
 * Turns a file `<input>` into a folder picker by setting the non-standard
 * `webkitdirectory` attribute on the given node. Used as a React ref callback
 * (runs after commit, before the user can open the picker): the attribute is
 * absent from @types/react, so it is applied imperatively to the element
 * rather than as a typed JSX prop. A null node (ref detach on unmount) is a
 * no-op.
 */
export const applyWebkitDirectory = (node: HTMLInputElement | null) => {
  node?.setAttribute('webkitdirectory', '');
};
