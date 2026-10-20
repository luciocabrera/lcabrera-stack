---
'@lcabrera/devkit': patch
---

The `full` template's orders loader test no longer clears its mocked reader in a `beforeEach` hook. The Vitest release the template's `test` catalog pins clears every mock's call history before each test by default (`clearMocks: true`), and the template does not turn that off, so the hook repeated what the runner already does.
