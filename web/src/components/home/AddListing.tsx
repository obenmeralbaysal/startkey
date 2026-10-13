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
            <div className="listing-content relative z-[1] [padding-left:calc(60px_*_var(--sk-scale,_1))] bg-brand max-md:[padding-right:calc(20px_*_var(--sk-scale,_1))] max-md:[padding-left:calc(20px_*_var(--sk-scale,_1))] [padding-top:calc(100px_*_var(--sk-scale,_1))] [padding-bottom:calc(100px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(50px_*_var(--sk-scale,_1))] max-md:[padding-bottom:calc(50px_*_var(--sk-scale,_1))]">
              <img
                src="/themes/fela/img/add-listing-shape.png"
                alt="Image"
                loading="lazy"
                className="absolute [top:0] [left:0] w-full h-full [z-index:-1]"
              />
              <div
                className="relative [margin:0_0_calc(25px_*_var(--sk-scale,_1))] [&_h2]:font-heading [&_h2]:text-[calc(40px*var(--sk-scale,1))] [&_h2]:font-bold [&_h2]:m-0 [&_p]:mt-[calc(12px*var(--sk-scale,1))]"
                dangerouslySetInnerHTML={{ __html: content.contentHtml }}
              />
              <a className="sk-btn sk-btn-navy" href={content.button.href}>
                {content.button.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
