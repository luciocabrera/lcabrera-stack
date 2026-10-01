---
'@lcabrera/devkit': minor
---

A higher rung now supersedes a lower rung's file. Where two groups a profile holds map onto one target path, `sync` plans one entry, the higher rung's, so moving a tree up a rung updates an untouched file instead of writing both and reporting the loser on every run. A recorded file that no rung of this version ships any more now retires. If unedited, it is deleted (`retired`). If edited, it is left in place and reported (`kept`). In both cases its record leaves the manifest, and `doctor --check` fails while a retire is pending. A rung can also declare asset paths it retires (`RUNG_RETIREMENTS` in `config.mjs`, read through `retiredAssetsFor`). A declaration applies only while the profile includes that rung, so a run at a lower profile leaves the file alone. Running at a lower profile retires nothing a higher rung still ships.
