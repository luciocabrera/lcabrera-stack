---
'@lcabrera/ui': patch
---

The tooltip arrow now carries the tooltip's own border. It was a bare filled
square, so the surface outline stopped at the box edge and the tip below it read
as a detached triangle.

Each placement borders only the two edges that end up outside the tooltip body;
the two buried under it stay borderless so no seam shows through.
