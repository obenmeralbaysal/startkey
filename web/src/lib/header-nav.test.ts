import assert from "node:assert/strict";
import test from "node:test";

import type { NavItem } from "../content/types.ts";
import { buildHeaderNav, drawerHeaderNav } from "./header-nav.ts";

function leaf(label: string, href: string): NavItem {
  return { label, href, target: null, children: [] };
}

function group(label: string, children: NavItem[]): NavItem {
  return { label, href: "#", target: null, children };
}

const trNav: NavItem[] = [
  leaf("Anasayfa", "/tr"),
  group("Kurumsal", [
    leaf("Hakkımızda", "/tr/sayfa/hakkimizda"),
    leaf("Medyada Biz", "/tr/haberler"),
    leaf("Duyurular", "/tr/duyurular"),
    leaf("Blog", "/tr/bloglar"),
    leaf("Şampiyonlarımız", "/tr/sampiyonlar"),
  ]),
  leaf("Portföylerimiz", "/tr/portfoy"),
  group("Startkey", [leaf("Ofislerimiz", "/tr/ofisler"), leaf("Profesyonellerimiz", "/tr/danismanlar")]),
  group("Akademi", [leaf("Çevrimiçi Eğitimler", "https://startkeyakademi.net"), leaf("Seminerler", "/tr/egitimlerimiz")]),
  leaf("İletişim", "/tr/iletisim"),
];

test("header nav follows the mockup order and keeps the real links", () => {
  const nav = buildHeaderNav("tr", trNav, ["Portföyler", "Ofisler", "Danışmanlar"]);
  assert.deepEqual(
    nav.map((item) => item.label),
    ["Kurumsal", "Portföyler", "Danışmanlar", "Ofisler", "Akademi", "Medya"],
  );
  assert.equal(nav[1].href, "/tr/portfoy");
  assert.equal(nav[2].href, "/tr/danismanlar");
  assert.equal(nav[3].href, "/tr/ofisler");
  assert.deepEqual(
    nav[0].children.map((item) => item.label),
    ["Anasayfa", "Hakkımızda", "Şampiyonlarımız", "İletişim"],
  );
  assert.deepEqual(
    nav[5].children.map((item) => item.href),
    ["/tr/haberler", "/tr/duyurular", "/tr/bloglar"],
  );
  assert.equal(nav[4].children[0].target, null);
  assert.equal(nav[4].children[0].href, "https://startkeyakademi.net");
});

test("english and german hrefs land in the same groups", () => {
  const en = buildHeaderNav("en", [
    leaf("Home", "/en"),
    group("Corporate", [leaf("About Us", "/en/page/about-us"), leaf("In the Media", "/en/news"), leaf("Blog", "/en/blogs")]),
    leaf("Our Portfolios", "/en/property"),
    group("Startkey", [leaf("Our Offices", "/en/offices"), leaf("Our Professionals", "/en/agents")]),
    group("Academy", [leaf("Seminars", "/en/our-educations")]),
    leaf("Contact", "/en/contact"),
  ]);
  assert.deepEqual(
    en.map((item) => item.label),
    ["Corporate", "Portfolios", "Consultants", "Offices", "Academy", "Media"],
  );
  assert.equal(en[2].href, "/en/agents");

  const de = buildHeaderNav("de", [
    leaf("Startseite", "/de"),
    group("Unternehmen", [leaf("Über uns", "/de/page/uber-uns"), leaf("In den Medien", "/de/nachricht")]),
    leaf("Unsere Portfolios", "/de/immobilien"),
    group("Startkey", [leaf("Unsere Büros", "/de/anbieteren"), leaf("Unsere Fachleute", "/de/immobilienmakleren")]),
    group("Akademie", [leaf("Seminare", "/de/our-educations")]),
    leaf("Kontakt", "/de/kontakt"),
  ], ["Portfolios", "Büros", "Berater"]);
  assert.deepEqual(
    de.map((item) => item.label),
    ["Unternehmen", "Portfolios", "Berater", "Büros", "Akademie", "Medien"],
  );
  assert.equal(de[1].href, "/de/immobilien");
  assert.equal(de[2].href, "/de/immobilienmakleren");
  assert.deepEqual(
    de[0].children.map((item) => item.label),
    ["Startseite", "Über uns", "Kontakt"],
  );
});

test("the drawer lists the direct links before the accordions", () => {
  const desktop = buildHeaderNav("tr", trNav, ["Portföyler", "Ofisler", "Danışmanlar"]);
  assert.deepEqual(
    drawerHeaderNav(desktop).map((item) => item.label),
    ["Portföyler", "Danışmanlar", "Ofisler", "Kurumsal", "Akademi", "Medya"],
  );
});
