## [2026-09-21]

- **[Infra]**: API healthcheck `nc` yerine `pgrep php-fpm` kullanır (Alpine imajında netcat yoktu; konteyner 200 verirken `unhealthy` kalıyordu).
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
