import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import type { CorporatePayload } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

export function TrainingList({ data }: { data: Extract<CorporatePayload, { kind: "training-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      {data.sections.map((section) => (
        <section
          className="listing-wrap ptb-100"
          key={section.group}
          style={section.sectionStyle?.includes("padding-top") ? { paddingTop: 0 } : undefined}
        >
          <div className="container">
            <h2 style={{ marginBottom: scaled(section.headingStyle.includes("30px") ? 30 : 20) }}>
              {section.heading}
            </h2>
            <div className="sk-split">
              {section.items.map((item) => (
                <div className="sk-third" key={item.externalId}>
                  <div className="property-card style2">
                    <div className="property-img">
                      <a href={item.urlPath}>
                        <img src={item.image} alt="properties" />
                      </a>
                    </div>
                    <div className="property-info">
                      <div className="prop-title" style={{ height: "3.1em" }}>
                        <h3 style={{ fontSize: scaled(18) }}>
                          <a href={item.urlPath}>{item.title}</a>
                        </h3>
                      </div>
                      {item.infoLines.map((line) => (
                        <p key={`${item.externalId}-${line.icon}-${line.text}`}>
                          <i className={line.icon} />
                          {line.text}
                        </p>
                      ))}
                      <a className="btn style2" style={{ width: "100%" }} href={item.detailUrlPath || item.urlPath}>
                        {item.detailLabel} <i className="ri-arrow-right-s-line" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
