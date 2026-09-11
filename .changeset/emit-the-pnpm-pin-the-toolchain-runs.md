---
'@lcabrera/devkit': patch
---

`create` now pins `pnpm@12.3.4` in the root manifest it writes, the release the
rest of the toolchain is verified against; it wrote a pnpm one major behind. The
Node and pnpm pins it emits are now held to the toolchain's own by test, so a
future refresh cannot leave either behind.
