# Teknik Borç

Faz 1 (ana sayfa) kapsamında bilerek geçici bırakılan uygulamalar.

### TD-001 — Ana sayfa CRM verileri referans anlık görüntüsünden geliyor

**Alan:** Backend / Ana sayfa

**Mevcut Durum:**

İstatistik şeridi, öne çıkan portföy kartları, popüler şehirler ve arama formu dropdown seçenekleri `web/src/content/homepage.{tr,en,de}.json` / `reference-seed.json` içindeki referans anlık görüntüsünden gelir.

2026-09-19 yenileme: sayaçlar 84 / 720 / 1082 / 35; seminer şeridi 6; TR öne çıkanlar 482977 ile başlar. EN/DE ana sayfa canlıdaki gibi ayrı ilan seti gösterir (`property_translations.is_featured`). Yeni ilanlar otomatik gelmez.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix olacaktır. Reonix entegrasyon mimarisi henüz netleşmemiştir.

**Gelecekteki Implementasyon:**

Seed verisi Reonix'ten gelen canlı portföy, ofis, şehir ve lookup verileri ile değiştirilecektir.

**Durum:** Açık

### TD-002 — Reonix CRM giriş noktası boş

**Alan:** Header / Footer

**Mevcut Durum:**

Referans sitedeki ReOS CRM butonları proje kararı gereği Reonix olarak gösterilir. `NEXT_PUBLIC_REONIX_URL` boş olduğu için butonlar hedefi olmayan bir dış bağlantı olarak kalır.

**Geçici Olmasının Nedeni:**

Reonix giriş adresi henüz tanımlı değildir.

**Gelecekteki Implementasyon:**

`.env` içindeki `NEXT_PUBLIC_REONIX_URL` gerçek Reonix adresine set edilecek; butonlar o adresi açacaktır.

**Durum:** Açık

### TD-003 — Bülten reCAPTCHA sunucu doğrulaması atlanıyor

**Alan:** Bülten formu / İletişim formu / Eğitim ön başvuru formu / Franchise başvuru formu / İlan detay iletişim formu

**Mevcut Durum:**

Formlar, referans sitede kullanılan genel reCAPTCHA v2 site key ile widget’ı gösterir. `RECAPTCHA_SECRET_KEY` boş olduğu için API, Google’a sunucu tarafı doğrulama göndermez; widget istemci tarafında çözülmeden gönderimi engeller ve endpoint hız sınırına dayanır. Aynı site key ve aynı atlama davranışı bülten, İletişim, eğitim ön başvuru, Franchise başvuru ve ilan detay iletişim formlarında kullanılır.

**Geçici Olmasının Nedeni:**

Referans sitenin gizli anahtarı projeye kopyalanamaz. Kendi anahtar çifti henüz tanımlanmamıştır.

**Gelecekteki Implementasyon:**

Projenin kendi reCAPTCHA site ve secret anahtarları `.env` / `.env.example` içine yazılacak; API Google doğrulamasını zorunlu kılacaktır.

**Durum:** Açık

### TD-004 — Bülten gönderim sonucu mesajları referanstan alınamadı

**Alan:** Bülten formu / i18n

**Mevcut Durum:**

Başarı, doğrulama, hız sınırı ve genel hata metinleri `web/src/content/newsletter-status.ts` içinde tutulur. Referans sitenin canlı sisteme gönderim sonrası gösterdiği metinler gözlemlenemediği için bu dizeler proje içinde yazılmıştır. API doğrulama mesajları da aynı nedenle `api/lang/{tr,en,de}` altında tutulur.

**Geçici Olmasının Nedeni:**

Referans sitenin gerçek post-submit metinleri public olarak kaydedilemedi.

**Gelecekteki Implementasyon:**

Referans sitedeki gerçek sonuç metinleri gözlemlendiğinde bu dosyalardaki dizeler birebir değiştirilecektir.

**Durum:** Açık

### TD-005 — Ofis ve danışman public sayfaları henüz yok

**Alan:** Navigasyon / arama formları

**Mevcut Durum:**

Ofis ve danışman liste/detay şablonları eklendi (`/tr/ofisler`, `/1872`, `/tr/ofisler/{id}/{slug}`, `/tr/danismanlar`, `/tr/danismanlar/{id}/{slug}` ve EN/DE karşılıkları). Akademi alt sayfaları hâlâ yok (`TD-012`).

İngilizce ve Almanca footer’da KVKK / Hizmet Sözleşmesi etiketleri referansta boştur; bu dillerde o linkler gösterilmez. KVKK’nın EN/DE URL’si canlı sitede ana sayfaya düşer; dil değiştirince aynı davranış korunur.

**Geçici Olmasının Nedeni:**

Ofis/danışman sayfa boşluğu kapandı. Kalan boşluk akademi alt yollarıdır.

**Gelecekteki Implementasyon:**

Akademi alt sayfaları `TD-012` kapsamında ele alınır.

**Durum:** Çözüldü

### TD-006 — Kurumsal CMS içeriği referans anlık görüntüsünden geliyor

**Alan:** Backend / Kurumsal sayfalar

**Mevcut Durum:**

Hakkımızda, vizyon-misyon, STARTKEY, Medyada Biz (yalnızca TR), yönetim kartları, haberler, duyurular, blog ve şampiyon grupları `api/database/data/corporate-seed.json` içindeki referans anlık görüntüsünden seed edilir. Next.js bu satırları paylaşılan şablonlara (`article-list`, `article-detail`, `people-list`, `cms-page`, `champions`) basar.

2026-09-19 yenileme: `/tr/sayfa/startkey`, `/en/page/startkey`, `/de/page/startkey` ve `/tr/sayfa/medyada-biz` eklendi. EN haber kategorisi “Media Us”, EN/DE blog kategorisi “General” olarak canlıdan alındı. DE STARTKEY gövdesi canlıda da boştur. Nav “Medyada Biz” her iki sitede `/tr/haberler` açar.

Türkçe listelerde İngilizce/Almanca karşılığı olmayan az sayıda kayıt vardır (duyuru 73/72/72, blog 41/39/39); o dillerde gösterilmezler.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin paneli ve ileride Reonix/CMS entegrasyonudur. Referans sitenin private backend'i kopyalanamaz.

**Gelecekteki Implementasyon:**

Superadmin aynı CMS tablolarına (`cms_articles`, `cms_people`, `cms_pages`, `cms_champion_groups`) yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-007 — İletişim, eğitim ve Franchise başvuru sonucu mesajları referanstan alınamadı

**Alan:** İletişim formu / Eğitim ön başvuru formu / Franchise başvuru formu / İlan detay iletişim formu / i18n

**Mevcut Durum:**

Başarı, doğrulama, hız sınırı ve genel hata metinleri `web/src/content/public-form-status.ts` içinde tutulur. Referans sitenin canlı sisteme gönderim sonrası gösterdiği metinler gözlemlenemediği için bu dizeler proje içinde yazılmıştır. Gönderimler `contact_messages`, `training_applications`, `franchise_applications` ve `listing_inquiries` tablolarına yazılır; e-posta veya CRM iletimi yoktur.

**Geçici Olmasının Nedeni:**

Referans sitenin gerçek post-submit metinleri public olarak kaydedilemedi. Reonix/mail entegrasyonu henüz yok.

**Gelecekteki Implementasyon:**

Referans sitedeki gerçek sonuç metinleri gözlemlendiğinde bu dosyadaki dizeler birebir değiştirilecektir. İletim hedefi netleşince kayıtlar o sisteme aktarılacaktır.

**Durum:** Açık

### TD-008 — Akademi ve İletişim içeriği referans anlık görüntüsünden geliyor

**Alan:** Backend / Akademi / İletişim

**Mevcut Durum:**

Seminer/eğitim kartları, detay metinleri ve İletişim sayfası `api/database/data/academy-seed.json` içindeki referans siteden çekilmiş anlık görüntüden seed edilir. Next.js bu satırları `training-list`, `training-detail` ve `contact` şablonlarına basar. Superadmin paneli henüz yazmadığı için yeni içerik API/veritabanına elle veya seed yenilemesi ile girer.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin paneli ve ileride Reonix/CMS entegrasyonudur. Referans sitenin private backend’i kopyalanamaz.

**Gelecekteki Implementasyon:**

Superadmin aynı CMS tablolarına (`cms_trainings`, `cms_pages` contact kaydı) yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-009 — Footer sayfaları referans anlık görüntüsünden geliyor

**Alan:** Backend / Footer sayfaları

**Mevcut Durum:**

Franchise başvuru, KVKK ve Hizmet Sözleşmesi `api/database/data/footer-seed.json` içindeki referans siteden çekilmiş anlık görüntüden seed edilir. Next.js Franchise’ı `franchise` şablonuna, KVKK ve Hizmet Sözleşmesi’ni `cms-page` şablonuna basar. Superadmin paneli henüz yazmadığı için yeni içerik API/veritabanına elle veya seed yenilemesi ile girer.

KVKK yalnızca Türkçe olarak mevcuttur; canlı sitede EN/DE karşılığı ana sayfaya düşer.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin paneli ve ileride Reonix/CMS entegrasyonudur. Referans sitenin private backend’i kopyalanamaz.

**Gelecekteki Implementasyon:**

Superadmin aynı `cms_pages` satırlarına yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-010 — Form doldurma sonrası tepkiler henüz referansla doğrulanmadı (inceleme notu)

**Alan:** Tüm public formlar / post-submit davranış

**Mevcut Durum:**

Public formlar doldurulup gönderildikten sonra kullanıcıya gösterilen tepki (başarı mesajı, hata mesajı, sayfanın yerinde kalması, yönlendirme, alan temizleme, captcha sıfırlama) referans siteden canlı gönderim yapılarak gözlemlenemedi. Bu yüzden şu anki davranış proje içinde yazılmış geçici metinler ve yerel kayıt üzerinedir; referanstaki gerçek tepki olduğu varsayılmamalıdır.

Kapsam:

* Ana sayfa bülten formu (`TD-004`)
* İletişim formu (`TD-007`)
* Eğitim / seminer ön başvuru formu (`TD-007`)
* Franchise başvuru formu (`TD-007`)
* İlan detay iletişim formu (`TD-007`)
* Danışman yorum formu (`TD-013`)

Gönderimler şu an yalnızca yerel tablolara yazılır (`newsletter_subscribers`, `contact_messages`, `training_applications`, `franchise_applications`, `listing_inquiries`, `consultant_comments`). Referans sitedeki e-posta, CRM veya teşekkür sayfası davranışı kopyalanmadı.

**Geçici Olmasının Nedeni:**

Referans sitenin canlı formuna gerçek veri gönderilmeden post-submit ekranı, toast’ı veya yönlendirmesi görülemedi.

**Gelecekteki Implementasyon:**

Bu kayıt özellikle sonradan incelenecek: her form için referanstaki doldurma-sonrası tepki gözlemlenip birebir uygulanacak (mesaj, yönlendirme, alan reset, hata yerleşimi).

**Durum:** Açık

### TD-011 — Portföy ilanları referans siteden alınan anlık görüntüden geliyor

**Alan:** Backend / Portföylerimiz

**Mevcut Durum:**

Liste ve detay şablonları `cms_listings` / `cms_listing_translations` satırlarını basar. Veri `api/database/data/portfolio-seed.json` içindeki referans anlık görüntüsüdür (çekim: 61 sayfa / 721 ilan, tr/en/de). Filtre ve sıralama bu satırlar üzerinde çalışır. Bazı CDN görselleri canlıda 404/500 verdiği için yerelde yoktur. 456346 canlı listede duruyor ancak detay URL’si ana sayfaya düşer; satır liste kartından tamamlandı.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix / Superadmin olacaktır. Seed, canlı listenin anlık kopyasıdır; yeni ilanlar otomatik gelmez.

**Gelecekteki Implementasyon:**

Aynı şablonlar değişmeden Reonix veya Superadmin’in yazacağı `cms_listings` satırlarını gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-012 — Startkey Akademi (startkeyakademi.net) ayrı site olarak henüz tamamlanmadı

**Alan:** Frontend / Akademi sitesi (`/akademi`)

**Mevcut Durum:**

`startkey.com.tr/akademi` = `startkeyakademi.net/`. Bu bir WordPress kurulumu değildir; kurumsal site Next.js + Laravel’dir. Akademi, referans LMS’in (WordPress + LearnPress) public HTML anlık görüntüsüdür. Anasayfa, Akademi, Eğitimler (3 sayfa + 23 detay + kategori/term filtre sayfaları), giriş/kayıt, eğitmenler + profiller, 7 kategori, 3 blog yazısı + makale arşivi, sepet/ödeme/kontrol paneli, ders `egitim-erisimi` koruma ekranları ve footer hukuki sayfalar LiteSpeed UCSS’siz belgelerden lokal asset’lerle sunulur. Kurumsal header/footer/tema kullanılmaz. Alt yollar `/akademi` altına map edilir. Referansta EN/DE yoktur; çeviri yazılmadı.

Eğitimler sol “Filtrele” formu ve eğitim detayındaki “Yorumlar” puan özeti referanstan HTML olarak gömülüdür; WordPress REST’e gitmez. Filtre Uygula, çekilmiş `?term_id=` sayfalarına gider; tek eğitmen seçimi ilgili `/akademi/egitmen/{slug}/` profiline gider. Referanstaki 23 eğitimin tamamında canlı yorum yoktur (0.0 / boş liste); bu yüzden yorum metni görünmez. Yeni yorum yazma, giriş, sepet, ödeme, “Sepete Ekle”, iletişim/abone ve wishlist WordPress’e post etmez. Ders sayfaları referanstaki koruma metnini gösterir (“giriş yapın ya da kayıt olun”); gerçek video LMS oturumu olmadan açılmaz. Recaptcha / Cloudflare / gtag çıkarılmıştır. LiteSpeed gecikmeli JS DOMContentLoaded’da zorlanır. SSS nested-tabs chunk HTML içine gömülür. `mockup-home-300x300.webp` ve `learnpress/images/icons/ico-ai.svg` referansta HTML döndüğü için indirilmedi. `global.min.js` referansta 0 bayttır. Kurs tanıtım Vimeo’su startkeyakademi.net dışındaki host’ta 403 verebilir. Akademi daha sonra bu projeden ayrılacaktır.

**Geçici Olmasının Nedeni:**

LMS, ödeme ve hesap backend’i yok; public sayfalar anlık görüntü. Nihai hedef akademinin ayrı bir uygulamaya taşınmasıdır.

**Gelecekteki Implementasyon:**

Aynı incele → asset → içerik döngüsü ile kalan alt sayfalar eklenecek; giriş/ödeme ve iletişim formu bağlanacak. Ayrılma sırasında `/akademi` ağacı, `web/public/akademi` asset’leri ve `scripts/fetch-akademi-net.py` birlikte taşınacak.

**Durum:** Açık

### TD-013 — Ofis ve danışman kayıtları referans anlık görüntüsünden geliyor

**Alan:** Backend / Ofisler ve profesyoneller

**Mevcut Durum:**

84 ofisin ve 1082 danışmanın tamamı `api/database/data/offices-seed.json` içinden üç dilde seed edilir. Ofis/danışman portföy karuselleri çekilmiş 721 ilan içindeki ID’leri gösterir. Danışman yorum formu canlı `/tr/Consultant/SendComment` yerine yerel `/api/v1/consultants/{id}/comments` yazar; moderasyon/CRM yok.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix olacaktır. Seed, canlı listenin anlık kopyasıdır; yeni ofis/danışman otomatik gelmez.

**Gelecekteki Implementasyon:**

Aynı `cms_offices` / `cms_consultants` tabloları Reonix veya Superadmin ile doldurulacak; şablonlar değişmeden tam detay ve gerçek portföyleri gösterecektir.

**Durum:** Açık
