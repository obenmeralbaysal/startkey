export interface NavItem {
  label: string;
  href: string;
  target: string | null;
  children: NavItem[];
}

export interface LinkContent {
  label: string;
  href: string;
}

export interface HomepageContent {
  lang: string;
  htmlLang: string;
  /**
   * Head tags as published by the reference website for this language. Tags the
   * reference omits – the German version has no title or description tags, for
   * instance – are null and are not rendered.
   */
  meta: {
    title: string;
    description: string | null;
    keywords: string | null;
    siteTitle: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    favicon: string | null;
    robots: string | null;
    alternates: { hreflang: string; href: string }[];
  };
  /** JSON-LD blocks copied from the reference website. */
  structuredData: unknown[];
  seminarBar: {
    prefix: string;
    count: number;
    suffix: string;
    href: string;
  };
  nav: NavItem[];
  languageSwitcher: {
    current: string;
    options: { code: string; label: string }[];
  };
  headerButtons: {
    consultant: LinkContent;
    franchise: LinkContent;
    crm: LinkContent;
  };
  heroSearch: {
    tabs: string[];
    formActions: string[];
    buttons: string[];
    placeholders: string[];
  };
  counters: {
    icon: string;
    count: number;
    suffix: string;
    label: string;
  }[];
  featured: {
    titleHtml: string;
    properties: {
      id: number;
      href: string;
      image: string;
      processType: string;
      adSubType: string;
      adType: string;
      price: string;
      title: string;
      location: string;
      rooms: string;
      area: string;
      detailLabel: string;
    }[];
  };
  about1: { titleHtml: string; bodyHtml: string };
  about2: { contentHtml: string };
  about3: { contentHtml: string };
  howItWorks: {
    titleHtml: string;
    cards: { image: string; step: string; infoHtml: string }[];
    button: LinkContent;
  };
  addListing: {
    background: string;
    contentHtml: string;
    button: LinkContent;
  };
  videoPromo: {
    videoUrl: string;
    span: string;
    heading: string;
  };
  cities: {
    titleHtml: string;
    cards: { cityId: string; image: string; name: string; href: string }[];
    button: LinkContent;
  };
  faq: {
    titleHtml: string;
    image: string;
    items: {
      headingId: string;
      collapseId: string;
      buttonClass: string;
      collapseClass: string;
      expanded: boolean;
      question: string;
      answerHtml: string;
    }[];
  };
  newsletter: {
    titleHtml: string;
    placeholders: string[];
    submitLabel: string;
    submitClass: string;
    captchaError: string;
    captchaNoticeHtml: string;
  };
  footer: {
    descriptionHtml: string;
    crmButton: LinkContent;
    widgets: { title: string; links: LinkContent[] }[];
    copyrightHtml: string;
    mapEmbedUrl: string;
    mapLink: string;
    social: { icon: string; href: string }[];
  };
}
