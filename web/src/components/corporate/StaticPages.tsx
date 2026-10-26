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
      <div className="container sk-champions">
        {data.groups.map((group, index) => (
          <Fragment key={`${group.title}-${index}`}>
            <div className="section-title style2">
              {group.kicker ? <span>{group.kicker}</span> : null}
              {group.title ? <h3>{group.title}</h3> : null}
            </div>
            <section>
              <div className="container mb-[calc(40px*var(--sk-scale,1))]">
                <div className="sk-photo-grid">
                  {group.photos.map((photo) => (
                    <div className="photo" key={photo}>
                      <a data-fslightbox="gallery" data-type="image" href={photo}>
                        <img src={photo} alt={group.title || group.kicker || ""} width={640} height={480} />
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
