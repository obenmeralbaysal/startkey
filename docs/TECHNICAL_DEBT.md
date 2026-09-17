# Teknik Borç

Faz 1 (ana sayfa) kapsamında bilerek geçici bırakılan uygulamalar.

### TD-001 — Ana sayfa CRM verileri referans anlık görüntüsünden geliyor

**Alan:** Backend / Ana sayfa

**Mevcut Durum:**

İstatistik şeridi, öne çıkan portföy kartları, popüler şehirler ve arama formu dropdown seçenekleri `api/database/data/reference-seed.json` içindeki referans siteden alınmış anlık görüntüden seed edilir. Laravel API bu satırları okur; Next.js sayfası her istekte API'den çeker.

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

**Alan:** Bülten formu

**Mevcut Durum:**

Form, referans sitede kullanılan genel reCAPTCHA v2 site key ile widget'ı gösterir. `RECAPTCHA_SECRET_KEY` boş olduğu için API, Google'a sunucu tarafı doğrulama göndermez; widget istemci tarafında çözülmeden gönderimi engeller ve endpoint hız sınırına dayanır.

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

### TD-005 — Ana sayfa ve Kurumsal dışındaki public sayfalar henüz yok

**Alan:** Navigasyon / arama formları

**Mevcut Durum:**

Header, footer ve arama formu referans sitedeki yolları korur. Kurumsal ailesi (`/tr/sayfa/hakkimizda`, `/tr/haberler`, `/tr/duyurular`, `/tr/bloglar`, `/tr/yonetim-kadrosu`, `/tr/sampiyonlar` ve dil karşılıkları) Faz 2'de eklendi. Portföy, ofis, franchise ve diğer public sayfalar tıklanınca Next.js 404 döner.

**Geçici Olmasının Nedeni:**

Bu sprint yalnızca Kurumsal menüsünü kapsar.

**Gelecekteki Implementasyon:**

Kalan public sayfalar aynı incele → asset → içerik → paylaşılan şablon döngüsü ile eklenecektir.

**Durum:** Açık

### TD-006 — Kurumsal CMS içeriği referans anlık görüntüsünden geliyor

**Alan:** Backend / Kurumsal sayfalar

**Mevcut Durum:**

Hakkımızda, vizyon-misyon, yönetim kartları, medyada biz, duyurular, blog ve şampiyon grupları `api/database/data/corporate-seed.json` içindeki referans siteden çekilmiş anlık görüntüden seed edilir. Next.js bu satırları paylaşılan şablonlara (`article-list`, `article-detail`, `people-list`, `cms-page`, `champions`) basar. Superadmin paneli henüz yazmadığı için yeni içerik API/veritabanına elle veya seed yenilemesi ile girer.

Türkçe listelerde İngilizce/Almanca karşılığı olmayan az sayıda kayıt vardır (duyuru 73/72/72, blog 41/39/39); o dillerde gösterilmezler.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin paneli ve ileride Reonix/CMS entegrasyonudur. Referans sitenin private backend'i kopyalanamaz.

**Gelecekteki Implementasyon:**

Superadmin aynı CMS tablolarına (`cms_articles`, `cms_people`, `cms_pages`, `cms_champion_groups`) yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık
