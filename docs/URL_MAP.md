# URL Farkları ve Önerilen Yönlendirmeler

**Tarih:** 2026-10-24

Canlı startkey.com.tr ile yerel site arasındaki URL farklarının listesidir. Canlıya geçişte arama motorundaki eski adreslerin kaybolmaması için 301 yönlendirmesi bu listeden kurulur. Bu dosya yalnızca listedir; yönlendirme kuralı henüz yazılmadı.

Kaynak: canlı sitenin tr/en/de ana sayfasından iki seviye taranan 843 bağlantı (630 örnek) ve sayfa ailelerinin dil değiştirici hedefleri. Yerel taraf `http://localhost:3030` çalışan imajıdır.

Yerel dil değiştirici bilinçli olarak hedef dilin slug’ına gider. Referans çoğu sayfada Türkçe slug’ı korur. Fark `docs/TECHNICAL_DEBT.md` TD-019 kaydındadır.

---

## 1. Referansta açılan, yerelde 404 veren adresler

| Referans URL | Yerel karşılık | Önerilen 301 hedefi | Not |
| --- | --- | --- | --- |
| `/en/page/hakkimizda` | `/en/page/about-us` | `/en/page/about-us` | Referans dil değiştiricinin hedefi |
| `/de/page/hakkimizda` | `/de/page/uber-uns` | `/de/page/uber-uns` | 〃 |
| `/en/page/vizyon-misyon` | `/en/page/our-vision-mission` | `/en/page/our-vision-mission` | 〃 |
| `/de/page/vizyon-misyon` | `/de/page/unsere-vision-mission` | `/de/page/unsere-vision-mission` | 〃 |
| `/en/page/medyada-biz` | yok | `/tr/sayfa/medyada-biz` | Referansta EN/DE sayfası yok, dil değiştirici bu adrese gider |
| `/de/page/medyada-biz` | yok | `/tr/sayfa/medyada-biz` | 〃 |
| `/en/page/kvkk` | yok | `/tr/sayfa/kvkk` | KVKK yalnızca Türkçe |
| `/de/page/kvkk` | yok | `/tr/sayfa/kvkk` | 〃 |
| `/en/office-list` | `/en/offices` | `/en/offices` | Referans dil değiştirici hedefi |
| `/en/consultant-list` | `/en/agents` | `/en/agents` | 〃 |
| `/de/consultant-list` | `/de/immobilienmakleren` | `/de/immobilienmakleren` | 〃 |
| `/tr/portfoy/{id}/…`, `/en/property/{id}/…`, `/de/immobilien/{id}/…` | Portal kataloğundaki ilan | — | Yerelde portföy verisi yok (TD-011). Canlıda ilan Portal’dan gelir; kapanmış ilan için hedef liste sayfasıdır. |
| `/{tr,en,de}/danismanlar|agents|immobilienmakleren/32866/1872` | yok | ilgili ofis sayfası | Referansta ofis hesabı danışman olarak listeleniyor; yerel katalog ofis adlı danışmanı bilerek düşürür |

## 2. Dil değiştirici hedefleri farklı olan sayfalar

İki taraf da 200 döner; yalnızca değiştiricinin seçtiği adres farklıdır. Yönlendirme gerekmez, referans adresi yerelde de açılır.

| Türkçe sayfa | Referans EN / DE hedefi | Yerel EN / DE hedefi |
| --- | --- | --- |
| `/tr/haberler/{id}/{slug}` | `/en/news/{id}/{tr-slug}`, `/de/nachricht/{id}/{tr-slug}` | aynı id, hedef dilin slug’ı |
| `/tr/duyuru-detay/{id}/{slug}` | `/en/announcements-detail/{id}/{tr-slug}` … | aynı id, hedef dilin slug’ı |
| `/tr/bloglar/{id}/{slug}` | `/en/blogs/{id}/{tr-slug}` … | aynı id, hedef dilin slug’ı |
| `/tr/sayfa/startkey` | `/en`, `/de` | `/en/page/startkey`, `/de/page/startkey` |
| `/tr/sayfa/medyada-biz`, `/tr/sayfa/kvkk` | `/en/page/…` (404) | `/en`, `/de` |
| `/tr/ofisler/{id}/{slug}` | `/en/offices/{id}/{slug}`, `/de/anbieteren/{id}/{slug}` | `/en/{slug}`, `/de/{slug}` (kök ofis adresi, 200) |
| `/tr/ofislerimiz` | `/en/office-list`, `/Home` | `/en/offices`, `/de/anbieteren` |

`/{lang}/{id}/{slug}` biçimli detay adresleri slug’dan bağımsız id ile çözülür; Türkçe slug ile gelen istek de açılır.

## 3. Referans dil değiştirici adresleri

Referans `/{lang}/Settings/ChangeCulture?langCode=…&routeName=…` kullanır. Yerel değiştirici `returnPath` parametresi ister.

| Referans biçimi | Yerel davranış | Öneri |
| --- | --- | --- |
| `/tr/Settings/ChangeCulture?langCode=en&routeName=ContentPage_tr&url=hakkimizda` | 307 → `/en` | `noindex` olduğundan yönlendirme gerekmez; dış bağlantı varsa `/en` yeterli |
| `/tr/Settings/ChangeCulture/{id}?langCode=en&routeName=BlogDetail_tr&seoUrl=…` | 404 | Detay ailesi için `routeName` + id ile ilgili detay sayfasına 301 |

## 4. Yerelde takma ad olarak açık tutulanlar

Bu adresler yerelde 200 döner, kanonik adres farklıdır (`api/config/site.php`).

| Takma ad | Kanonik |
| --- | --- |
| `/en/egitim-detay/{id}/…`, `/de/egitim-detay/{id}/…` | `/en/education-detail/{id}/…`, `/de/education-detail/{id}/…` |
| `/en/egitimlerimiz`, `/de/egitimlerimiz` | `/en/our-educations`, `/de/our-educations` |
| `/en/haberler`, `/de/haberler` | `/en/news`, `/de/nachricht` |
| `/en/duyurular`, `/de/duyurular`, `/en/duyuru-detay/…`, `/de/duyuru-detay/…` | `/en/announcements…`, `/de/ankundigungen…` |
| `/en/bloglar`, `/de/bloglar` | `/en/blogs`, `/de/blogs` |
| `/en/kadro-detay/…`, `/de/kadro-detay/…` | `/en/people-detail/…`, `/de/people-detail/…` |
| `/en/iletisim`, `/de/iletisim` | `/en/contact`, `/de/kontakt` |
| `/en/franchise-basvuru`, `/de/franchise-basvuru` | `/en/franchise-form`, `/de/franchise-form` |
| `/en/portfoy`, `/de/portfoy`, `/tr/property` | `/en/property`, `/de/immobilien`, `/tr/portfoy` |
| `/en/ofislerimiz`, `/de/ofislerimiz` | `/en/offices`, `/de/anbieteren` (`/tr/ofisler` ve `/tr/ofislerimiz` ikisi de referansta kullanılıyor) |
| `/en/danisman-liste`, `/de/danisman-liste` | `/en/agents`, `/de/immobilienmakleren` (`/tr/danismanlar` ve `/tr/danisman-liste` ikisi de referansta kullanılıyor) |

Kök seviyedeki ofis adresleri (`/1872`, `/aplus`, `/{lang}/{ofis}`) iki tarafta da açılır.
