import Link from "next/link";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { errorPageCopy } from "@/content/error-pages";
import type { Locale } from "@/lib/locales";

export function CorporateHttpErrorView({
  locale,
  code,
}: {
  locale: Locale;
  code: 404 | 500;
}) {
  const copy = errorPageCopy[locale];
  const heading = code === 500 ? "500" : copy.heading;

  return (
    <>
      <Breadcrumb
        breadcrumb={{
          heading,
          trail: [
            { href: copy.homeHref, label: copy.homeLabel },
            { href: null, label: heading },
          ],
        }}
      />
      <div className="error-wrap ptb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              <div className="error-content">
                <h2>{heading}</h2>
                {code === 404 && copy.body ? <p>{copy.body}</p> : null}
                <Link href={copy.homeHref} className="btn style2">
                  {copy.homeLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
