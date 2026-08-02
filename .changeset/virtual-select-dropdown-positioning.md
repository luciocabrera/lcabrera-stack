---
'@lcabrera/ui': patch
---

Fix two `VirtualSelect` dropdown defects.

The dropdown no longer renders in the viewport's top-left corner when it is the
operator picker in the Table column-settings drawer. `customStylex` is now
composed **before** the dropdown's own positioning styles, so a consumer style
can tune the surface but can never override where the list goes — a popover that
is not absolutely positioned still sits in the top layer, where it lays out
against the initial containing block rather than its trigger.

Scrolling the option list no longer closes the dropdown. The dismiss-on-scroll
listener runs on `window` in the capture phase, which puts it on the path of a
scroll from every element — including the list itself — so it now ignores
scrolls originating inside the dropdown. `VirtualList` scroll containers also set
`overscroll-behavior: contain`, so reaching the end of the list no longer chains
the scroll to the surrounding drawer, and dismissal dispatches a close rather
than a toggle, which a busy list used to suppress.
