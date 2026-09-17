# Sayfa Yeniden Oluşturma Playbook

**Amaç:** Sonraki sprinti Faz 1’den daha güvenli ve daha kısa sürede bitirmek.

Bu dosya bir Git geçmişi değildir. Faz 1 ana sayfa çalışmasından kalan, tekrar kullanılabilir yöntemdir. Hedef sayfa vizyon-misyon, yönetim kadrosu veya portföy olsa da sıra değişmez:

```text
Referansı incele
 → Snapshot al (tr / en / de)
 → Asset’i lokal indir
 → Metni referanstan çıkar (çeviri yazma)
 → Mevcut layout’un içine UI’ı kur
 → Tema runtime’ını bozma
 → Üç viewport + etkileşim doğrula
 → Teknik borcu kaydet
```

Bütün website’i tek seferde kurma. Bir public sayfa bitmeden sonrakine geçme.

---

## 1. Faz 1’den kalan gerçekler

Bunlar tahmin değil; ana sayfada ölçüldü.

| Konu | Karar |
| --- | --- |
| Diller | `tr`, `en`, `de`. `/` Türkçe’yi rewrite eder, 301 yapmaz. |
| Chrome | Header, footer, dil menüsü, preloader, back-to-top, tema CSS/JS **yeniden yazılmaz**. Yeni sayfa `[lang]/page.tsx` içindeki children’dır. |
| Metin | `web/src/content/*.json` referans HTML’den çıkarılır. AI çevirisi yasak. |
| Asset | Runtime’da `startkey.com.tr` / CDN hotlink yok. Dosya `web/public` altındadır. |
| CRM verisi | Reonix yoksa referans anlık görüntüsü + `docs/TECHNICAL_DEBT.md`. |
| Marka | `ReOS` → `Reonix`, sağlayıcı logosu → `Sinap`. `homepage.ts` içindeki rewrite katmanı bunu yapar. |
| Tema | Referansın kendi `bundle-vendor.js` + `bundle-app.js` + jQuery sırası. Carousel, tab, accordion, select2, odometer buradan gelir. |
| Viewport | Desktop `1440×900`, tablet `768×1024`, mobil `390×844`. |

---

## 2. Yapılan hatalar ve çıkarılan dersler

Bunlar Faz 1’i yavaşlatan somut noktalardır. Aynılarına ikinci turda düşülmemeli.

### 2.1 Referansı görmeden kod yazmak

**Ne oldu:** Markup “daha temiz” hale getirilince layout kaydı. Referansta çift `class`, boş `<li class="nav-item">`, iç içe `row`, işlenmemiş `<vc:cache>` ve satır sonundaki bilinçli boşluk vardı. Tarayıcı bunları kullanıyor.

**Ders:** Önce `reference/snapshots/` içindeki gerçek HTML’e bak. Anlamadığın bir sarmalayıcıyı silme. JSX’te ifade edilemeyen etiket (`vc:cache`) için `createElement` kullan; yüksekliği 5 px değiştirir.

### 2.2 Tek dilden diğerine çeviri

**Ne oldu:** Almanca title/description referansta boş. “Doldurmak” referanstan sapma olurdu.

**Ders:** Her dil için ayrı snapshot. Referansta tag yoksa bizde de yok. `generateMetadata` null olanı basmaz.

### 2.3 “Yeterince yakın” görsel

**Ne oldu:** Orijinal görseli indirip CSS ile sığdırmak kart yüksekliğini bozdu. Referans CDN’den `?width=420&height=300&mode=Crop` ve ImageKit WebP varyantı geliyor.

**Ders:** `fetch-reference-media.py` snapshot’taki **tam URL varyantını** indirir. Orijinali çekip yeniden boyutlandırma.

### 2.4 Kaynak kod ile çalışan Docker imajının kopması

**Ne oldu:** Dil menüsü kaynakta `/tr/Settings/ChangeCulture?langCode=en` iken çalışan `startkey-web` imajında hâlâ `/en` vardı. Playwright imajdaki DOM’u gördü, kaynak dosyayı değil. İlk doğrulama 30 saniye timeout ile düştü.

**Ders:** Production `web` imajı bind-mount değildir. Frontend değişince `docker compose up -d --build web`. Doğrulamayı her zaman `localhost:3000` üzerindeki **çalışan** imaja karşı yap.

### 2.5 Tema scriptlerinden önce etkileşim testi

**Ne oldu:** Dil dropdown’ı `display: none`. Bootstrap, ThemeScripts hydration’dan sonra yüklenir. Gizli `a[href*="ChangeCulture"]` için Playwright `visible` bekledi ve asıldı.

**Ders:** Etkileşimden önce load + ~2,5 s (veya `data-startkey-theme-runtime`) bekle. Gizli menü öğesine `force: true` veya açık `href` ile git. `DOMContentLoaded` odometer için çoktan geçmiştir; `Odometer.init()` ThemeScripts’te bilinçli çağrılır.

### 2.6 API ayağa kalkmadan frontend’i “hazır” saymak

**Ne oldu:** `start.sh` yalnızca `/tr` bekledi. API seed bitmeden Next `fetchHomepageData` 500 attı. Container yeniden oluşunca bir süre 75 byte boş JSON geldi. Host’tan 8080’e curl, php-fpm hazır değilken connection refused (exit 7) verdi.

**Ders:** Sıra: postgres/redis healthy → API migrate+seed → nginx → `/api/v1/homepage?locale=tr` 200 ve dolu `data` → sonra `/tr` 200. `start.sh` artık API’yi önce bekler. API recreate sonrası nginx’i gerekirse restart et (`fastcgi_pass api:9000`).

### 2.7 DNS / asset indirme kopması

**Ne oldu:** Ortam `startkey.com.tr` çözemeyince CSS/JS/flag indirmesi toplu FAIL oldu. Eksik stylesheet ile “yaklaşık” sayfa üretilirdi.

**Ders:** Snapshot + asset indirmesi sayfa kodundan **önce** bitmeli. `failed>0` iken UI’a geçme. User-Agent ve retry şart; bazı origin’ler botsuz 403 verir.

### 2.8 Gözlemlenemeyen metni uydurmak

**Ne oldu:** Bülten post-submit mesajları canlı forma gerçek veri göndermeden görülemedi. API’de İngilizce hardcoded hata, captcha hatasını Email alanına yazdı.

**Ders:** Görülmeyen metin → geçici dize + `TD-00X`. Görülen metin → snapshot. Validation mesajını `locale` ile bağla; bilinmeyen alanı başka input’a map etme.

### 2.9 Testlerin birbirini bozması

**Ne oldu:** Bülten limiti IP başına 5/dk. Aynı test process’i kotayı bitirdi. `assertSee("Ad alanı…")` JSON’daki `\u0131` yüzünden patladı. Laravel `api/.env` olmayınca her test warning verdi.

**Ders:** `Cache::flush()` `setUp`’ta. Assertion `assertJsonPath`. Container’da `.env` yoksa entrypoint `.env.example` kopyalar (değerleri compose override eder).

### 2.10 “Bütün siteyi bitirelim” dürtüsü

**Ne oldu:** Nav linkleri (`/tr/sayfa/hakkimizda`, `/tr/portfoy` …) duruyor; sayfalar yok. Onları da yazmaya kalkmak Faz 1’i bitirmezdi.

**Ders:** Href’leri referanstaki gibi bırak. 404’ü `TD-005` olarak kaydet. Bir sprint = bir sayfa (veya aynı şablonlu bir aile: örn. statik kurumsal sayfalar).

### 2.11 Next.js’in belgeyi parçalaması

**Ne oldu:** Next metadata’yı body’den sonra stream eder. Referans tek parça HTML verir.

**Ders:** `htmlLimitedBots: /.*/` bilinçli. Yeni sayfada bunu “temizlemek” head sırasını bozar.

---

## 3. Sonraki sayfa için zorunlu sıra

Aşağıdaki sıra atlanırsa hız kaybı ve kayma tekrarlanır.

### Adım 0 — Kapsamı kilitle

1. Tek URL ailesi seç (ör. `/tr/sayfa/vizyon-misyon` + `/en` + `/de` karşılıkları).
2. Karşılıkları **tahmin etme**; referans `hreflang` / nav’dan oku.
3. Header/footer’a dokunma kararı: yalnızca sayfa gövdesi.

### Adım 1 — Snapshot (üç dil, aynı gün)

HTML’i kaydet. Bu, “doğru versiyon”un tek kaynağıdır.

```bash
mkdir -p reference/snapshots
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

curl -fsS -A "$UA" -o reference/snapshots/vizyon-misyon.tr.html https://startkey.com.tr/tr/sayfa/vizyon-misyon
curl -fsS -A "$UA" -o reference/snapshots/vizyon-misyon.en.html https://startkey.com.tr/en/sayfa/...
curl -fsS -A "$UA" -o reference/snapshots/vizyon-misyon.de.html https://startkey.com.tr/de/sayfa/...
```

EN/DE path’ini nav veya `link rel="alternate"` ile doğrula. 404 olan dili uydurma.

Ağ çağrıları varsa (lookup, liste API) ayrı JSON snapshot:

```bash
python3 scripts/fetch-reference-lookups.py   # arama/dropdown ailesi için model
```

Yeni endpoint ailesi için bu script’i kopyala; HTML’den path uydurma.

### Adım 2 — Asset’leri lokal al

```bash
# Ana sayfa listesi snapshot’tan türetilir; yeni sayfa için media script’ine
# o sayfanın snapshot path’ini ekle veya aynı algoritmayı yeni dosyada çalıştır.
./scripts/fetch-reference-assets.sh
```

- `fetch-reference-static.py` — origin CSS/JS/font/tema görseli; CSS `url()` takip edilir.
- `fetch-reference-media.py` — CDN/ImageKit’in **o markup’ta geçen** crop/webp dosyası.
- Mevcut dosya atlanır; bozuk indirmeyi yenilemek için `FORCE=1`.
- `failed>0` ise dur.

Doğru varyantı bulma kuralı: snapshot’taki `src` / `srcset` / `url()` **aynen**. Query string (`width`, `height`, `mode=Crop`, `quality`) layout’tur, süs değil.

### Adım 3 — Metni çıkar, çeviri yazma

Ana sayfa modeli:

```bash
python3 scripts/extract-reference-content.py
```

Yeni sayfa için ayrı extractor yaz: `homepage.{lang}.json` formatını zorla kullanma. Alanlar o sayfanın gerçek bölümleridir.

Çıkardıktan sonra `getHomepageContent` benzeri bir rewrite:

- `https://startkey.com.tr` → site-relative
- CDN/ImageKit → `/media/...`
- ReOS → Reonix, sağlayıcı img → Sinap

### Adım 4 — UI’ı mevcut iskelete tak

- Route: `web/src/app/[lang]/...` referans path ile aynı.
- Layout’u (`layout.tsx`) yeniden icat etme.
- Tema class adlarını koru (`section-title`, `ptb-100`, `bg-seashell` …).
- Tailwind ile “daha modern” bir blok ekleme.
- `dangerouslySetInnerHTML` yalnızca snapshot’tan gelen HTML için.
- Form/lookup varsa Laravel’e bağla; dummy ise seed + TD.

### Adım 5 — Docker’da çalıştır ve imajı güncelle

```bash
./start.sh
# veya yalnızca frontend değiştiyse:
docker compose up -d --build web
```

Kaynak dosyayı kaydetmek production imajını güncellemez.

### Adım 6 — Doğrula (görünüm + davranış)

Aşağıdaki checklist’i işaretlemeden “bitti” deme.

### Adım 7 — Borç ve changelog

- Geçici veri / bağlanmamış buton / eksik sayfa → `docs/TECHNICAL_DEBT.md` (mevcut TD’yi güncelle, gerekirse yeni TD).
- Kullanıcıya görünen yeni sayfa → `docs/CHANGELOG.md` en üste.

---

## 4. Kritik kontrol noktaları (checklist)

Her sayfa, her dil, her viewport. Tek screenshot yetmez.

### 4.1 Kapsam ve route

- [ ] Referans URL’si üç dilde açıldı, 200 alındı
- [ ] Lokal path referansla aynı (`/tr/sayfa/vizyon-misyon` gibi)
- [ ] `/` rewrite’ı ve diğer dillerin mevcut davranışı bozulmadı
- [ ] Dil değiştirince **aynı sayfanın** hedef dildeki karşılığına gidiliyor (yoksa TD + ana sayfaya düşme kararı açık yazıldı)

### 4.2 İçerik (tr / en / de ayrı)

- [ ] Title, description, robots, og, canonical/hreflang referanstaki gibi; olmayan tag uydurulmadı
- [ ] Görünen metin ilgili dil snapshot’ından; AI çevirisi yok
- [ ] `ReOS` kalmamış, Reonix/Sinap kuralı uygulanmış
- [ ] Runtime HTML’de `startkey.com.tr` veya `cdnc.re-os.com` hotlink yok

### 4.3 Görsel / responsive

Viewport seti: **1440**, **768**, **390**.

- [ ] Bölüm sırası referansla aynı
- [ ] Hero/banner `srcset` + webp/jpg çifti doğru
- [ ] Kart/görsel kırpma oranı kaymamış (yanlış CDN varyantı)
- [ ] Font (Roboto + ikon fontları) lokal; FOUT sonrası ölçü tutuyor
- [ ] Tablet: nav collapse, grid 2 kolon, arama/form satır kırılımı
- [ ] Mobil: hamburger, dil menüsü, stacked row, buton tam genişlik, taşan taşma yok
- [ ] Referanstaki “kirli” DOM (iç içe row, boş li, unknown tag) korunduysa yükseklik tutuyor

Kayma görürsen tahmin etme: `section-metrics` ile hangi bölüm kaymış, `computed-style` / `element-shot` / `crop-compare` ile neden.

### 4.4 Davranış

- [ ] Tema JS yüklü: jQuery, Bootstrap tab/collapse, AOS, owl, select2, Fancybox
- [ ] Konsolda tema runtime hatası yok (`console-check.mjs`)
- [ ] Dropdown, accordion, slider, video, form referanstaki gibi
- [ ] Dil menüsü çalışan imajdaki gerçek `href` ile çalışıyor
- [ ] Form varsa: geçersiz input, yetkisiz/geçersiz locale, rate limit, idempotency

### 4.5 Backend / güvenlik (sayfa API kullanıyorsa)

- [ ] Locale whitelist (`tr|en|de`); diğerleri 400
- [ ] Validation mesajı istek locale’ine göre
- [ ] Public write endpoint throttle’lı
- [ ] Secret yok; `.env` ve `.env.example` paralel
- [ ] PHPUnit: başarı, bozuk input, yetki/locale, edge, gerekirse idempotency
- [ ] Testler container içinde: `docker compose exec api php artisan test`

### 4.6 Docker

- [ ] `./start.sh` API 200 + web 200 ile bitiyor
- [ ] Web imajı bu sprint’in kaynağını içeriyor
- [ ] `.next/cache` `node` kullanıcısına yazılabilir (EACCES yok)

---

## 5. Scriptler — ne işe yarar, nasıl hızlandırır

Playwright script’leri host’a tarayıcı kurmaz. Kalıp:

```bash
docker run --rm --network host \
  -v "$PWD":/work -w /work \
  -e NODE_PATH=/work/scripts/.tools/node_modules \
  mcr.microsoft.com/playwright:v1.55.0-noble \
  node scripts/<dosya>.mjs <args>
```

`scripts/.tools` yoksa `scripts/visual-compare.sh` ilk çalıştırmada kurar.

### 5.1 Veri ve asset (sayfa kodundan önce)

| Script | Ne yapar | Sonraki sayfada |
| --- | --- | --- |
| `scripts/fetch-reference-assets.sh` | Favicon + static + media + jQuery | Yeni sayfa snapshot’ını media/static listesine ekle, çalıştır |
| `scripts/fetch-reference-static.py` | Origin CSS/JS/font; CSS içi `url()` | Snapshot klasöründeki `homepage-*.html` yerine yeni HTML adlarını bağla |
| `scripts/fetch-reference-media.py` | Tam CDN/ImageKit varyantı | Aynı: snapshot’tan URL çıkar, `FORCE=1` ile stale dosyayı yenile |
| `scripts/extract-reference-content.py` | Ana sayfa kopyasını JSON’a döker | Yeni sayfa için **yeni** extractor; selector’ları o HTML’den yaz |
| `scripts/fetch-reference-lookups.py` | Arama dropdown AJAX’ı | Portföy/ofis filtreleri için kopyala, path’leri network tab’dan al |
| `scripts/build-api-seed.py` | JSON içerik + lookup → `reference-seed.json` | Yeni CRM listesi varsa aynı birleştirme |

Doğru versiyon: snapshot tarihi + markup’taki URL. “En büyük görsel” veya “CDN kökü” doğru versiyon değildir.

### 5.2 Yapı ve metin farkı

| Script | Kullanım | Ne zaman |
| --- | --- | --- |
| `scripts/compare-with-reference.py` | `python3 scripts/compare-with-reference.py http://localhost:3000/tr reference/snapshots/homepage-tr.html` | DOM/metin sapması. `--section` ile daralt |
| `scripts/dom-probe.mjs` | `node scripts/dom-probe.mjs URL SELECTOR [depth]` | “Neden bu kadar nested?” |
| `scripts/text-metrics.mjs` | `node scripts/text-metrics.mjs URL SELECTOR` | Metin kutusunun genişliği kayınca |

### 5.3 Görsel fark

| Script | Kullanım | Ne zaman |
| --- | --- | --- |
| `scripts/visual-compare.sh` | `scripts/visual-compare.sh local http://localhost:3000/tr vizyon-tr` | 3 viewport + full page |
| | `scripts/visual-compare.sh reference https://startkey.com.tr/tr/sayfa/vizyon-misyon vizyon-tr` | Referans çekimi (canlı site açıkken) |
| `scripts/screenshot.mjs` | `visual-compare.sh` çağırır | `--wait` animasyon için |
| `scripts/diff-screenshots.py` | İki PNG’yi karşılaştırır | Pixel farkı |
| `scripts/crop-compare.py` | `crop-compare.py local.png ref.png TOP BOTTOM out.png` | Tek şeridi üst üste koy |
| `scripts/element-shot.mjs` | `node scripts/element-shot.mjs URL SELECTOR out.png [w] [h]` | Tek bölüm |
| `scripts/section-metrics.mjs` | `node scripts/section-metrics.mjs URL body 1440 900` | Hangi section kaç px kaymış |
| `scripts/computed-style.mjs` | `node scripts/computed-style.mjs URL SELECTOR "font-size,line-height,padding"` | CSS nedeni |
| `scripts/image-probe.mjs` / `font-probe.mjs` | URL + seçici | Yanlış dosya / font |

### 5.4 Davranış

| Script | Kullanım | Sonraki sayfada |
| --- | --- | --- |
| `scripts/verify-homepage.mjs` | `node scripts/verify-homepage.mjs http://localhost:3000` | Ana sayfa dumanı. Yeni sayfa için `verify-<sayfa>.mjs` kopyala: title, bölümler, dil, o sayfaya özgü tıklama |
| `scripts/console-check.mjs` | `node scripts/console-check.mjs URL` | 4xx asset, jQuery yok, tema patlaması |

### 5.5 Önerilen “tek sayfa” doğrulama paketi

```bash
# 1) Yapı
python3 scripts/compare-with-reference.py \
  http://localhost:3000/tr/sayfa/vizyon-misyon \
  reference/snapshots/vizyon-misyon.tr.html

# 2) Ekran (local + reference)
scripts/visual-compare.sh local \
  http://localhost:3000/tr/sayfa/vizyon-misyon vizyon-tr
scripts/visual-compare.sh reference \
  https://startkey.com.tr/tr/sayfa/vizyon-misyon vizyon-tr

# 3) Kayma varsa
# section-metrics her iki URL’de → fark hangi block
# element-shot + crop-compare o block için

# 4) Davranış
# verify-vizyon.mjs  (verify-homepage.mjs kopyası, o route’a göre)

# 5) API varsa
docker compose exec api php artisan test --filter=OSayfa
```

Üç dili ayrı çalıştır. TR’de tutan EN’de title/spacing ile bozulabilir.

---

## 6. Kesinlikle yapalım / kesinlikle yapmayalım

### Yapalım

- Bir sprintte **bir** sayfa (veya aynı Blade/şablon ailesi).
- Koddan önce üç dil snapshot + asset; `failed=0`.
- Mevcut `Header` / `Footer` / `ThemeStyles` / `ThemeScripts` / middleware’i koru.
- Referanstaki class, id, `data-bs-*`, `bind-*`, inline style’ı kopyala.
- CRM listesi için API + seed + TD; UI’ı Reonix bekletme.
- Frontend değişince **web imajını rebuild** et, sonra doğrula.
- Desktop + tablet + mobile; tıklama/form; sadece ilk boyama değil.
- Gözlemlenemeyen davranış için TD aç, uydurma.
- `.env` / `.env.example` birlikte; secret yazma.

### Yapmayalım

- AI ile tr→en/de çeviri.
- “Daha temiz” DOM, ekstra wrapper silme, Tailwind ile yeniden tasarım.
- Referansa runtime hotlink.
- Orijinal görseli alıp CSS ile kırpmak.
- Tüm nav sayfalarını aynı sprintte açmak.
- Kaynak dosyaya bakıp çalışan imajı doğrulanmış sanmak.
- Tema JS yüklenmeden dropdown/accordion testi (gizli locator timeout).
- API 200 olmadan `/tr` 200’e güvenmek (boş `data` 200 dönebilir; boyuta bak).
- Captcha/secret’ı referanstan kopyalamak.
- Başarısız testi assertion zayıflatarak geçirmek.
- `htmlLimitedBots` veya stylesheet sırasını “sadeleştirmek”.

### Daha pratik davranış

1. **Önce ölç, sonra yaz.** `compare-with-reference` + bir section screenshot, sonra JSX.
2. **Extractor’ı sayfaya özel tut.** Dev şablon selector’ı evrensel sanma.
3. **Layout’u paylaştır.** Yeni iş gövde + JSON içerik + varsa seed.
4. **Doğrulama script’ini ilk günden yaz.** `verify-homepage.mjs` kalıbı 20 dakikadır; 2 saatlik kör tıklamadan ucuz.
5. **Docker log’una bak.** 75 byte homepage, EACCES cache, tema `Failed to load` — tahmin etme.
6. **Hata döngüsü:** aynı kırık yaklaşımı en fazla iki kez dene; sonra dur, çıktıyı oku, yön sor.

---

## 7. Sayfa tiplerine göre not

### Statik kurumsal (vizyon, hakkımızda, yönetim)

- Çoğunlukla HTML gövde + lokal görseller.
- API gerekmez.
- Dil path’lerini nav’dan al.
- Checklist’in 4.5’i (write API) genelde düşer.

### Liste (portföy, ofis, danışman)

- HTML iskelet + kart tekrarı.
- Veri Reonix yoksa seed + TD-001 benzeri kayıt.
- Filtre/lookup için network tab → `fetch-reference-lookups.py` modeli.
- Pagination/carousel tema class’ları (`owl-carousel`) — kendi slider’ını yazma.

### Kurumsal yazı ailesi (haber, duyuru, blog, yönetim, şampiyon)

Tek tek statik sayfa yazma. Ortak şablon + CMS satırı:

```bash
python3 scripts/crawl-corporate.py
```

- Liste sayfalarını `pageIndex` bitene kadar tara; brifingdeki sayıyı doğrulama.
- Her kartın detay URL’sine gir; gövde HTML’sini al.
- EN/DE pager bazen TR slug bırakır (`/en/haberler`); alias’ı `config/site.php` `corporate` altında tut.
- Next catch-all (`[lang]/[...path]`) `GET /api/v1/corporate?path=` ile şablonu seçer. Yeni Superadmin satırı yeni Next sayfası gerektirmez.
- Şablonlar: `article-list` / `article-detail` / `people-list` / `people-detail` / `cms-page` / `champions`.
- Doğrulama: `node scripts/verify-corporate.mjs http://localhost:3000`

### Detay (tek ilan, tek ofis)

- Faz 1 kart `href`’leri zaten bu path’lere gidiyor.
- Dummy 1–2 kayıt yeterli; tüm portföyü çekme.
- `srcset` varyantları liste kartından farklı olabilir; snapshot’tan indir.

### Form (franchise, iletişim)

- Referans field name / validation DOM’unu koru.
- Post-submit metin görünmüyorsa TD-004 modeli.
- Throttle + locale + captcha derslerini aynen uygula.

---

## 8. “Bitti” tanımı

Bir sayfa ancak şunlar doğruysa biter:

1. Üç dil, referans metin ve head tag’leri.
2. Üç viewport, kabul edilebilir görsel fark (bilinçli marka değişimi hariç).
3. Public etkileşimler (menü, tab, form, dil) çalışan imajda denendi.
4. Lokal asset; referans host’a istek yok.
5. Geçici iş `TECHNICAL_DEBT.md`’de.
6. `CHANGELOG.md` güncel.

“Çalışıyor gibi görünüyor” bitti değildir.
