import type { HomepageContent } from "@/content/types";

export function HowItWorks({ content }: { content: HomepageContent["howItWorks"] }) {
  return (
    <section className="hw-wrap bg-seashell [padding-top:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] [padding-bottom:calc(75px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(25px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(45px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="flex flex-wrap">
          <div className="w-full xl:w-1/2 xl:ml-1/4 lg:w-2/3 lg:ml-1/6">
            <div
              className="relative [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))] text-center [margin-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]"
              dangerouslySetInnerHTML={{ __html: content.titleHtml }}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center">
          {content.cards.map((card) => {
            const imageBase = card.image.replace(/\.[^.]+$/, "");
            return (
              <div
                className="w-full xl:w-1/3 lg:w-1/3 md:w-1/2 sm:w-1/2"
                key={card.image}
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-delay="200"
              >
                <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
                  <div className="relative z-[1] [margin:0_0_calc(35px_*_var(--sk-scale,_1))] max-md:[margin-bottom:calc(45px_*_var(--sk-scale,_1))]">
                    <img
                      src="/themes/fela/img/how-it-works/hw-shape-1.png"
                      alt="Image"
                      loading="lazy"
                      className="absolute [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [z-index:-1] [max-width:calc(300px_*_var(--sk-scale,_1))] max-md:[max-width:calc(250px_*_var(--sk-scale,_1))] max-md:[top:45%]"
                    />
                    <picture>
                      <source
                        srcSet={`/media/micrositecontent/${imageBase}.webp`}
                        type="image/webp"
                      />
                      <img
                        src={`/media/micrositecontent/${card.image}`}
                        alt="MicroSiteContent-photo"
                        width={260}
                        loading="lazy"
                      />
                    </picture>
                    <span>{card.step}</span>
                  </div>
                  <div className="[padding:0_calc(20px_*_var(--sk-scale,_1))] text-center" dangerouslySetInnerHTML={{ __html: card.infoHtml }} />
                </div>
              </div>
            );
          })}
          <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-brand text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-navy before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-navy after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100 max-[385px]:[font-size:0.8em]" href={content.button.href}>
            {content.button.label}
          </a>
        </div>
      </div>
    </section>
  );
}
