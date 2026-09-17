import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import type { CorporatePayload } from "@/lib/corporate";

export function CmsPage({ data }: { data: Extract<CorporatePayload, { kind: "cms-page" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div dangerouslySetInnerHTML={{ __html: data.bodyHtml }} />
    </>
  );
}

export function ChampionsPage({ data }: { data: Extract<CorporatePayload, { kind: "champions" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container">
        {data.groups.map((group, index) => (
          <div key={`${group.title}-${index}`}>
            <div className="section-title style2 text-center mb-40">
              {group.kicker ? <span>{group.kicker}</span> : null}
              {group.title ? <h3>{group.title}</h3> : null}
            </div>
            <section>
              <div className="container mb-40">
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
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
          </div>
        ))}
      </div>
    </>
  );
}
