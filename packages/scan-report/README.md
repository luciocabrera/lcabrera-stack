# @lcabrera/scan-report

Deterministic code-quality scanners that all emit **one** report shape. Point
one at a directory and it writes three files: the tool's verbatim output, a
machine-readable `report.json`, and a human-readable `report.md`.

- **[SCHEMA_V1.md](SCHEMA_V1.md)** — the canonical report contract
- **[REPORT_JSON_CONTRACT.md](REPORT_JSON_CONTRACT.md)** — the `report.json` shape a consumer parses

Both ship in the tarball, so the contract you are producing is readable from
`node_modules`.

## Install

```bash
npm install --save-dev @lcabrera/scan-report
```

`oxlint`, `eslint` and `fallow` are resolved from the installing repository —
each scanner degrades to a clean 0-findings report when its tool or config is
absent, so nothing here forces you to adopt all three.

## Run

| Command              | Scans with                                                  |
| -------------------- | ----------------------------------------------------------- |
| `scan-report-oxlint` | oxlint (via `vp lint`, or `npx oxlint` on a target)         |
| `scan-report-eslint` | the flat-config eslint pass                                 |
| `scan-report-fallow` | the fallow CLI                                              |
| `scan-report-ingest` | nothing — forwards a finished run to your ingestion command |

Every scanner takes the same flags:

| Flag                         | Meaning                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `<scope>` or `--scope=<rel>` | subdirectory to scan, relative to the repository (default `.`)                     |
| `--target=<abs>`             | scan an arbitrary project outside this repository, which needs none of its tooling |
| `--output-dir=<dir>`         | where the three artifacts land (default `<repo>/.tmp/<scanner>/<timestamp>/`)      |
| `--skip-ingest`              | write the artifacts and stop                                                       |

```bash
npx scan-report-oxlint packages/ui
npx scan-report-fallow --target=/srv/checkouts/some-app --scope=.
```

## Persisting a run

The package stores nothing itself. To persist, configure a command in
`scan-report.config.json` at your repository root:

```jsonc
{
  "ingest": {
    "command": "node",
    "args": ["./tools/ingest.mjs"],
    // Loaded and merged into the command's environment; a variable already in
    // the environment wins, matching node's own --env-file.
    "envFiles": ["docker/local/.env"],
    // Working directory for the command, relative to the repository root.
    "cwd": ".",
  },
}
```

or with environment variables, which take precedence over the file:

| Variable                       | Meaning                                             |
| ------------------------------ | --------------------------------------------------- |
| `SCAN_REPORT_INGEST_COMMAND`   | the executable                                      |
| `SCAN_REPORT_INGEST_ARGS`      | leading arguments — comma-separated or a JSON array |
| `SCAN_REPORT_INGEST_ENV_FILES` | comma-separated env files                           |
| `SCAN_REPORT_INGEST_CWD`       | working directory                                   |
| `SCAN_REPORT_CONFIG`           | an alternative path to the config file              |
| `SCAN_REPORT_HOST_ROOT`        | override the detected repository root               |

The command is invoked with the configured arguments followed by
`--skill=<scanner> --run-dir=<dir> --local-path=<git root> --scope-type=folder
--scope-value=<scope> --raw-json=<file>`.

**Configure nothing and nothing breaks.** Each run says
`Ingestion skipped: no ingestion command is configured …` and exits 0. A
_configured_ command that fails is the opposite: it prints `Ingestion FAILED`
and exits non-zero, because a persistence path that used to work and stopped is
not a normal state. The report artifacts are written and complete in both cases.

## Programmatic use

`@lcabrera/scan-report/finding-templates` and
`@lcabrera/scan-report/deterministic-scan` expose the per-rule fix wording and
`makeFindingId`, so a downstream consumer can re-derive the same finding
identities from a raw artifact instead of copying the strings.

## License

MIT
