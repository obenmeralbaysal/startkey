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
      <div className="container ptb-100">
        {data.groups.map((group, index) => (
          <Fragment key={`${group.title}-${index}`}>
            <div className="section-title style2">
              {group.kicker ? <span>{group.kicker}</span> : null}
              {group.title ? <h2>{group.title}</h2> : null}
            </div>
            <div className="sk-photo-grid">
              {group.photos.map((photo) => (
                <div className="photo" key={photo}>
                  <a data-fslightbox="gallery" data-type="image" href={photo}>
                    <img src={photo} alt="" />
                  </a>
                </div>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </>
  );
}
