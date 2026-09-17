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
      <div className="breadcrumb-wrap bg-f br-1">
        <div className="container">
          <div className="breadcrumb-title">
            <h2>{breadcrumb.heading}</h2>
            <ul className="breadcrumb-menu list-style">
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
