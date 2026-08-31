/**
 * Escaping for the data carried by a GitHub Actions workflow command.
 *
 * A workflow command occupies one line, so `%`, CR and LF are structure to the
 * runner rather than text: an unescaped newline ends the annotation, and
 * whatever follows is read as the next command. A caller passing a value of a
 * validated shape — a package name, a version — has nothing to escape; a caught
 * error can be any thrown value, and does.
 *
 * https://docs.github.com/actions/reference/workflow-commands-for-github-actions
 *
 * `%` is replaced first, or the escapes introduced after it are escaped in
 * turn.
 */

export const annotationData = (message) =>
  String(message)
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');
