/**
 * The top-level keys a Vite+ config file declares, read from its syntax tree
 * rather than its text, so a shorthand, quoted, spread or helper-wrapped key is
 * found and a commented-out or nested one is not. Pure; `./lint-plugins.mjs`
 * re-exports `configsDeclaringKeys` for `../verify-lint-plugins.mjs`.
 */
import { ts } from 'ts-morph';

const isWrapper = (node) =>
  ts.isParenthesizedExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isTypeAssertionExpression(node) ||
  ts.isAwaitExpression(node);

const unwrap = (node) => (isWrapper(node) ? unwrap(node.expression) : node);

const returnStatements = (node) =>
  node.getChildren().flatMap((child) => {
    if (ts.isFunctionLike(child)) return [];
    if (!ts.isReturnStatement(child)) return returnStatements(child);
    return child.expression === undefined ? [] : [child.expression];
  });

const returnedExpressions = (fn) => {
  if (fn.body === undefined) return [];
  return ts.isBlock(fn.body) ? returnStatements(fn.body) : [fn.body];
};

const isFallbackOperator = (token) =>
  token.kind === ts.SyntaxKind.BarBarToken ||
  token.kind === ts.SyntaxKind.QuestionQuestionToken;

const nestedExpressions = (expression) => {
  if (ts.isCallExpression(expression))
    return [expression.expression, ...expression.arguments];
  if (ts.isConditionalExpression(expression))
    return [expression.whenTrue, expression.whenFalse];
  if (ts.isBinaryExpression(expression))
    return isFallbackOperator(expression.operatorToken)
      ? [expression.left, expression.right]
      : [];
  return ts.isFunctionLike(expression) ? returnedExpressions(expression) : [];
};

const descendants = (node) =>
  node.getChildren().flatMap((child) => [child, ...descendants(child)]);

const isAssignmentToIdentifier = (node) =>
  ts.isBinaryExpression(node) &&
  node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
  ts.isIdentifier(unwrap(node.left));

const assignedValues = (sourceFile, checker) =>
  descendants(sourceFile)
    .filter((node) => isAssignmentToIdentifier(node))
    .reduce((values, node) => {
      const symbol = checker.getSymbolAtLocation(unwrap(node.left));
      if (symbol !== undefined)
        values.set(symbol, [...(values.get(symbol) ?? []), node.right]);
      return values;
    }, new Map());

const declaredValue = (declaration) => {
  if (ts.isFunctionDeclaration(declaration)) return [declaration];
  return ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined
    ? [declaration.initializer]
    : [];
};

const boundValues = (symbol, scope) => [
  ...(symbol.declarations ?? []).flatMap((declaration) =>
    declaredValue(declaration),
  ),
  ...(scope.assigned.get(symbol) ?? []),
];

const resolvedObjectLiterals = (identifier, scope, seen) => {
  const symbol = scope.checker.getSymbolAtLocation(identifier);
  if (symbol === undefined || seen.has(symbol)) return [];
  const next = new Set([...seen, symbol]);
  return boundValues(symbol, scope).flatMap((value) =>
    objectLiterals(value, scope, next),
  );
};

const objectLiterals = (node, scope, seen) => {
  const expression = unwrap(node);
  if (ts.isObjectLiteralExpression(expression)) return [expression];
  if (ts.isIdentifier(expression))
    return resolvedObjectLiterals(expression, scope, seen);
  return nestedExpressions(expression).flatMap((nested) =>
    objectLiterals(nested, scope, seen),
  );
};

const isLiteralName = (name) =>
  ts.isIdentifier(name) ||
  ts.isStringLiteral(name) ||
  ts.isNoSubstitutionTemplateLiteral(name);

const propertyName = (name) => {
  if (ts.isComputedPropertyName(name))
    return propertyName(unwrap(name.expression));
  return isLiteralName(name) ? name.text : undefined;
};

const topLevelKeys = (object, scope, visited) =>
  object.properties.flatMap((property) =>
    ts.isSpreadAssignment(property)
      ? objectLiterals(property.expression, scope, new Set())
          .filter((spread) => !visited.has(spread))
          .flatMap((spread) =>
            topLevelKeys(spread, scope, new Set([...visited, spread])),
          )
      : [propertyName(property.name)],
  );

const namedImports = (statement) => {
  const bindings = statement.importClause?.namedBindings;
  return bindings !== undefined && ts.isNamedImports(bindings)
    ? bindings.elements
    : [];
};

const defineConfigNames = (sourceFile) =>
  new Set([
    'defineConfig',
    ...sourceFile.statements
      .filter((statement) => ts.isImportDeclaration(statement))
      .flatMap((statement) => namedImports(statement))
      .filter(
        (specifier) =>
          (specifier.propertyName ?? specifier.name).text === 'defineConfig',
      )
      .map((specifier) => specifier.name.text),
  ]);

const isDefineConfigCallee = (callee, names) =>
  (ts.isPropertyAccessExpression(callee) &&
    callee.name.text === 'defineConfig') ||
  (ts.isIdentifier(callee) && names.has(callee.text));

const isDefineConfigCall = (node, names) =>
  ts.isCallExpression(node) &&
  isDefineConfigCallee(unwrap(node.expression), names);

const isDefaultExportedFunction = (node) =>
  ts.isFunctionDeclaration(node) &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.ExportDefault) ===
    ts.ModifierFlags.ExportDefault;

const ownRoots = (node, names) => {
  if (isDefineConfigCall(node, names)) return [...node.arguments];
  if (ts.isExportAssignment(node))
    return node.isExportEquals ? [] : [node.expression];
  return isDefaultExportedFunction(node) ? [node] : [];
};

const configRoots = (sourceFile, names) =>
  [sourceFile, ...descendants(sourceFile)].flatMap((node) =>
    ownRoots(node, names),
  );

const COMPILER_OPTIONS = { noLib: true, noResolve: true, types: [] };

const checkerFor = (sourceFile) => {
  const host = {
    ...ts.createCompilerHost(COMPILER_OPTIONS),
    fileExists: (name) => name === sourceFile.fileName,
    getSourceFile: (name) =>
      name === sourceFile.fileName ? sourceFile : undefined,
    readFile: () => undefined,
  };
  return ts
    .createProgram([sourceFile.fileName], COMPILER_OPTIONS, host)
    .getTypeChecker();
};

const declaredConfigKeys = (path, text) => {
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const checker = checkerFor(sourceFile);
  const scope = { assigned: assignedValues(sourceFile, checker), checker };
  return new Set(
    configRoots(sourceFile, defineConfigNames(sourceFile))
      .flatMap((root) => objectLiterals(root, scope, new Set()))
      .flatMap((object) => topLevelKeys(object, scope, new Set([object]))),
  );
};

export const configsDeclaringKeys = (files, keys) =>
  files
    .filter(({ path }) => path !== 'vite.config.ts')
    .flatMap(({ path, text }) => {
      const declared = declaredConfigKeys(path, text);
      return keys
        .filter((key) => declared.has(key))
        .map((key) => ({ key, path }));
    });
