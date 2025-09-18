"use client";

/** On contract detail pages, block any accidental navigation to /upload
 * caused by parent Links or global handlers. This is a band-aid that
 * guarantees your inline UploadReplaceButton stays on the page.
 */
export default function BlockUploadNav() {
  // Use capture phase so we intercept before any Link/router handlers
  function onClickCapture(e: React.MouseEvent) {
    const path = e.composedPath() as Element[];
    const a = path.find(
      (el) => el instanceof HTMLAnchorElement
    ) as HTMLAnchorElement | undefined;

    if (a && typeof a.href === "string") {
      try {
        const url = new URL(a.href);
        if (url.pathname === "/upload") {
          e.preventDefault();
          e.stopPropagation();
          // Uncomment to debug:
          // console.warn("Blocked navigation to /upload on contract detail page.", a);
        }
      } catch {
        /* ignore bad URLs */
      }
    }
  }

  return (
    <div
      // capture-phase handler stops any bubbling Link to /upload
      onClickCapture={onClickCapture}
      onMouseDownCapture={(e) => {
        const path = (e as any).composedPath?.() as Element[] | undefined;
        const a = path?.find((el) => el instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
        if (a && a.pathname === "/upload") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      // nothing visible; it just mounts the handlers
      style={{ display: "contents" }}
    />
  );
}
