import type { HomepageContent } from "@/content/types";

export function AddListing({ content }: { content: HomepageContent["addListing"] }) {
  return (
    <div className="relative">
      <div className="w-full px-[calc(12px*var(--sk-scale,1))] [padding-right:0] [padding-left:0]">
        <div className="flex flex-wrap gap-x-0">
          <div className="w-full md:w-1/2">
            <div
              className="[background-image:url(/themes/fela/img/add-listing-bg.jpg)] h-full max-md:[height:calc(300px_*_var(--sk-scale,_1))] [background-position:center_center] [background-size:cover] [background-repeat:no-repeat] [background-color:#ddd]"
              style={{ backgroundImage: `url(/media/micrositecontent/${content.background})` }}
            />
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative z-[1] [padding-left:calc(60px_*_var(--sk-scale,_1))] bg-brand max-md:[padding-right:calc(20px_*_var(--sk-scale,_1))] max-md:[padding-left:calc(20px_*_var(--sk-scale,_1))] md:max-lg:[padding-right:calc(34px_*_var(--sk-scale,_1))] md:max-lg:[padding-left:calc(30px_*_var(--sk-scale,_1))] max-lg:[padding-right:calc(26px_*_var(--sk-scale,_1))] lg:max-xl:[padding-right:calc(26px_*_var(--sk-scale,_1))] xl:max-2xl:[padding-right:calc(41px_*_var(--sk-scale,_1))] 2xl:max-[1599px]:[padding-right:calc(52px_*_var(--sk-scale,_1))] min-[1600px]:[padding-right:calc(202px_*_var(--sk-scale,_1))] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))] md:max-lg:[padding-top:calc(70px_*_var(--sk-scale,_1))] md:max-lg:[padding-bottom:calc(70px_*_var(--sk-scale,_1))]">
              <img
                src="/themes/fela/img/add-listing-shape.png"
                alt="Image"
                loading="lazy"
                className="absolute [top:0] [left:0] w-full h-full [z-index:-1]"
              />
              <div
                className="relative [margin-bottom:calc(30px_*_var(--sk-scale,_1))] text-center [margin:calc(35px_*_var(--sk-scale,_1))_0_0] max-md:[margin-bottom:calc(20px_*_var(--sk-scale,_1))] [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))] [&_span]:mb-[calc(10px*var(--sk-scale,1))] [&_span]:inline-block [&_span]:font-semibold [&_span]:text-brand [&_span]:tracking-[calc(8px*var(--sk-scale,1))]"
                dangerouslySetInnerHTML={{ __html: content.contentHtml }}
              />
              <a className="relative z-[1] inline-block overflow-hidden whitespace-nowrap border border-transparent bg-navy text-center text-white rounded-[calc(5px*var(--sk-scale,1))] px-[calc(35px*var(--sk-scale,1))] py-[calc(14px*var(--sk-scale,1))] leading-[calc(26px*var(--sk-scale,1))] font-normal transition-all duration-[700ms] before:absolute before:top-0 before:left-0 before:z-[-1] before:h-0 before:w-1/2 before:bg-brand before:invisible before:opacity-0 before:transition-all before:duration-[400ms] after:absolute after:right-0 after:bottom-0 after:z-[-1] after:h-0 after:w-1/2 after:bg-brand after:invisible after:opacity-0 after:transition-all after:duration-[400ms] hover:text-white hover:before:visible hover:before:h-full hover:before:w-full hover:before:opacity-100 hover:after:visible hover:after:h-full hover:after:w-full hover:after:opacity-100" href={content.button.href}>
                {content.button.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
