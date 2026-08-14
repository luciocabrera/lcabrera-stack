---
'@lcabrera/scan-report': minor
---

The deterministic oxlint, ESLint and fallow scanners behind this repo's scan
skills are now a published package, `@lcabrera/scan-report`. Point one at a
directory and it writes the tool's verbatim output, a machine-readable
`report.json` and a human-readable `report.md`, all three to one contract that
ships in the tarball (`SCHEMA_V1.md`, `REPORT_JSON_CONTRACT.md`).

```bash
npx scan-report-oxlint packages/ui
npx scan-report-fallow --target=/srv/checkouts/some-app --scope=.
```

**Persistence is a command you configure, not a product it assumes.** Add an
`ingest` block to `scan-report.config.json` at your repository root (or set
`SCAN_REPORT_INGEST_COMMAND`) and every finished run is handed to it, with the
scan's skill, run directory, git root, scope and raw-artifact name appended:

```json
{
  "ingest": {
    "command": "node",
    "args": ["./tools/ingest.mjs"],
    "envFiles": ["docker/local/.env"]
  }
}
```

Configure nothing and nothing breaks — each run prints
`Ingestion skipped: no ingestion command is configured …` and exits 0. A
configured command that fails is deliberately not the same outcome: it prints
`Ingestion FAILED` and exits non-zero, because a persistence path that used to
work and stopped is not a normal state. The report artifacts are complete either
way.

`fallow` is an optional peer: `scan-report-fallow` without it writes all three
artifacts and reports `No fallow installation found under <root>` rather than
throwing. `scan-report-oxlint` and `scan-report-eslint` behave the same way when
the scanned scope has no config for their tool.

Every finding's `location_path` is relative to the scanned project's repository
root, so the scanners run `git`. It is resolved by absolute path from a fixed
directory list rather than through `PATH` — including Homebrew, Nix, MacPorts
and Git for Windows locations, with `SCAN_REPORT_GIT_BINARY` as an override —
and a scan that cannot find git says so rather than quietly reporting paths
relative to the scanned directory instead.

Nothing in the package names a repository, a workspace or a database. The
default scan scope is the whole repository, and "the repository" is derived from
where the package is installed rather than from a fixed directory depth or the
current working directory, so a runner spawned from anywhere agrees with one run
by hand.
