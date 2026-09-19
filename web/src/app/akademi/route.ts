import { akademiPage } from "./_html";

/**
 * startkey.com.tr/akademi = startkeyakademi.net/
 *
 * The academy site is a separate WordPress public site (Eduma / Elementor /
 * LearnPress). It is served as a rewritten HTML snapshot with local assets so it
 * can later leave this Next.js app without sharing the corporate layout, theme
 * or header. Sub-routes keep the academy path under /akademi (for example
 * startkeyakademi.net/egitimler/ → /akademi/egitimler/).
 *
 * The reference academy site is Turkish only; there is no EN/DE edition.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return akademiPage("homepage.html");
}
