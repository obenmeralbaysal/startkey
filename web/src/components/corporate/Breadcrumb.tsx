import type { CorporateBreadcrumb } from "@/lib/corporate";

export function Breadcrumb({ breadcrumb }: { breadcrumb: CorporateBreadcrumb }) {
  return (
    <div className="sk-breadcrumb">
      <div className="container">
        <div className="sk-breadcrumb-title">
          <h2>{breadcrumb.heading}</h2>
          <ul className="sk-breadcrumb-menu">
            {breadcrumb.trail.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                {item.href ? <a href={item.href}>{item.label}</a> : <a>{item.label}</a>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
