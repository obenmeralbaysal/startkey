# Teknik Borç

Faz 1 (ana sayfa) kapsamında bilerek geçici bırakılan uygulamalar.

### TD-022 — Franchise ağ ekranları mock ile görüntülenir

**Alan:** Portal / Franchise ağı

**Mevcut Durum:**

`/portal/network` ve `/portal/network/summary` canlıda `GET /api/v1/portal/network/summary` okur; `/offices` ve `/consultants` aynı vekilin listelerini okur. `NEXT_PUBLIC_PORTAL_NETWORK_MOCK=1` iken aynı üç ekran yerel fixture basar.

**Geçici Olmasının Nedeni:**

Ekran görüntüsü ve oturumsuz önizleme için mock durur. Canlı liste StartKey vekilindedir.

**Gelecekteki Implementasyon:**

Mock üretimde kapalı kalır.

**Durum:** Açık

### TD-001 — Ana sayfa CRM verileri referans anlık görüntüsünden geliyor

**Alan:** Backend / Ana sayfa

**Mevcut Durum:**

Portal bağlantısı varken öne çıkan portföy kartları, popüler şehir kaydırıcısı ve ofis ile danışman arama listeleri Reonix katalogundan gelir. Şehir kartı, yayındaki ilanı olan illerden kurulur; plaka kodu kayıtlı bir şehir fotoğrafıyla eşleşirse o fotoğraf kullanılır. İstatistik şeridi ve diğer arama seçenekleri referans anlık görüntüsünden gelir.

2026-09-19 yenileme: sayaçlar 84 / 720 / 1082 / 35; seminer şeridi 6. Portal bağlı değilken öne çıkanlar ve şehirler hâlâ anlık görüntüden gelir.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix’tir. Public sayfa yerel okuma kopyası gösterebilir. Superadmin portföy iş kaydı yazmaz.

**Gelecekteki Implementasyon:**

Seed verisi Reonix'ten gelen canlı portföy, ofis, şehir ve lookup verileri ile değiştirilecektir.

**Durum:** Açık

### TD-002 — Portal şifre sıfırlama ve sosyal giriş bağlı değil

**Alan:** Header / Footer / Portal

**Mevcut Durum:**

“Şifremi Unuttum” portalda e-posta ister. Bağlantı StartKey `/portal/reset-password` adresine gider ve şifre Reonix’te güncellenir. Google ve Office 365 girişi istenmedi.

**Geçici Olmasının Nedeni:**

Şifre sıfırlama bağlı değildi. Sosyal giriş kapsam dışı bırakıldı.

**Gelecekteki Implementasyon:**

Şifre sıfırlama bağlandı. Sosyal giriş eklenmeyecek.

**Durum:** Çözüldü

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

Türkçe listelerde İngilizce/Almanca karşılığı olmayan az sayıda kayıt vardır (duyuru 74/73/73, blog 42/40/40); o dillerde gösterilmezler.

2026-10-24 yenileme: anlık görüntü yeniden alındı (blog 1249, duyuru 1526, yönetim 599 eklendi). Akış: `scripts/crawl-corporate.py` → `scripts/migrate-tailwind-classes.py --seed api/database/data/corporate-seed.json` → `CorporateDataSeeder`. `--seed` adımı `web/src/styles/cms-classes.txt` dosyasını da yeniler; Tailwind CMS HTML’indeki sınıfları bu dosyadan üretir. Referans ImageKit adresi artık `ik.imagekit.io/startkey/` (ve tek tük başka hesaplar); crawler’lar her hesabı `/media/` altına çevirir.

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

2026-10-24 yenileme: referans listesi 16 eğitim gösterir (4 devam eden, 12 tamamlanan). Listede olmayan eski eğitimler seed sırasında `archived` grubuna alınır; listede görünmez, detay adresi açık kalır (referans da eski detayları açar). Ücretli eğitimlerin “Ödeme Bilgileri” bloğu `form.paymentHtml` alanında tutulur. EN/DE detay yolu `/{en,de}/education-detail/…`; eski `/{en,de}/egitim-detay/…` takma ad olarak açıktır.

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

2026-10-24 yenileme: anlık görüntü yeniden alındı; franchise sunum PDF’i değişti.

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

Portal bağlantısı varken `/tr/portfoy` ve ilan detayı Reonix’te listelenmiş portföyleri basar. Bağlantı yoksa şablon `cms_listings` satırlarını basar. Ana sayfa kartları hâlâ `portfolio-seed.json` anlık görüntüsündedir. Fotoğrafı olan kayıt StartKey üzerinden gösterilir. Fotoğrafı olmayan kayıtta yerel boş işaret kalır.

2026-10-24 yerel durum: Portal bağlantısı yapılandırılmamış ve `portfolio-seed.json` (Git dışı) diskte yok. Portföy listesi boş, referanstaki ilan detayları 404 verir; danışman detayındaki ilan sekmesi boştur. Boş listenin başlığı referansla aynıdır (`Startkey Türkiye | Portföylerimiz`, `| Our Properties`, `| Unsere Portfolios`).

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

Portal bağlantısı varken ofis ve danışman listesi ile detayı Reonix kayıtlarını basar. Bağlantı yoksa `offices-seed.json` anlık görüntüsü kullanılır. Danışman yorum formu yerel `consultant_comments` tablosuna yazar. Fotoğrafı olan kayıt StartKey üzerinden gösterilir. Fotoğrafı olmayan kayıtta yerel boş işaret kalır.

**Geçici Olmasının Nedeni:**

Nihai veri kaynağı Reonix’tir. Seed, canlı listenin anlık kopyasıdır; yeni ofis veya danışman otomatik gelmez.

**Gelecekteki Implementasyon:**

Aynı `cms_offices` / `cms_consultants` tabloları Reonix’ten gelen okuma kopyasıyla dolacaktır. Superadmin bu kayıtların iş sistemi değildir.

**Durum:** Açık

### TD-014 — Danışman detayı Figma taslağı dummy yıl istatistikleri ve ortak sosyal linkler kullanıyor

**Alan:** Frontend / Danışman detay

**Mevcut Durum:**

Public danışman sayfası referans şablondur (`ConsultantDetail`). Figma taslağı (`ConsultantDetailDraft`) aynı adreste `?layout=draft` ile durur. Taslaktaki `2025 Yılı:`, ciro etiketi `Ciro (TL)` + mock `186.400.000` (mobilde `186,4 Mn`) ve işlem sayısı `64` her danışmanda aynıdır; frontend’de sabittir. Kulüp görseli ve sosyal ikonlar hâlâ ortak placeholder’dır.

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

`/tr/danisman-basvuru`, `/en/consultant-form` ve `/de/consultant-form` form alanları canlı sayfadan alınır. Tanıtım gövdesi `api/database/data/consultant-bodies/` içindeki canlı HTML’dir. Görseller `/media/micrositecontent/` altındadır. Ofis listesi portal ağındaki ofislerden gelir.

**Geçici Olmasının Nedeni:**

Tanıtım gövdesi bağlandı.

**Gelecekteki Implementasyon:**

Gövde canlı belgeden alındı. Ofis seçenekleri portal ağına bağlı kalır.

2026-10-24: gövdenin yalnızca `hw-wrap` bölümü alınmıştı. `scripts/crawl-consultant-body.py` artık formdan footer’a kadar tüm gövdeyi alır: başvuru / sunum düğmeleri ve iki iş ortağı kaydırıcısı. Sunum PDF’i `/media/content/` altındadır.

**Durum:** Çözüldü

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

Broker, agent ve ofis yöneticisi `/portal` içinde ofis işini Reonix’e kaydeder. Parçalı büyük dosya, sesli portföy ve talep taslağı, hizmet bedeli dilimi ve takvim rozeti de bu kabuktadır.

**Geçici Olmasının Nedeni:**

Bu işler ilk turda portal kabuğuna bağlanmamıştı.

**Gelecekteki Implementasyon:**

Aynı izin listeli vekil üzerinden bağlandı.

**Durum:** Çözüldü

### TD-019 — Dil değiştirici referanstan farklı adrese gider

**Alan:** Frontend / Dil değiştirme / SEO

**Mevcut Durum:**

Yerel dil değiştirici aynı kaydın hedef dildeki slug’ına gider (`/tr/sayfa/hakkimizda` → `/en/page/about-us`). Referans çoğu sayfada Türkçe slug’ı korur (`/en/page/hakkimizda`) ve bazı hedefleri yerelde yoktur (`/en/office-list`, `/en/consultant-list`). KVKK ve Medyada Biz yerelde dil ana sayfasına düşer. Ofis detayı yerelde kök ofis adresine (`/en/laya`) gider. Referansın `routeName` biçimli `ChangeCulture` adresi yerelde dil ana sayfasına veya 404’e düşer. Tam liste `docs/URL_MAP.md` içindedir.

**Geçici Olmasının Nedeni:**

Kullanıcı kararı: yerel davranış kalır, fark kayda geçer. Canlıya geçişte eski adreslerin kaybolmaması için yönlendirme gerekir.

**Gelecekteki Implementasyon:**

`docs/URL_MAP.md` içindeki referans adresleri için 301 yönlendirmesi kurulacak.

**Durum:** Açık

### TD-021 — Mobil menü erişilebilirlik etiketleri referanstan alınmadı

**Alan:** Frontend / Header / i18n

**Mevcut Durum:**

Hamburger ve kapatma düğmelerinin ekran okuyucu etiketleri (`Menüyü aç` / `Menüyü kapat`, `Open menu` / `Close menu`, `Menü öffnen` / `Menü schließen`) `web/src/components/layout/Header.tsx` içindeki `MENU_LABELS` sabitindedir. Referansta bu düğmelerin etiketi yoktur; metinler proje içinde yazıldı. Menüdeki logo, düğmeler, aktif sayfa vurgusu ve tek dil seçici referansın mobil menüsünden bilinçli sapmadır (kullanıcı kararı).

**Geçici Olmasının Nedeni:**

Referansta karşılığı olmayan metin. Header metinleri henüz içerik JSON’undan veya CMS’ten gelmiyor.

**Gelecekteki Implementasyon:**

Etiketler header içeriğiyle birlikte dil dosyasına (`web/src/content/homepage.{tr,en,de}.json`) veya Superadmin’e taşınacak; metinler marka ekibince onaylanacak.

**Durum:** Açık

### TD-020 — Referans gövde tipografisi yalnızca iç sayfalarda

**Alan:** Frontend / Tipografi

**Mevcut Durum:**

Referans gövde satır yüksekliği Bootstrap’in 1.5’idir; 768px altında `p, input, textarea` 14px’tir; başlıklar telefonda küçülür. 768px altında `body` ve `p` satır yüksekliği 1.5’tir (`web/src/styles/globals.css`). Masaüstünde gövde hâlâ 1.8’dir. 14px paragraf kuralı iç sayfa sarmalayıcısında (`sk-inner`) durur.

**Geçici Olmasının Nedeni:**

Ana sayfa Faz 1’de bölüm bölüm ölçüldü; küresel değişiklik o sayfayı yeniden ölçmeden yapılmadı.

**Gelecekteki Implementasyon:**

Ana sayfa referansla yeniden ölçülüp aynı kurallar `body` düzeyine taşınacak.

**Durum:** Açık

