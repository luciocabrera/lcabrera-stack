---
'@lcabrera/repo-standards': patch
---

`repo-plan-release` now counts a version as released when its `<name>@<version>` git tag exists, whatever the registry answers. The tag is created only after npm accepts the publish, while npm's CDN can serve an older packument for minutes afterwards. A run started in that window used to plan the same versions again, and its publish failed with 409.
