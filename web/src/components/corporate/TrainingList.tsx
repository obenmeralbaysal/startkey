import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import type { CorporatePayload } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

export function TrainingList({ data }: { data: Extract<CorporatePayload, { kind: "training-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      {data.sections.map((section) => (
        <section
          className="listing-wrap [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]"
          key={section.group}
          style={section.sectionStyle ? { paddingTop: section.sectionStyle.includes("padding-top") ? 0 : undefined } : undefined}
        >
          <div className="container">
            <div className="flex flex-wrap gap-x-[calc(48px*var(--sk-scale,1))]">
              <div className="w-full">
                <h2 style={{ marginBottom: scaled(section.headingStyle.includes("30px") ? 30 : 20) }}>
                  {section.heading}
                </h2>
                <div className="flex flex-wrap">
                  {section.items.map((item) => (
                    <div className="w-full lg:w-1/3 md:w-1/2" key={item.externalId}>
                      <div className="[box-shadow:0_0_calc(15px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.09)]">
                        <div className="overflow-hidden relative [border-radius:calc(5px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                          <a className="overflow-hidden relative [border-radius:calc(5px_*_var(--sk-scale,_1))] [margin-bottom:calc(30px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]" href={item.urlPath}>
                            <img src={item.image} alt="properties" className="max-w-full h-auto" />
                          </a>
                        </div>
                        <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))] [border-radius:calc(20px_*_var(--sk-scale,_1))_calc(20px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))_calc(8px_*_var(--sk-scale,_1))] [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.06)] bg-white [margin-top:calc(-30px_*_var(--sk-scale,_1))] relative z-[1] max-md:[padding:calc(20px_*_var(--sk-scale,_1))] md:max-lg:[padding:calc(20px_*_var(--sk-scale,_1))] lg:max-xl:[padding:calc(20px_*_var(--sk-scale,_1))] xl:max-2xl:[padding:calc(20px_*_var(--sk-scale,_1))]">
                          <div className="[display:-webkit-box] overflow-hidden [text-overflow:ellipsis] [height:2.5em]" style={{ height: "3.1em" }}>
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
                          <ul className="" style={{ paddingLeft: 0 }}>
                            <a
                              className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100"
                              style={{ padding: scaled("8px 25px 8px 25px"), width: "100%" }}
                              href={item.urlPath}
                            >
                              {item.detailLabel} <i className="ri-arrow-right-s-line [color:white] [font-size:x-large] [margin:0] [top:calc(3px_*_var(--sk-scale,_1))]" />
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
