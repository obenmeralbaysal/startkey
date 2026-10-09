import type { CorporateBreadcrumb } from "@/lib/corporate";

export function Breadcrumb({ breadcrumb }: { breadcrumb: CorporateBreadcrumb }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
    .breadcumb-menu li a, .breadcumb-title {
        text-transform: capitalize !important;
    }
`,
        }}
      />
      <div className="relative w-full h-full [padding:calc(100px_*_var(--sk-scale,_1))_0] overflow-hidden z-[1] after:absolute after:[top:0] after:[left:0] after:content-[''] after:w-full after:h-full after:[background-color:rgba(0,_0,_0,_0.76)] after:[z-index:-1] max-sm:[padding:calc(50px_*_var(--sk-scale,_1))_0] max-md:[padding:calc(70px_*_var(--sk-scale,_1))_0] md:max-lg:[padding:calc(80px_*_var(--sk-scale,_1))_0] lg:max-xl:[padding:calc(80px_*_var(--sk-scale,_1))_0] [background-position:center_center] [background-size:cover] [background-repeat:no-repeat] [background-color:#ddd] [background-image:url(/themes/fela/img/breadcrumb/startkey-breadcrumb.jpg)]">
        <div className="container">
          <div className="relative z-[1] w-full">
            <h2>{breadcrumb.heading}</h2>
            <ul className="m-0 flex list-none flex-wrap p-0 text-white">
              {breadcrumb.trail.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {item.href ? <a href={item.href}>{item.label}</a> : <a>{item.label}</a>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
