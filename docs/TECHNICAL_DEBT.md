# Teknik Borç

Faz 1 (ana sayfa) kapsamında bilerek geçici bırakılan uygulamalar.

### TD-001 — Ana sayfa CRM verileri referans anlık görüntüsünden geliyor

**Alan:** Backend / Ana sayfa

**Mevcut Durum:**

İstatistik şeridi, öne çıkan portföy kartları, popüler şehirler ve arama formu dropdown seçenekleri `web/src/content/homepage.{tr,en,de}.json` / `reference-seed.json` içindeki referans anlık görüntüsünden gelir.

2026-09-19 yenileme: sayaçlar 84 / 720 / 1082 / 35; seminer şeridi 6; TR öne çıkanlar 482977 ile başlar. EN/DE ana sayfa canlıdaki gibi ayrı ilan seti gösterir (`property_translations.is_featured`). Yeni ilanlar otomatik gelmez.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix’tir. Public sayfa yerel okuma kopyası gösterebilir. Superadmin portföy iş kaydı yazmaz.

**Gelecekteki Implementasyon:**

Seed verisi Reonix'ten gelen canlı portföy, ofis, şehir ve lookup verileri ile değiştirilecektir.

**Durum:** Açık

### TD-002 — Portal şifre sıfırlama ve sosyal giriş bağlı değil

**Alan:** Header / Footer / Portal

**Mevcut Durum:**

Referans sitedeki ReOS CRM butonları **Portal** olarak gösterilir ve `/portal` açılır. E-posta ve şifre Startkey API üzerinden doğrulanır; oturum çerezi tarayıcıda kalır, karşı uçtaki token tarayıcıya dönmez. “Şifremi Unuttum”, Google ve Office 365 hâlâ gerçek oturum açmaz.

**Geçici Olmasının Nedeni:**

Şifre sıfırlama ve sosyal giriş bu dilime alınmadı.

**Gelecekteki Implementasyon:**

Şifremi unuttum, Google ve Office 365 aynı portal oturumuna bağlanacak.

**Durum:** Açık

### TD-003 — Public form reCAPTCHA sunucu doğrulaması atlanıyor

**Alan:** Bülten formu / İletişim formu / Eğitim ön başvuru formu / Franchise başvuru formu / İlan detay iletişim formu

**Mevcut Durum:**

Public formlar görünür reCAPTCHA kutusu göstermez. `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` ve `RECAPTCHA_V3_SECRET_KEY` doluysa gönderimde görünmez reCAPTCHA v3 token’ı alınır ve API Google skorunu ile action adını doğrular. Bu anahtarlar boşken captcha yoktur; API doğrulamayı atlar ve hız sınırına dayanır. Eski v2 site key ve secret okunmaz.

**Geçici Olmasının Nedeni:**

Referans sitenin gizli anahtarı projeye kopyalanamaz. Projenin kendi v3 anahtar çifti henüz tanımlanmamıştır.

**Gelecekteki Implementasyon:**

Projenin kendi reCAPTCHA v3 site ve secret anahtarları `.env` / `.env.example` içine yazılacak; API Google doğrulamasını zorunlu kılacaktır.

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

Ofis ve danışman liste/detay şablonları eklendi (`/tr/ofisler`, `/1872`, `/tr/ofisler/{id}/{slug}`, `/tr/danismanlar`, `/tr/danismanlar/{id}/{slug}` ve EN/DE karşılıkları).

İngilizce ve Almanca footer’da KVKK / Hizmet Sözleşmesi etiketleri referansta boştur; bu dillerde o linkler gösterilmez. KVKK’nın EN/DE URL’si canlı sitede ana sayfaya düşer; dil değiştirince aynı davranış korunur.

**Geçici Olmasının Nedeni:**

Ofis/danışman sayfa boşluğu kapandı.

**Gelecekteki Implementasyon:**

Bu kayıt ofis ve danışman sayfaları içindir. Akademi yeniden tasarımı `TD-012` kapsamındadır.

**Durum:** Çözüldü

### TD-006 — Kurumsal CMS içeriği referans anlık görüntüsünden geliyor

**Alan:** Backend / Kurumsal sayfalar

**Mevcut Durum:**

Hakkımızda, vizyon-misyon, STARTKEY, Medyada Biz (yalnızca TR), yönetim kartları, haberler, duyurular, blog ve şampiyon grupları `api/database/data/corporate-seed.json` içindeki referans anlık görüntüsünden seed edilir. Next.js bu satırları paylaşılan şablonlara (`article-list`, `article-detail`, `people-list`, `cms-page`, `champions`) basar.

2026-09-19 yenileme: `/tr/sayfa/startkey`, `/en/page/startkey`, `/de/page/startkey` ve `/tr/sayfa/medyada-biz` eklendi. EN haber kategorisi “Media Us”, EN/DE blog kategorisi “General” olarak canlıdan alındı. DE STARTKEY gövdesi canlıda da boştur. Nav “Medyada Biz” her iki sitede `/tr/haberler` açar.

Türkçe listelerde İngilizce/Almanca karşılığı olmayan az sayıda kayıt vardır (duyuru 73/72/72, blog 41/39/39); o dillerde gösterilmezler.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin panelidir. CMS StartKey veritabanında kalır.

**Gelecekteki Implementasyon:**

Superadmin aynı CMS tablolarına (`cms_articles`, `cms_people`, `cms_pages`, `cms_champion_groups`) yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-007 — İletişim, eğitim ve Franchise başvuru sonucu mesajları referanstan alınamadı

**Alan:** İletişim formu / Eğitim ön başvuru formu / Franchise başvuru formu / İlan detay iletişim formu / i18n

**Mevcut Durum:**

Başarı, doğrulama, hız sınırı ve genel hata metinleri `web/src/content/public-form-status.ts` içinde tutulur. Referans sitenin canlı sisteme gönderim sonrası gösterdiği metinler gözlemlenemediği için bu dizeler proje içinde yazılmıştır. Gönderimler `contact_messages`, `training_applications`, `franchise_applications` ve `listing_inquiries` tablolarına yazılır; e-posta veya CRM iletimi yoktur.

**Geçici Olmasının Nedeni:**

Referans sitenin gerçek post-submit metinleri public olarak kaydedilemedi. İletişim, bülten, eğitim başvurusu ve danışman yorumu StartKey veritabanında kalır. Franchise ve danışman başvurusu Reonix’e gider. Portal bağlantısı varken ilan talebi Reonix’te kişi ve talep olur; yerel `listing_inquiries` satırı yazılmaz. Bağlantı yoksa yerel satır kalır.

**Gelecekteki Implementasyon:**

Referans sitedeki gerçek sonuç metinleri gözlemlendiğinde bu dosyadaki dizeler birebir değiştirilecektir. İletim hedefi netleşince kayıtlar o sisteme aktarılacaktır.

**Durum:** Açık

### TD-008 — Akademi ve İletişim içeriği referans anlık görüntüsünden geliyor

**Alan:** Backend / Akademi / İletişim

**Mevcut Durum:**

Seminer/eğitim kartları, detay metinleri ve İletişim sayfası `api/database/data/academy-seed.json` içindeki referans siteden çekilmiş anlık görüntüden seed edilir. Next.js bu satırları `training-list`, `training-detail` ve `contact` şablonlarına basar. Superadmin paneli henüz yazmadığı için yeni içerik API/veritabanına elle veya seed yenilemesi ile girer.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin panelidir. CMS StartKey veritabanında kalır.

**Gelecekteki Implementasyon:**

Superadmin aynı CMS tablolarına (`cms_trainings`, `cms_pages` contact kaydı) yazacak; public şablonlar değişmeden yeni satırı gösterecektir. Seed dosyası yalnızca ilk doldurma / felaket kurtarma kaynağı olarak kalır.

**Durum:** Açık

### TD-009 — Footer sayfaları referans anlık görüntüsünden geliyor

**Alan:** Backend / Footer sayfaları

**Mevcut Durum:**

Franchise başvuru, KVKK ve Hizmet Sözleşmesi `api/database/data/footer-seed.json` içindeki referans siteden çekilmiş anlık görüntüden seed edilir. Next.js Franchise’ı `franchise` şablonuna, KVKK ve Hizmet Sözleşmesi’ni `cms-page` şablonuna basar. Superadmin paneli henüz yazmadığı için yeni içerik API/veritabanına elle veya seed yenilemesi ile girer.

KVKK yalnızca Türkçe olarak mevcuttur; canlı sitede EN/DE karşılığı ana sayfaya düşer.

**Geçici Olmasının Nedeni:**

Nihai yazma arayüzü Superadmin panelidir. CMS StartKey veritabanında kalır.

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

Gönderimler şu an yerel tablolara da yazılır (`newsletter_subscribers`, `contact_messages`, `training_applications`, `franchise_applications`, `consultant_comments`). Franchise ve danışman başvurusu ayrıca Reonix’e gider. İletişim, bülten, eğitim başvurusu ve danışman yorumu StartKey veritabanında kalır. Portal bağlantısı varken ilan talebi yalnızca Reonix’e gider.

**Geçici Olmasının Nedeni:**

Referans sitenin canlı formuna gerçek veri gönderilmeden post-submit ekranı, toast’ı veya yönlendirmesi görülemedi.

**Gelecekteki Implementasyon:**

Bu kayıt özellikle sonradan incelenecek: her form için referanstaki doldurma-sonrası tepki gözlemlenip birebir uygulanacak (mesaj, yönlendirme, alan reset, hata yerleşimi).

**Durum:** Açık

### TD-011 — Portföy ilanları referans siteden alınan anlık görüntüden geliyor

**Alan:** Backend / Portföylerimiz

**Mevcut Durum:**

Portal bağlantısı varken `/tr/portfoy` ve ilan detayı Reonix’te listelenmiş portföyleri basar. Bağlantı yoksa şablon `cms_listings` satırlarını basar. Ana sayfa kartları hâlâ `portfolio-seed.json` anlık görüntüsündedir. Katalog fotoğrafı yoksa yerel boş işaret kullanılır.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix’tir. Seed, canlı listenin anlık kopyasıdır; yeni ilanlar otomatik gelmez. Superadmin ilan iş kaydı yazmaz.

**Gelecekteki Implementasyon:**

Aynı şablonlar Reonix’ten gelen okuma kopyasını gösterecektir. Seed dosyası yalnızca ilk doldurma kaynağı olarak kalır.

**Durum:** Açık

### TD-012 — Startkey Akademi yerel kopyası kaldırıldı, yeni tasarım yok

**Alan:** Frontend / Akademi

**Mevcut Durum:**

`/akademi` altındaki WordPress + LearnPress anlık görüntüsü, asset’leri, route’ları ve çekme script’leri silindi. Header’daki Çevrimiçi Eğitimler `https://startkeyakademi.net` adresini yeni sekmede açar. Kurumsal Seminerler / Eğitimler (`/tr/egitimlerimiz` ve EN/DE karşılıkları) duruyor.

**Geçici Olmasının Nedeni:**

Yerel kopya yeniden tasarlanacak. Yeni sayfa bu repoda henüz yok; canlı akademi sitesi menüden açılıyor.

**Gelecekteki Implementasyon:**

Yeni Akademi tasarımı ayrıca yapılacak. O gelene kadar `/akademi` bu projede sayfa değil.

**Durum:** Açık

### TD-013 — Ofis ve danışman kayıtları referans anlık görüntüsünden geliyor

**Alan:** Backend / Ofisler ve profesyoneller

**Mevcut Durum:**

Portal bağlantısı varken ofis ve danışman listesi ile detayı Reonix kayıtlarını basar. Bağlantı yoksa `offices-seed.json` anlık görüntüsü kullanılır. Danışman yorum formu yerel `consultant_comments` tablosuna yazar. Katalog fotoğrafı yoksa yerel boş işaret kullanılır.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix’tir. Seed, canlı listenin anlık kopyasıdır; yeni ofis veya danışman otomatik gelmez.

**Gelecekteki Implementasyon:**

Aynı `cms_offices` / `cms_consultants` tabloları Reonix’ten gelen okuma kopyasıyla dolacaktır. Superadmin bu kayıtların iş sistemi değildir.

**Durum:** Açık

### TD-014 — Danışman detayı Figma taslağı dummy yıl istatistikleri ve ortak sosyal linkler kullanıyor

**Alan:** Frontend / Danışman detay

**Mevcut Durum:**

Danışman detayının varsayılan görünümü Figma taslağına yakın yeni şablondur (`ConsultantDetailDraft`). `2025 Yılı:`, ciro etiketi `Ciro (TL)` + mock `186.400.000` (mobilde `186,4 Mn`) ve işlem yalnızca sayı (`64`) her danışmanda aynıdır; frontend’de sabittir, veritabanına yazılmaz. Kulüp altında gerçek kulüp alanı yerine navbar’daki renkli Startkey PNG logosu durur. Facebook / X / Instagram ikonları Startkey kurumsal hesaplarına gider. Hakkımda / Portföyler / Yorumlar alt blokları orijinal şablon markup’ını kullanır. Eski referans şablon `ConsultantDetail.tsx` ve seed değişmeden `?layout=classic` ile açılır. Yeni etiketlerin EN/DE karşılıkları referanstan alınmamıştır; düz karşılıklardır.

**Geçici Olmasının Nedeni:**

Ciro, işlem ve kulüp Reonix’ten kişiye özel gelmiyor. Kulübün iş anlamı henüz net değil. Sosyal hesaplar danışmana özel değil.

**Gelecekteki Implementasyon:**

Yıl istatistikleri ve kulüp Reonix’ten, StartKey portalı üzerinden danışmana özel gelecek. Sosyal ikonlar danışmanın kendi hesaplarına bağlanacak. `layout=classic` geçişi, eski şablon artık gerekmeyince kalkacak.

**Durum:** Açık

### TD-015 — Kurumsal ve Akademi SEO / hata sayfaları canlı siteden birebir kopya değil

**Alan:** Frontend / SEO / hata sayfaları

**Mevcut Durum:**

`/robots.txt`, `/sitemap.xml` ve `/llms.txt` yerel origin ile üretilir. Kurumsal sitemap, canlı `startkey.com.tr/sitemap.xml` içindeki 274 yolun anlık kopyasıdır; veritabanından üretilmez. Canlı Startkey `/llms.txt` aslında ana sayfa HTML’idir; yerelde ana sayfa SSS ve nav metinlerinden gerçek bir `text/plain` llms dosyası yazıldı. Canlı Startkey bilinmeyen URL’yi 302 ile ana sayfaya alır; yerelde Fela `.error-wrap` 404 vardır. TR 404 cümlesi eski Akademi `404-hata-2` metnidir. Canlıda EN/DE 404 sayfası olmadığı için o dillerde gövde cümlesi yazılmadı (yalnızca `404` + Home/Startseite). 500 sayfaları referansta yok; tema iskeleti + `500` + ana sayfa linki.

**Geçici Olmasının Nedeni:**

Canlı kurumsal sitede gerçek 404 ve gerçek llms.txt yok. Sitemap yolları yerel CMS’ten değil referans anlık görüntüsünden geliyor.

**Gelecekteki Implementasyon:**

Sitemap yerel CMS’ten üretilecek. EN/DE 404 metni referansta belirdiğinde alınacak.

**Durum:** Açık

### TD-016 — Danışman başvuru sayfasının gövdesi referans belgesinin tamamı değil

**Alan:** Frontend / Danışman başvuru

**Mevcut Durum:**

`/tr/danisman-basvuru`, `/en/consultant-form` ve `/de/consultant-form` form alanları, zorunlu metinler, pozisyonlar ve gönder düğmesi canlı sayfadan alındı. Ofis listesi canlıdaki 85 isim yerine portal ağındaki ofislerden gelir. TR gövdesi kısa bir özet; EN ve DE pazarlama gövdesi boş.

**Geçici Olmasının Nedeni:**

Başvuru akışı önce bağlandı. Sayfanın uzun tanıtım HTML’i ayrıca çekilmedi.

**Gelecekteki Implementasyon:**

Üç dilin tanıtım gövdesi canlı belgeden, franchise sayfasındaki gibi tam HTML olarak basılacak.

**Durum:** Açık

### TD-017 — %80 ölçek JS ve iframe ile verilen bazı ölçülere uygulanmıyor

**Alan:** Frontend / Ölçek (`--sk-scale`)

**Mevcut Durum:**

768px ve üstünde public sitede CSS uzunlukları ve görsel `width`/`height` öznitelikleri %80’e iniyor. CSS dışından verilen şu ölçüler referans boyutunda kalıyor: Owl Carousel kart aralığı (`bundle-app.js` içindeki `margin: 20`) ve Google reCAPTCHA kutusu (304×78). `/portal` bu ölçeği kullanmaz.

**Geçici Olmasının Nedeni:**

Bu ölçüler tema JS’i ve üçüncü taraf iframe ile veriliyor; tema JS’ini değiştirmek ölçek işinin kapsamı dışında tutuldu. React sayfalarının HTML’i istek anında işlenemediği için öznitelik ölçüleri listeyle eşleniyor.

**Gelecekteki Implementasyon:**

**Durum:** Açık

### TD-018 — Büyük video parçası ve sesli taslak portal ekranında yok

**Alan:** Portal / Portföy ve talep

**Mevcut Durum:**

Broker, agent ve ofis yöneticisi `/portal` içinde ofis işini ve ayar yazma formlarını Reonix’e kaydeder. Eşleşme, rozet, hizmet bedeli, hakediş oranı, abonelik ve fatura görüntüleme bu formlardadır. Parçalı büyük video ve sesli taslak portalda yoktur.

**Geçici Olmasının Nedeni:**

Parçalı büyük video ve sesli taslak ilk tura sığmadı. Bu işler StartKey tablosuna yazılmaz.

**Gelecekteki Implementasyon:**

Aynı izin listeli vekil üzerinden parçalı video ve sesli taslak da portal kabuğuna bağlanacak.

**Durum:** Açık

