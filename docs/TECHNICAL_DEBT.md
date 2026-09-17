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

### TD-005 — Ana sayfa dışındaki public sayfalar henüz yok

**Alan:** Navigasyon / arama formları

**Mevcut Durum:**

Header, footer, arama formu ve kart bağlantıları referans sitedeki yolları (`/tr/portfoy`, `/tr/ofisler`, `/tr/sayfa/hakkimizda` vb.) korur. Bu sayfalar Faz 2 kapsamındadır; tıklanınca Next.js 404 döner.

**Geçici Olmasının Nedeni:**

Faz 1 yalnızca ana sayfayı kapsar.

**Gelecekteki Implementasyon:**

Faz 2'de her public sayfa aynı incele → asset → içerik → UI döngüsü ile eklenecektir.

**Durum:** Açık
