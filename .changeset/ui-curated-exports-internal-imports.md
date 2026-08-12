---
'@lcabrera/ui': minor
---

Make the package resolvable, and give it a deliberate public surface.

**The package could not be imported.** Its `exports` map carried eight wildcards
(`./components/*`, `./contexts/*`, `./hooks/*`, `./routing/*`, `./types/*`,
`./utils/*`, `./entry/*`, `./design-system/*`), and a wildcard target is not a
file: `./components/*` → `./src/components/*` maps `components/Button` to a
_directory_, and `components/Table/Table.types` to a path with no `.ts` on it.
`exports` resolution does no extension search and no directory-index lookup, so
neither resolves. Because the package ships source, its own files self-referenced
through that map — so importing even the bare entry produced 105 unresolved
modules from inside the package.

**Internals now resolve through `#ui/*`**, declared in the new `imports` field.
A `#` specifier is package-internal by specification, so it is invisible to you
and cannot become accidental public API.

**`exports` now names every public subpath explicitly**, each mapped to a
concrete file, with no wildcard. If you imported a path that is not listed, it
never resolved for you in the first place — this cannot break a working import.
The `api-surface` snapshot went from 19 tracked subpaths to 61 as a result.

**One change to your build config**, and it is a removal. The StyleX plugin no
longer needs the alias the README used to prescribe:

```diff
- stylex.vite({
-   aliases: { '@lcabrera/ui/*': [`${uiSrc}*`] },
-   useCSSLayers: true,
- }),
+ stylex.vite({ useCSSLayers: true }),
```

The alias existed to paper over the broken map; `#ui/*` resolves through the
package's own manifest instead. Everything else about consuming the package is
unchanged — you still compile its source and still run the StyleX plugin over it.
