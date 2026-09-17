/**
 * The reference website uses `href="javascript:void(0)"` here; React refuses to render
 * `javascript:` URLs, so the anchor is marked as a button instead. The theme runtime
 * binds the scroll behaviour to the class, and the cursor is kept the same.
 */
export function BackToTop() {
  return (
    <a role="button" className="back-to-top bounce" style={{ cursor: "pointer" }}>
      <i className="ri-arrow-up-s-line" />
    </a>
  );
}
