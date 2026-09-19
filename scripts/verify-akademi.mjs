/**
 * Exercises the local academy homepage the way a visitor would.
 *
 *   node scripts/verify-akademi.mjs http://localhost:3000
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  } else {
    console.log(`ok    ${message}`);
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const leaked = [];
page.on("request", (request) => {
  const url = request.url();
  if (url.includes("startkeyakademi.net") && !url.startsWith("mailto:")) {
    leaked.push(url);
  }
});

await page.route("**://www.googletagmanager.com/**", (route) => route.abort());
await page.route("**://www.google.com/recaptcha/**", (route) => route.abort());
await page.route("**://challenges.cloudflare.com/**", (route) => route.abort());

const response = await page.goto(`${base}/akademi`, { waitUntil: "load", timeout: 60000 });
await page.mouse.move(10, 10);
await page.waitForTimeout(2500);

assert(response?.ok(), `GET /akademi returns ${response?.status()}`);
assert((await page.title()) === "Anasayfa - Startkey Akademi", "academy title");
assert(await page.locator("#wrapper-container").count(), "academy wrapper is present");
assert(await page.locator(".thim-ekit__header").count(), "academy header is present");
assert(await page.locator("#menu-primary-menu").count(), "primary menu is present");
assert(await page.locator('#menu-primary-menu a[href="/akademi/"]').count(), "Anasayfa nav link");
assert(await page.locator('#menu-primary-menu a[href="/akademi/egitimler/"]').count(), "Eğitimler nav link");
assert(await page.locator('#menu-primary-menu a[href="/akademi/iletisim/"]').count(), "İletişim nav link");
assert(
  await page.locator("h1, .sc_heading .title").first().textContent().then((t) => t?.includes("Startkey Akademi")),
  "hero heading mentions Startkey Akademi",
);
assert(!(await page.locator("header.header-wrap").count()), "corporate header is not used");
assert(!(await page.locator("footer.footer-wrap").count()), "corporate footer is not used");

const html = await page.content();
assert(!html.includes("https://startkeyakademi.net/wp-content"), "no academy origin asset hotlink");
assert(html.includes("/akademi/wp-content/"), "local academy assets are referenced");
assert(!leaked.length, `runtime did not request startkeyakademi.net (${leaked.slice(0, 3).join(", ")})`);
assert((await page.locator(".e-fas-mail-bulk").count()) >= 2, "footer mail icons are present");

const footerPages = [
  ["/akademi/egitimler", "Eğitimler - Startkey Akademi", "Empatik İletişim"],
  ["/akademi/egitimler/page/2", "Eğitimler - Sayfa 2 / 3 - Startkey Akademi", "Başarı Yolunun Şifreleri"],
  ["/akademi/egitimler/page/3", "Eğitimler - Sayfa 3 / 3 - Startkey Akademi", "Az Konuş, Çok Kazan"],
  ["/akademi/egitimler/empatik-iletisim", "Empatik İletişim - Startkey Akademi", "Sepete Ekle"],
  ["/akademi/egitimler/az-konus-cok-kazan", "Az Konuş, Çok Kazan - Startkey Akademi", "Sepete Ekle"],
  ["/akademi/giris", "Giriş Yap - Startkey Akademi", "Giriş Yap"],
  ["/akademi/kayit", "Kayıt - Startkey Akademi", "Kayıt"],
  ["/akademi/egitmenler", "Eğitmenler - Startkey Akademi", "Eğitmenler"],
  ["/akademi/egitmen/isil", "Eğitmen - Startkey Akademi", "Işıl"],
  ["/akademi/egitim-kategorisi/kisisel-gelisim", "Kişisel Gelişim - Startkey Akademi", "Kişisel Gelişim"],
  ["/akademi/esnek-egitim-modeliyle-gelecegi-sekillendirin", "Esnek Eğitim Modeliyle Geleceği Şekillendirin - Startkey Akademi", "Esnek Eğitim"],
  ["/akademi/sepet", "Sepet Yedek - Startkey Akademi", "Sepet"],
  ["/akademi/egitimler/empatik-iletisim/egitim-erisimi/empatik-iletisim", "Empatik İletişim - Startkey Akademi", "içeriği korunmaktadır"],
  ["/akademi/akademi", "Akademi - Startkey Akademi", "sürekli öğrenenlerin"],
  ["/akademi/sss", "SSS - Startkey Akademi", "SIKÇA SORULAN SORULAR"],
  ["/akademi/iletisim", "İletişim - Startkey Akademi", "İLETİŞİME GEÇİN"],
  ["/akademi/kvkk", "KVKK - Startkey Akademi", "Kişisel Verilerin Korunması (KVKK) Aydınlatma Metni"],
  ["/akademi/kullanim-kosullari", "Kullanım Koşulları - Startkey Akademi", "Web Sitesi Kullanım Koşulları"],
  ["/akademi/gizlilik-bilgilendirmesi", "Gizlilik Bilgilendirmesi - Startkey Akademi", "Gizlilik Politikası"],
  ["/akademi/geri-odeme-bilgilendirmesi", "Geri Ödeme Bilgilendirmesi - Startkey Akademi", "İade ve Geri Ödeme Politikası"],
  ["/akademi/cerez-bilgilendirmesi", "Çerez Bilgilendirmesi - Startkey Akademi", "Çerez Aydınlatma Metni"],
];

for (const [path, title, heading] of footerPages) {
  leaked.length = 0;
  const pageResponse = await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 60000 });
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1500);
  assert(pageResponse?.ok(), `GET ${path} returns ${pageResponse?.status()}`);
  assert((await page.title()) === title, `${path} title`);
  assert((await page.content()).includes(heading), `${path} heading`);
  assert(!(await page.locator("header.header-wrap").count()), `${path} does not use corporate header`);
  assert(!leaked.length, `${path} did not request startkeyakademi.net`);
}

leaked.length = 0;
await page.goto(`${base}/akademi/egitimler`, { waitUntil: "load", timeout: 60000 });
assert(
  await page.locator('a.page-numbers[href="/akademi/egitimler/page/2/"]').count(),
  "numeric pager points at /akademi/egitimler/page/2/",
);
await page.locator('a[href="/akademi/egitimler/empatik-iletisim/"]').first().click();
await page.waitForTimeout(2000);
assert((await page.title()) === "Empatik İletişim - Startkey Akademi", "listing card opens course detail");
assert((await page.content()).includes("Dinlemeyi Öğrenmeden İkna Edemezsin"), "course description is present");
assert((await page.content()).includes("Eğitim Programı"), "course curriculum tab is present");
assert(!leaked.length, "course click did not request startkeyakademi.net");

const corporate = await page.goto(`${base}/tr`, { waitUntil: "load", timeout: 60000 });
assert(corporate?.ok(), `GET /tr still returns ${corporate?.status()}`);
assert(await page.locator("header.header-wrap").count(), "corporate homepage header still present");
const academyNav = page.locator("a[href='/akademi']").first();
assert(await academyNav.count(), "Çevrimiçi Eğitimler points at /akademi");

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nacademy homepage checks passed");
