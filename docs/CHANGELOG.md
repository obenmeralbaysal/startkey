## [2026-10-15]

- **[Backend]**: Public danışman sayfasına yazılan yorum, Reonix süperadmin onaylamadan sitede görünmez. Onay ve ret `/admin/consultant-reviews` ekranındadır. Katalogdan gelen eski yorumlar yayında kalır.
- **[UI]**: Franchise masasının başına “Panel” geldi: ofis, danışman, portföy, kişi ve bu yıl kapanış özetleri; portföy kategori, durum ve satılık/kiralık dağılımı; kişi tipleri; son 12 ayın satılık ve kiralık portföy, kapanış, ortalama fiyat, kapanış hacmi ve hizmet bedeli grafikleri; ofis sıralaması. Veri Reonix’in yeni salt okunur `integrations/portal/desk/stats` ucundan gelir ve 10 dakika önbellekte tutulur.
- **[UI]**: Ofis “Özet” sayfası Reonix panelini izler. Broker, ofis yöneticisi ve manager için onay bekleyenler, düzeltme bekleyenler, bugünün nöbetçileri, beş gösterge, hızlı işlemler, finansal özet, aylık kapanış ve portföy büyüme grafikleri ile performans sıralaması gelir. Agent kendi portföy, randevu ve hizmet bedeli özetini görür.
- **[UI]**: `/portal` Apple tarzı cam tasarıma geçti. Masaüstünde yan menü, tablette ikon şeridi, telefonda yüzen alt sekme çubuğu ve “Diğer” sayfası var. Bildirimler üstte kısa süreli kart olarak çıkar, yüklenirken iskelet görünür. Kişi, portföy ve talep silme onay ister. Tüm şifre alanlarında göster/gizle düğmesi var. API çağrıları, yetkiler ve adresler değişmedi.
- **[UI]**: Reonix’ten gelen ofis listesi referans sayfa kabuğunu kullanır: “Anasayfa / Ofislerimiz” yolu, “Startkey Türkiye | Ofislerimiz” başlığı, “{n} Ofis Bulundu” sayısı ve kartta “Şehir / İlçe” konumu. Liste sayfası tohumlanmamış olsa da bu metinler TR/EN/DE için gelir; ofisler Türkçe alfabe sırasıyla, telefonlar “+90 (232) 812-1872” biçiminde gösterilir.
- **[UI]**: Ofis detay ve danışman detay sayfaları referans yerleşime alındı: iletişim bloğu, sekmeler, ekip grupları, boş ilan metni, harita ve yorum formu. Public danışman sayfası referans şablonu açar; Figma taslağı `?layout=draft` ile durur.
- **[UI]**: Sayfa başlığı şeridi referans breadcrumb ile eşitlendi: beyaz başlık, “Anasayfa / Ofislerimiz” yolu ve “/” ayracı.
- **[UI]**: Ofis kartı, arama çubuğu ve sayfalama referans stile getirildi: kartlar arası boşluk, tam genişlik logo, lacivert ofis adı, yuvarlak sosyal düğmeler, tek satır arama çubuğu ve yuvarlak sayfa düğmeleri.
- **[Backend]**: Public ofis ve danışman kataloğu Reonix’e bir kerelik yazılır. Ofis adı danışmanı düşer, aynı broker tek kişi olur, yayınlanan yorum Reonix kullanıcısında kalır ve public danışman sayfasında görünür.
- **[Bugfix]**: Ofis ve danışman fotoğraf boyutu canlı web derlemesinde tip hatası verdiği için düzeltildi.
- **[UI]**: Aynı kişi birden fazla ofisin broker’ı olabilir. İkinci ofise aynı e-posta ile eklenince yeni profil açılmaz. Portalda birden fazla ofisi olan hesap ofis değiştirir.
- **[UI]**: Ofis logosu listede 413×194, detayda 576×269 geniş bant; danışman fotoğrafı kare. Referanstaki kırpma oranı kullanılıyor.

## [2026-10-14]

- **[UI]**: Talep formunda diğer StartKey portföyleriyle eşleşme seçilir. Kullanıcı bu seçeneğin varsayılanını profilinden açıp kapatır.
- **[UI]**: Portal şifre sıfırlama bağlantısı StartKey adresine gider. Sosyal giriş eklenmedi.
- **[UI]**: Ana sayfadaki öne çıkan portföyler ile ofis ve danışman araması, portal bağlantısı varken Reonix katalogundan gelir.
- **[UI]**: Portal kapanışında iç ofis işbirliği, eşleşen talep ve gösterim sözleşmesi seçilebiliyor.
- **[UI]**: Portal kapanışı alıcı, hizmet bedeli, evrak ve onay adımını Reonix’e gönderir.
- **[UI]**: Portalda büyük dosya parça parça yüklenir. Sesli taslak, hizmet bedeli dilimi ve takvim rozeti kaydedilir.
- **[UI]**: Public ofis, danışman ve portföy kartları, kayıtta fotoğraf varsa onu StartKey üzerinden gösterir.
- **[UI]**: Portal portföyünde aktife alma, zorunlu özellikler, evrak ve EİDS alanları doldurulabiliyor.
- **[Backend]**: Portal bağlantısı varken ofis, portföy ve danışman sayfaları Reonix katalogundan okunur. İlan formu Reonix’te kişi ve talep açar. Eşleşme, rozet, hizmet bedeli, hakediş, abonelik ve kapanış formları portaldan yazılır.
- **[Bugfix]**: Ofis, portföy ve danışman listelerinde kayıt yokken sayfa 404 yerine boş liste uyarısı gösteriyor.

- **[Architecture]**: StartKey portalı Reonix’i göstermez. Broker, agent ve ofis yöneticisinin ofis işi Reonix’te kalır ve portal üzerinden, sunucudaki izin listeli vekille yönetilir. CMS ve genel iletişim formu StartKey veritabanında kalır.
- **[UI]**: `/portal` giriş, masa ve ofis ekranları sade cam görünüme alındı. Public site referans yerleşiminde kaldı.

- **[Infra]**: Canlı güncelleme `make deploy` ile sırayla çekilir: git pull, web imajı, web ve API ayağa kalkar. Volume silinmez, `docker compose down` çalışmaz.
- **[Security]**: İletişim, eğitim, franchise, danışman başvurusu, ilan iletişim ve danışman yorumu formları görünür reCAPTCHA kutusunu kaldırdı. Doğrulama, v3 anahtarları tanımlanınca görünmez skor ve forma özel action ile yapılır.

## [2026-10-11]

- **[Security]**: Ana sayfa bülten formu görünür reCAPTCHA v2 kutusunu kaldırdı. Doğrulama, v3 site ve secret anahtarı tanımlanınca görünmez reCAPTCHA v3 skoru ile yapılır.
- **[UI]**: Ana sayfadaki portföy, ofis ve danışman arama alanları ile bülten girişleri arasına boşluk kondu.
- **[UI]**: 1600px ve üstünde header container 1600px, arama container’ı 1520px. Referanstaki geniş satır. Diğer bölümler 1320px. Yazı, görsel ve buton ölçeği %80.
- **[UI]**: Sayfa container’ı referans genişliğine döndü (masaüstünde 1320px). Yazı, görsel ve buton ölçeği 768px ve üstünde %80 kaldı.

## [2026-10-10]

- **[UI]**: Şehir başlığı kartların üstünde ortalandı. İlan kartında kiralık/satılık solda kırmızı, tür sağda lacivert; fiyat lacivert.
- **[UI]**: SSS soruları kapalı açılıyor. Kapalıyken lacivert artı, açıkken kırmızı eksi görünüyor.
- **[UI]**: Şehir kaydırıcısının altındaki noktalar referanstaki halka ve iç daire oldu. Aktif nokta kırmızı halka.
- **[UI]**: Akademi video bandı ve bülten başlığı, adımlar başlığıyla aynı ortalanmış kolonda.
- **[UI]**: “3 Adımda Gayrimenkul Uzmanı Olun” başlığı ortalandı. “Franchise Konusunda Merak Edilenler” solda, görselin yanında ve aynı başlık ölçüsünde.
- **[UI]**: Hakkında fotoğrafı kolondan dar; alttaki fotoğraf köşeye biniyor, küp dönüyor ve yüzen şekil sağ üstte görünüyor. Bölümler soldan, sağdan veya aşağıdan kayarak geliyor.
- **[UI]**: Hakkında bölümlerinin zemini referanstaki gri (`#f9f9f9`). Fotoğraf ve metin yan yana; köşe şekli görünür. Beyaz kartların iç boşluğu 20px.
- **[UI]**: Anasayfa sayaçları ikon, kırmızı rakam, artı ve ayraçla referans sırasına alındı. İlanların altındaki bölümler (hakkında, ofis, adımlar, ilan bandı, video, şehirler, SSS, bülten) aynı yerleşim ve renklerle hizalandı.
- **[UI]**: Footer metni lacivert zeminde yeniden beyaz; oklar kırmızı. Butonlar referanstaki iki yarım renk geçişini kullanıyor. Hero görseli sayfa genişliğinde. Menüdeki artı işaret etiketin yanında; üzerine gelince yazı kırmızı oluyor, alt çizgi uzuyor ve artı 180 derece dönüyor.

## [2026-10-09]

- **[UI]**: Header, startkey.com.tr ölçülerinden Tailwind ile kuruldu. 768px ve üstünde `%80` (`--sk-scale: 0.8`). Logo, menü, dil adı ve butonlar tek satırda.
- **[UI]**: Header menüsü artık tek satırda ve aralıklı. Dil seçici bayrak ve dil adıyla butonların solunda. Arama sekmeleri altı çizili metin, alanlar gri kutu.
- **[Bugfix]**: Anasayfa 500’ü, API’nin eksik portföy/ofis seed dosyasında kapanmasından geliyordu. Dosya yoksa seed atlanır ve PHP ayağa kalkar. Docker diski dolu olduğu için Postgres de yazamıyordu; kullanılmayan build önbelleği temizlendi.
- **[UI]**: Header dil seçici sağ uca alındı ve yalnızca bayrak olarak gösteriliyor.
- **[Bugfix]**: Eğitim ve iki Almanca makale açıklamasındaki sohbet arayüzü işaretlemesi çıkarıldı. Metin yönü `text-left` ile kilitlenmiyor; aralıklar derlenmeyen `--sk-scale` sınıflarına bağlı değil. Sınıf dönüştürücü Bootstrap `text-start` / `text-end` sınıflarını artık fiziksel sola/sağa çevirmiyor.
- **[Frontend]**: Public sitenin Bootstrap ve Fela CSS’i kalktı. Görünüm Tailwind token’ları ve utility sınıflarıyla duruyor; menü, dil seçici, arama lookup’ları, carousel, lightbox ve sayaçlar React tarafında. Portal aynı kaldı.
- **[Frontend]**: Yerel Startkey Akademi kopyası (`/akademi`, WordPress anlık görüntüsü, asset’ler ve çekme script’leri) kaldırıldı. Yeni tasarım ayrıca yapılacak. Header’daki Çevrimiçi Eğitimler `startkeyakademi.net` adresini açar. Kurumsal Seminerler / Eğitimler duruyor.
- **[Frontend]**: Kurumsal site ve Portal masaüstü ve tablette (768px ve üstü) %20 küçültüldü. Tüm CSS uzunlukları ve görsel `width`/`height` ölçüleri `--sk-scale` (0.8) ile çarpılıyor; telefonlar referans ölçüsünde kalıyor. Tema, kütüphane ve portal CSS’i `scripts/scale-css.py` ile yeniden yazıldı.
- **[Frontend]**: Header masaüstünde daha geniş satır ve sıkı aralıkla düzenlendi: menü etiketleri ve “+” işareti alt satıra geçmiyor, butonlar taşmıyor, logo sıkışmıyor (tr/en/de, 992px ve üstü; 992–1199px arasında header yazısı biraz daha küçük).

## [2026-09-29]

- **[Frontend]**: Portal girişinden Google ve Office 365 butonları kaldırıldı.
- **[Security]**: Portal ofis ve danışman uçları, oturum çerezi yoksa controller’a girmeden 401 döner. Giriş ve çıkış uçları açık kalır.
- **[Bugfix]**: Header danışman başvuru yazısı tr/en/de içerikten gelir. Danışman formunda İngilizce ve Almanca captcha hatası ile “Office Assistant” etiketi düzeltildi.
- **[Backend]**: Franchise sistemleri Reonix portal ucuna JSON istek ve JSON cevap ile bağlanır. Anahtar franchise ortamında kalır; Reonix yalnızca o anahtarın hash’i ile ağı tanır.
- **[Backend]**: Startkey Portal, Reonix’e yalnızca sunucudan bağlanır. Ofis başvurusu, danışman başvurusu, ofis açma, broker ve agent ekleme ile paket eşlemesi bu kanaldan yapılır. Tarayıcıya karşı uç adresi ve token dönmez.
- **[Frontend]**: Portal girişi oturum açar. Admin ofis ve danışman başvurularını, owner broker ve agent eklemeyi görür. Header’a Danışman Başvuru eklendi.

## [2026-09-21]

- **[Bugfix]**: Akademi `/akademi/egitimler` (ve sayfa 2–3 + kategori arşivleri) soldaki Filtrele formunu WordPress REST iskeleti yerine gömülü kategori/eğitmen listesiyle gösteriyor; eksik kapanış `div` eğitim ızgarasını sol kolona gömmüyordu.
- **[Infra]**: API, `cms_listings` doluysa seed atlar; healthcheck `pgrep php-fpm`; nginx `service_started` bekler. Canlı `up` artık ağı silmez, tam seed yüzünden takılmaz.
- **[Infra]**: API healthcheck `start_period` 10 dakikaya çıktı; canlıda tam seed 2 dakikayı aşınca `unhealthy` olmuyor.
- **[Infra]**: NPM’in bağlı olduğu `startkey-network` overlay’de `external` oldu; `compose up/down` ağı silmeye çalışmaz.
- **[Frontend]**: Kurumsal ve Akademi `robots.txt`, `sitemap.xml` / `sitemap_index.xml`, `llms.txt` ve 404/500 hata sayfaları eklendi. Kurumsal 404 Fela `error-wrap` ile TR Akademi metnini kullanır; Akademi bilinmeyen yollar referanstaki `404-hata-2` belgesini HTTP 404 olarak döner.
- **[Frontend]**: Header/footer CRM yazısı Portal oldu; tıklanınca ReOS giriş ekranının yerel kopyası (`/portal`, tr/en/az/ru) açılıyor.
- **[Bugfix]**: Akademi eğitim detayında sağdaki Sepete Ekle kutusu referanstaki gibi kaydırınca sayfayla gidiyor (yapışmıyor). Sol kolon Elementor `%67` genişliğinde; tanıtım videosu daralmıyor.
- **[Bugfix]**: Akademi eğitim detayında “Sepete Ekle” kutusu sağ kolona oturdu; 23 eğitim sayfası referanstan yeniden çekildi ve iki kolonlu yerleşim Elementor animasyonu olmadan da duruyor.
- **[Frontend]**: Danışman detayı varsayılan olarak Figma taslağına yakın yeni şablonu açar (yıl istatistikleri, ortak sosyal ikonlar). Eski referans şablon `?layout=classic` ile durur. Üst bilgi (istatistik kartları, isim, iletişim çizgileri, sosyal ikonlar) web için sıkılaştırıldı; Hakkımda / Portföyler / Yorumlar orijinal markup’a alındı.

## [2026-09-19]

- **[Infra]**: Web imajı `public/media` içermez; klasör runtime’da bağlanır. Satıver/NPM yanı için `docker-compose.behind-npm.yml` host portu açmaz.
- **[Docs]**: Canlı kurulum kılavuzları eklendi: boş VPS (`SETUP.md`), Satıver/ResidenceHero yanına (`SETUP_COLOCATED.md`), görsel/veri/imaj yolu (`MEDIA.md`).
- **[Frontend]**: Akademi Eğitimler sol “Filtrele” formu (kategori/eğitmen) ve eğitim detayındaki “Yorumlar” puan özeti referanstan sayfaya gömüldü; filtre WordPress AJAX’ı yerine yerel `?term_id=` ve eğitmen sayfalarına gider.
- **[Frontend]**: Ana sayfa sayaçları (84 / 720 / 1082 / 35), seminer şeridi (6) ve öne çıkan ilanlar canlı siteden yenilendi; EN/DE carouseller TR’den ayrı set gösteriyor.
- **[Frontend]**: `/tr/sayfa/startkey`, `/en/page/startkey`, `/de/page/startkey` ve `/tr/sayfa/medyada-biz` statik sayfaları eklendi; EN haber “Media Us” ve EN/DE blog “General” kategorileri canlıdan alındı.
- **[Backend]**: Portföy seed’i 721 ilana çıktı (482977 Şirinyer kiralık); öne çıkan ilanlar dile göre `property_translations.is_featured` ile tutuluyor.
- **[Frontend]**: Akademi eksik public sayfaları eklendi: giriş/kayıt, eğitmenler ve profiller, eğitim kategorileri, blog yazıları, sepet/ödeme/kontrol paneli ve ders koruma ekranları.
- **[Backend]**: Portföy, ofis ve danışman seed’leri referans sitedeki tam public listelerle güncellendi (720 ilan, 84 ofis, 1082 danışman; tr/en/de).
- **[Frontend]**: Akademi Eğitimler arşivi (3 sayfa) ve 23 eğitim detayı `/akademi/egitimler/...` altında referans belgelerinden eklendi.
- **[Frontend]**: startkeyakademi.net/akademi sayfası yerel `/akademi/akademi` altına vizyon/misyon, sayaçlar, geri bildirimler ve ekip kartlarıyla eklendi.
- **[Bugfix]**: Akademi SSS sol sekme listesi (Genel, Ödeme, Geri Ödeme, Sipariş Verme, Destek) artık tıklanıyor ve hover alıyor; eksik Elementor nested-tabs JS’i eklendi.
- **[Frontend]**: Akademi footer sayfaları (SSS, İletişim, KVKK, Kullanım Koşulları, Gizlilik, Geri Ödeme, Çerez) `/akademi/...` altında referans belgelerinden eklendi; footer e-posta ikonları korundu.
- **[Bugfix]**: Danışman ve ofis listesinde arama sonrası seçili ofis/il filtresi artık ID yerine ofis veya şehir adını gösterir.
- **[Bugfix]**: Akademi anasayfası LiteSpeed UCSS yerine `LSCWP_CTRL=before_optm` belgesi ve Elementor inline CSS ile yeniden çekildi; ızgara, boşluk ve görseller referansla hizalandı.
- **[Frontend]**: Ofisler ve danışmanlar liste/detay şablonları üç dilde eklendi; kısa ofis slug’ları (`/1872`), id/slug yolları, filtreler ve ofis ekibi kartları referans markup ile çalışır.
- **[Backend]**: `cms_offices` / `cms_consultants` CRM şablon tabloları ve `/api/v1/consultants/{id}/comments` (captcha + dakikada 5 istek) eklendi.
- **[Frontend]**: startkeyakademi.net anasayfası yerel `/akademi` altına, kurumsal layout’tan ayrı WordPress markup ve lokal asset’lerle eklendi. Alt yollar `/akademi/...` olarak map edilir; Çevrimiçi Eğitimler artık bu adresi açar.

## [2026-09-17]

- **[Frontend]**: Portföylerimiz liste ve ilan detay sayfaları üç dilde paylaşılan dinamik şablonlarla eklendi; sol filtre, sıralama, galeri, danışman kartı ve ofis/danışman URL mimarisi referans markup ile çalışır.
- **[Backend]**: `cms_listings` CRM şablon tabloları, filtre/sıralama çözümlemesi ve `/api/v1/listings/{id}/inquiries` (captcha + dakikada 5 istek) eklendi; referanstan 68 ilanlık örneklem üç dilde seed edilir.
- **[Frontend]**: Footer’daki Franchise başvuru, KVKK ve Hizmet Sözleşmesi sayfaları üç dilde (KVKK yalnızca TR) referans markup ile eklendi; footer linkleri Portföy ve Ofis dışında çalışır.
- **[Backend]**: Franchise formu `cms_pages` payload’ı, KVKK/Hizmet Sözleşmesi CMS satırları ve `/api/v1/franchise/applications` (captcha + dakikada 5 istek) eklendi.

- **[Bugfix]**: Tamamlanan eğitim detayında referanstaki gibi ön başvuru formu gizlendi; form yalnızca devam eden seminerlerde duruyor.
- **[Bugfix]**: İletişim haritası Google embed adresindeki `&#39;` entity yüzünden boş kalıyordu; kesme işareti çözülerek harita yeniden yüklenebilir hale getirildi.
- **[Frontend]**: Akademi Seminerler/Eğitimler listesi (devam eden + tamamlanan), eğitim detayları ve İletişim sayfası üç dilde referans markup ile eklendi. Çevrimiçi Eğitimler harici `startkeyakademi.net` bağlantısı olarak kaldı.
- **[Backend]**: `cms_trainings` CMS tabloları, İletişim sayfa payload’ı, `/api/v1/corporate` çözümlemesi, iletişim mesajı ve eğitim ön başvuru endpoint’leri (captcha + dakikada 5 istek) eklendi; 100 eğitim üç dilde seed edildi.
- **[Bugfix]**: Blog sağ sütunu referanstaki 6 popüler yazıyı 85×85 kırpılmış görsellerle gösteriyor; sayfalama kartların yanında değil listenin altında.

- **[Bugfix]**: Şampiyonlarımız sayfasında “Startkey Türkiye” üst boşluğu ve Ağustos / II. Çeyrek ızgara yapısı referans HTML sırasına çekildi.
- **[Bugfix]**: Haber, duyuru ve blog listeleri artık referans sitedeki sayfa sırasını kullanıyor; `external_id` sıralaması kaldırıldı (ör. 38. Sayı ilk sayfada, Melis duyurusu son sayfada).
- **[Frontend]**: Kurumsal menüsünün tüm sayfaları paylaşılan dinamik şablonlarla eklendi (Hakkımızda, Vizyon ve Misyon, Yönetim kartları, Medyada Biz, Duyurular, Blog, Şampiyonlarımız); liste ve detay içerikleri Superadmin’in yazacağı aynı CMS satırlarından render edilir.
- **[Backend]**: Haber, duyuru, blog, yönetim ve şampiyon içerikleri için CMS tabloları, seed ve `/api/v1/corporate` çözümleyici eklendi; referanstan çekilen 21 haber, 73 duyuru, 41 blog, 13 yönetici ve 2 şampiyon grubu üç dilde yüklendi.
- **[Bugfix]**: Dil menüsü iç sayfalarda eşdeğer Kurumsal URL’ye geçer; ana sayfa davranışı korunur.

- **[Bugfix]**: Dil menüsü yönlendirmesi `0.0.0.0:3000` yerine ziyaretçinin açık olduğu origin’de kalacak şekilde düzeltildi.
- **[Docs]**: Faz 1 dersleri, doğrulama checklist’i ve script kullanımını içeren sayfa yeniden oluşturma playbook’u eklendi (`docs/PAGE_RECREATION_PLAYBOOK.md`).
- **[Frontend]**: StartKey.com.tr ana sayfası Türkçe, İngilizce ve Almanca olarak referans siteden alınan içerik, asset ve tema çalışma zamanı ile yeniden oluşturuldu.
- **[Backend]**: Ana sayfa istatistik, öne çıkan portföy, popüler şehir ve arama formu lookup verilerini sunan Laravel API eklendi.
- **[Backend]**: Bülten kayıt endpoint'i doğrulama, idempotent e-posta ve dakikada 5 istek sınırı ile eklendi.
- **[Infrastructure]**: PostgreSQL, Redis, Laravel API, nginx ve Next.js yığını `./start.sh` ile tek komutta ayağa kalkacak şekilde Docker'a alındı.
- **[Security]**: Bülten formu için reCAPTCHA v2 doğrulaması ve yetkisiz locale / bilinmeyen lookup reddi eklendi.
