import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import type { CorporatePayload } from "@/lib/corporate";

export function TrainingList({ data }: { data: Extract<CorporatePayload, { kind: "training-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      {data.sections.map((section) => (
        <section
          className="listing-wrap ptb-100"
          key={section.group}
          style={section.sectionStyle ? { paddingTop: section.sectionStyle.includes("padding-top") ? 0 : undefined } : undefined}
        >
          <div className="container">
            <div className="row gx-5">
              <div className="col-xl-12">
                <h2 style={{ marginBottom: section.headingStyle.includes("30px") ? 30 : 20 }}>
                  {section.heading}
                </h2>
                <div className="row">
                  {section.items.map((item) => (
                    <div className="col-lg-4 col-md-6" key={item.externalId}>
                      <div className="property-card style2">
                        <div className="property-img">
                          <a className="property-img" href={item.urlPath}>
                            <img src={item.image} alt="properties" className="img-fluid" />
                          </a>
                        </div>
                        <div className="property-info">
                          <div className="prop-title" style={{ height: "3.1em" }}>
                            <h3 style={{ fontSize: 18 }}>
                              <a href={item.urlPath}>{item.title}</a>
                            </h3>
                          </div>
                          {item.infoLines.map((line) => (
                            <p key={`${item.externalId}-${line.icon}-${line.text}`}>
                              <i className={line.icon} />
                              {line.text}
                            </p>
                          ))}
                          <ul className="" style={{ paddingLeft: 0 }}>
                            <a
                              className="btn style2"
                              style={{ padding: "8px 25px 8px 25px", width: "100%" }}
                              href={item.urlPath}
                            >
                              {item.detailLabel} <i className="ri-arrow-right-s-line prop-right-icon" />
                            </a>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
