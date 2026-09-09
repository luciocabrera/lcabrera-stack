---
'@lcabrera/devkit': patch
---

`create` writes the root manifest in the order the formatter sorts a manifest
into, so the repository it leaves passes its own `format:check` before anything
has been edited in it. The keys were previously written alphabetically, which
made the first task a consumer runs fail on the file `create` had just written.

The order cannot be delegated to the formatter — `create` runs before anything
is installed in the target, so there is none there to call — and it is now
stated in one place rather than emerging from object literals in two modules. A
field with no place in it is refused rather than written somewhere.
