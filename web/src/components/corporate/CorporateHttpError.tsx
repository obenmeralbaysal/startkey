import Link from "next/link";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { MarkHttpError } from "@/components/corporate/MarkHttpError";
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
      <MarkHttpError code={code} />
      <Breadcrumb
        breadcrumb={{
          heading,
          trail: [
            { href: copy.homeHref, label: copy.homeLabel },
            { href: null, label: heading },
          ],
        }}
      />
      <div className="[border-top:1px_solid_rgba(0,_0,_0,_0.07)] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
        <div className="container">
          <div className="flex flex-wrap">
            <div className="w-full lg:w-2/3 lg:ml-1/6">
              <div className="text-center">
                <h2>{heading}</h2>
                {code === 404 && copy.body ? <p>{copy.body}</p> : null}
                <Link href={copy.homeHref} className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100">
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
