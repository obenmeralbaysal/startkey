/**
 * The reference website uses `href="javascript:void(0)"` here; React refuses to render
 * `javascript:` URLs, so the anchor is marked as a button instead. The theme runtime
 * binds the scroll behaviour to the class, and the cursor is kept the same.
 */
export function BackToTop() {
  return (
    <a role="button" data-back-to-top="" className="[font-size:calc(24px_*_var(--sk-scale,_1))] [width:calc(45px_*_var(--sk-scale,_1))] [height:calc(45px_*_var(--sk-scale,_1))] [line-height:calc(42px_*_var(--sk-scale,_1))] text-center hidden fixed [bottom:calc(230px_*_var(--sk-scale,_1))] [right:calc(20px_*_var(--sk-scale,_1))] z-[999] [border-radius:calc(5px_*_var(--sk-scale,_1))] bg-brand [box-shadow:0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.2)] [transition:all_0.4s_ease-in-out] text-white" style={{ cursor: "pointer" }}>
      <i className="ri-arrow-up-s-line" />
    </a>
  );
}
