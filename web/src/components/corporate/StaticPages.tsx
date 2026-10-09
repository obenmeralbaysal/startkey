import { Fragment } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import type { CorporatePayload } from "@/lib/corporate";

export function CmsPage({ data }: { data: Extract<CorporatePayload, { kind: "cms-page" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="cms" dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
    </>
  );
}

export function ChampionsPage({ data }: { data: Extract<CorporatePayload, { kind: "champions" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container">
        <div className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
          <section>
            <div className="container [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
              <div className="flex flex-wrap [&>*]:w-full md:[&>*]:w-1/2 lg:[&>*]:w-1/3 gap-[calc(24px*var(--sk-scale,1))]" />
            </div>
          </section>
          <br />
        </div>
        {data.groups.map((group, index) => (
          <Fragment key={`${group.title}-${index}`}>
            <div className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
              {group.kicker ? <span>{group.kicker}</span> : null}
              {group.title ? <h3>{group.title}</h3> : null}
            </div>
            <section>
              <div className="container [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                <div className="flex flex-wrap [&>*]:w-full md:[&>*]:w-1/2 lg:[&>*]:w-1/3 gap-[calc(24px*var(--sk-scale,1))]">
                  {group.photos.map((photo) => (
                    <div className="photo" key={photo}>
                      <a data-fslightbox="gallery" data-type="image" href={photo}>
                        <img src={photo} alt="" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <br />
          </Fragment>
        ))}
      </div>
    </>
  );
}
