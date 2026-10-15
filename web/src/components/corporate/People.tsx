import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { Picture } from "@/components/corporate/Picture";
import type { CorporatePayload } from "@/lib/corporate";

function PersonCard({
  person,
}: {
  person: Extract<CorporatePayload, { kind: "people-list" }>["people"][number];
}) {
  return (
    <div className="sk-half">
      <div className="agent-card style1">
        <div className="agent-img">
          <a href={person.urlPath}>
            <Picture width={414} height={414}>
              {person.imageWebp ? <source srcSet={person.imageWebp} type="image/webp" /> : null}
              <img src={person.image} alt="User-photo" width={414} height={414} />
            </Picture>
          </a>
        </div>
        <div className="agent-info-wrap">
          <div className="agent-info">
            <h3>
              <a href={person.urlPath}>{person.name}</a>
            </h3>
            <span>{person.role}</span>
            <br />
            {person.phoneHref ? (
              <div className="container items-center">
                <i className="flaticon-phone-call" />{" "}
                <a href={person.phoneHref} target="_blank" rel="noopener noreferrer">
                  {person.phoneLabel}
                </a>
              </div>
            ) : null}
            {person.email ? (
              <div className="container items-center">
                <i className="flaticon-envelope" />{" "}
                <a href={`mailto:${person.email}`}>  {person.email}</a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PeopleList({ data }: { data: Extract<CorporatePayload, { kind: "people-list" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <section className="agent-wrap ptb-100">
        <div className="container">
          <div className="sk-center">
            <div>
              <div className="sk-split">
                {data.people.map((person) => (
                  <PersonCard person={person} key={person.externalId} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function PersonDetail({ data }: { data: Extract<CorporatePayload, { kind: "people-detail" }> }) {
  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container ptb-100">
        <div className="agent-details-wrap">
          <div className="sk-split">
            <div className="sk-half">
              <div className="agent-img">
                <Picture width={574} height={574}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img src={data.image} alt="OurTeam-photo" width={574} height={574} />
                </Picture>
              </div>
            </div>
            <div className="sk-half">
              <div className="block">
                <div className="[width:calc(100%_-_calc(85px_*_var(--sk-scale,_1)))] [margin-left:calc(15px_*_var(--sk-scale,_1))] [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] max-md:[padding-bottom:calc(20px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))]">
                  <h2>{data.name}</h2>
                  <span>{data.role}</span>
                </div>
                <ul className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))] text-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)] list-none">
                  {data.email ? (
                    <li>
                      <b>{data.emailLabel}</b>
                      <a href={`mailto:${data.email}`}>{data.email}</a>
                    </li>
                  ) : null}
                  {data.phoneHref ? (
                    <li>
                      <b>{data.phoneFieldLabel}</b>{" "}
                      <a href={data.phoneHref} target="_blank" rel="noopener noreferrer">
                        {data.phoneLabel}
                      </a>
                    </li>
                  ) : null}
                </ul>
                {data.social.length > 0 ? (
                  <div className="flex flex-wrap items-center">
                    <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none">
                      {data.social.map((item) => (
                        <li key={`${item.network}-${item.href}`}>
                          <a href={item.href} target="_blank" rel="noopener noreferrer" className={item.network}>
                            <i className={`ri-${item.network}-fill`} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="w-full">
              <div className="[margin-top:calc(25px_*_var(--sk-scale,_1))]">
                {data.bioHeading ? <h4>{data.bioHeading}</h4> : null}
                <p className="[margin-bottom:calc(30px_*_var(--sk-scale,_1))]" dangerouslySetInnerHTML={{ __html: data.bioHtml }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
