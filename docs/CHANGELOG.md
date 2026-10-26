## [2026-10-26]

- **[UI]**: Portföy küçük resmindeki “Filigranlı görsel” rozeti koyu yarı saydam zemin, açık yazı ve küçük köşe yarıçapı kullanır. Yerleşim aynı kalır. #2184
- **[Bugfix]**: Başvuru ve diğer formlardaki reCAPTCHA bildirimi, reCAPTCHA betiği yüklenene kadar basılmaz. Betik yüklenince metin aynı kalır.
- 662-1: Ana sayfa franchise linkleri mutlak /tr/franchise-basvuru yapıldı (göreli tr/... alt sayfalarda 404 veriyordu).
- **[Backend]**: Ofis ciro, işlem ve kulüp rozetleri (`rankBadges`) ofis kartında, ofis listesinde ve ofis detayında görünür. Katalog içe aktarması her ofis ve danışman için `rankBadges` gönderir; boş liste kayıtlı rozetleri siler. Tam ofis ve danışman taraması gecelik çalışır. #2178
- **[Backend]**: Franchise yöneticisi ve franchise personeli mevcut portal girişi ile ağı salt okunur görür. Ofis seçimi bu roller için gerekmez; `/me` `context: network` ve `role` döner. Ağ özeti, ofis ve danışman listeleri Reonix’ten gelir. Bu rollerin portal yazma istekleri 403 olur. #2182
- **[Portal]**: Franchise ağı salt okunur açılır. Oturumdaki `/me` cevabı `context: network` ve rol `franchise_admin` veya `franchise_staff` ise ofis seçimi atlanır; menü yalnız Ağ Özeti, Ofisler ve Danışmanlardır. Listeler StartKey vekilinden gelir, telefon ve e-posta düşer. Danışman unvanı ofis rolünden TR, EN ve DE basılır. #2182
- **[Backend]**: Katalog görselleri yerel diskte 6 saat tutulur; üst sistem susarsa eski kopya döner, eşleşen ETag 304 verir. Medya ucu dakikada 600 isteğe çıkar. Galeri küçük resimleri ve aktif olmayan kareler geç yüklenir. #2185
- **[Portal]**: Sahibinden’den gelen filigranlı görseller portföy galerisinde “Filigranlı görsel” rozeti, portföyde uyarı bandı ve listede küçük rozet ile gösterilir. Aktife alma 422 `watermarked_media` yanıtı ofise iletilir. Katalog ve portal API’si `is_watermarked` ile `has_watermarked_media` alanlarını, yoksa false, geçirir. Ziyaretçi sayfalarında uyarı yoktur. #2184
- **[Backend]**: Danışman ciro, işlem ve kulüp rozetleri (`rankBadges`) katalog listesinde ve danışman detayında Reonix cevabından geçer. A Plus ekibi ofis sayfasındaki danışman bağlantılarından içe aktarılır; ofis adlı tek kart düşer, kişiler ofise bağlanır.

- **[UI]**: İlan detayındaki danışman fotoğrafı 72px yuvarlak yerine kartın tam genişliğinde, kendi oranıyla gösterilir; kırpılmaz, yüz kesilmez. Telefonda da kart genişliğindedir. #2185
- **[UI]**: Danışman listesinde ofis kartları yeniden durur. Kişi başına bir kart kalır; ofis satırları aynen geçer ve kişilerle tek Türkçe A-Z sırada karışır. Ofis kartının alt satırı Gayrimenkul Danışmanı (EN Real Estate Consultant, DE Immobilienberater), görseli ofis logosu, bağlantısı ofis detayıdır. Liste sayacı ofisleri de sayar; boş sonuç “0 Danışman Bulundu” kalır. Üst sayaç yalnız kişileri sayar. #2178
- **[UI]**: Üst menü, iyileştirme sunumundaki 72px beyaz çubuktur. Sıra Kurumsal, Portföyler, Danışmanlar, Ofisler, Akademi ve Medya’dır; İletişim Kurumsal’da, haber ve blog Medya’dadır. Kırmızı düğme Başvuru menüsüdür (Franchise ve Danışman). Telefonda menü soldan açılır; çubukta ☰ ve kısa Başvur kalır. Harita başlığı ofis ve ülke sayısı ile ülke etiketlerini canlı pinlerden üretir; pini olmayan listede başlık basılmaz. #2185
- **[UI]**: Ana menüye tıklanınca açılan Başvuru listesi eklendi. Danışman ve Franchise, mevcut başvuru sayfalarına gider; alt satırdaki açıklama TR, EN ve DE sayfa metnidir. Esc ve dışarı tıklama listeyi kapatır. Telefonda aynı düğme çekmecedeki alt menüyü açar. Startkey Global haritası, pini olan ofis sayısını gösterir; veri yoksa sayı basılmaz. #2185
- **[UI]**: Portföy listesinde üst başlık açık gri; fotoğrafı olmayan ilan kırık çerçeve yerine “Fotoğraf hazırlanıyor” gösterir. İlan detayında ana fotoğraf ve küçük resimler, beş ve üzeri fotoğrafta “+N”, lightbox, yapışkan fiyat ve danışman kartı ile telefonda alt iletişim çubuğu vardır. Yeni portföy seçenekleri ikon kartıdır. #2185
- **[UI]**: Yeni portföy ekranı El ile, Sesle ve Sahibinden linkiyle seçeneklerini sunar. Sahibinden ilan adresi veya numarası mevcut içe aktarma ile formu doldurur; kayıt ayrıca onaylanır. Sahibinden menüsü yeni portföy ekranına, satıcı listesi Ofis Ayarları › Entegrasyonlar › Sahibinden altına alındı. #2185
- **[Backend]**: Katalog ilan detayı Reonix açıklamasını paragraflı metin olarak, özellikleri ve özellik gruplarını referans kart şekliyle basar. Liste kartında oda ve alan doluysa görünür. #2178
- **[Security]**: Rozet, ofis kaydı, nöbet listesi ve WhatsApp okumaları yeniden önceki erişime alındı. Bu uçlarda yalnızca yazma 403 olur. Kapalı ayar sayfası HTTP 403 kalır. #2185
- **[Security]**: Yetkisiz bir ayar sekmesi artık HTTP 403 döner ve "Bu ayara erişim yetkiniz yok" metnini basar. Aynı sekmenin okuma API'leri de rol yetmezse 403 JSON döner. #2185
- **[Backend]**: Portföy listesi 20 saniye önbelleğe alınır. Önbelleğe giren okumalar `Cache-Control: private, max-age` ile gelir; tarayıcı aynı süre içinde ikinci açılışı yeniden Reonix'e götürmez. Sorgu sırası ve `_` gibi tek kullanımlık parametreler anahtarı bozmaz. #2185
- **[Bugfix]**: Yeni portföy formu il veya ilçe seçilmeden mahalle listesini istemez. `district_id` veya `city_id` 0 ise API Reonix'e gitmez ve 422 döner. Büyük düz listelerde yük temizliği ikinci kopya çıkarmaz. #2185
- **[Security]**: Ayarlar sekmesi role kapalıysa liste yerine "Bu ayara erişim yetkiniz yok" görünür. API aynı kapıyı ofis rolüne göre 403 ile uygular; Reonix'in 403 yanıtı da iletilir. #2185
- **[Backend]**: Portal oturumu, kategori, il ve pano okumaları kısa süre Redis'te tutulur. Aynı sayfa ikinci kez açıldığında bu uçlar Reonix'e yeniden gitmez. #2185
- **[Bugfix]**: Portföy galerisi en fazla 12 fotoğraf veriyordu. İlan detayı kayıtlı fotoğrafların tamamını, medya vekilinin 0–59 aralığına kadar (en fazla 60) gösterir. #2178
- **[UI]**: Ana sayfa “3 Adım” giriş metni üç kartın genişliğindedir. Telefonda adım numarası görselin üstünde, küçük ve örtüşmeden durur. Ofis haritasında tek pine tıklamak yakınlaştırmaz; balon açık kalır. “Tümünü göster” masaüstünde yazılı ve her zaman görünür (TR/EN/DE). #2178
- **[UI]**: Ofis, danışman ve portföy aramalarındaki seçicilerde görünür etiket ve “Ülke seçiniz / İl seçiniz / İlçe seçiniz / Ofis seçiniz” gibi boş seçenek vardır. Danışman listesinin filtre kutusunda ofis seçici `ofis` sorgu parametresindedir, rozete sayılır ve Temizle ile silinir. Danışman sayfalama kontrolü ve sayfa durumu görünür. Ofis kartları danışman listesinin sonunda Türkçe A-Z durur ve katalog rozeti kartta görünür. #2178
- **[Bugfix]**: Danışman listesindeki ofis kartı `office-{id}` kimliği yüzünden görselsiz kalıyordu; görsel ofisin sayısal kimliğinden istenir. Şampiyon grubunda fotoğraf kaydı boşsa kurumsal seed’deki fotoğraflar basılır. #2178
- **[UI]**: Ofis ve danışman listelerinde tek arama kutusu yazıldıkça (yaklaşık 275 ms) `q`, `il`, `ilce` ve `page` adresine yazılır. Arama Türkçe harf ve büyük/küçük harf duyarsızdır; ad, ofis, il ve ilçe katalogda süzülür. İl/ilçe seçici sabit bir düğmeyle açılır: telefonda alt sayfa, masaüstünde açılır kutu. Sonuç yoksa arama temizlenir. #2178
- **[UI]**: “3 Adımda Gayrimenkul Uzmanı Olun” kart numaraları kart sırasından 01, 02 ve 03 olur. Görseller 780×540 dosyalarla değişti; damla biçimi ve kutu ölçüsü durur. #2178
- **[UI]**: Ofis haritasının altlığı `NEXT_PUBLIC_MAP_STYLE` ile seçilir. Boş veya `default` OpenStreetMap’tir. `satellite` ve dolu `NEXT_PUBLIC_MAP_SATELLITE_URL` uydu katmanını, `NEXT_PUBLIC_MAP_SATELLITE_ATTRIBUTION` ise alt yazıyı verir; adres boşsa harita OpenStreetMap’te kalır. Pinlerde beyaz çerçeve ve gölge, kümelerde beyaz 2px çerçeve ve gölge vardır. #2178
- **[UI]**: Ana sayfa Startkey Global haritası koordinatı olan her ofisi (İngiltere, Atina ve Kıbrıs dahil) yaklaşık 40px payla kadraja alır. Yükseklik masaüstünde 620px, 768px altında 420px. Pine tıklanınca yakınlaştırma 13 olur ve bilgi balonu durur. Yakın pinler kırmızı kümede toplanır; sol üstte yakınlaştırma altındaki “Tümünü göster” başlangıç kadrajına döner. `locationNeedsReview` cevapta kalır, kadrajdan ofis düşürmez. #2178
- **[Bugfix]**: Ana sayfa haritasında enlem 35.8–42.2 ve boylam 25.6–44.9 dışındaki ofisler `fitBounds` hesabına girmez; pinler haritada kalır. `locationNeedsReview` gelmese de aynı dışlama uygulanır. Ofis detay haritası kendi pinine odaklanmaya devam eder. #2178
- **[UI]**: Üstteki seminer sayısı, eğitim listesinin ilk bölümündeki yaklaşan kayıtların sayısıdır. Sabit sayı kalktı. #2178
- **[UI]**: Ana sayfadaki Startkey Global haritası sayfa genişliğindedir. Sınırlar, konumu incelenmesi gereken ofisler dışında kalan pinlere 20px payla oturur; bu pinler haritada durur. `location_needs_review` ana sayfa ofis listesinde `locationNeedsReview` olarak gelir. #2178
- **[Bugfix]**: İlan, ofis ve danışman görselleri dosya adı olarak kalınca tarayıcı adresi sayfa yoluna ekliyordu. Katalogda fotoğraf sayısı varsa adres `/api/v1/catalogue/media/...` olur; yalnızca dosya adı varsa `/media/...` olur. Ana sayfa içeriğindeki aynı dosya adları da tam yola çevrilir. #2178
- **[UI]**: Telefonda header logosu 130×53 px. Franchise başvurusu bölüm aralıkları, başlık ve paragraf boşlukları referansla aynı; Akademi metnindeki sohbet sınıfları yerleşimi büyütmez. Form alanları ve doğrulama aynı kalır. #2178

## [2026-10-25]

- **[UI]**: Ana sayfa kaydırma animasyonu haritayı da kapsar; telefonda paragraf 14px. Danışman ve franchise başvurusu telefonda daha sıkı aralık ve 55px alan yüksekliği kullanır. Ofis kartı 0.4s hover, iletişim haritası 500px, ofis detay haritası masaüstünde 500px ve telefonda konteyner genişliğindedir. Header geçişi 0.4s. #2178
- **[UI]**: Ana sayfada Startkey Global yuvası, Reonix kataloğundaki koordinatı olan ofisleri gösteren bir Leaflet haritasıdır. Sıra harita, ilanlar, franchise tanıtımıdır. Danışman listesi başlığı “Danışmanlarımız” ve kırıntı yolu referanstaki gibidir; kartlar üçlü çerçevelidir. Portföy filtresinde alan etiketleri ve sıralama seçici görünür. Masaüstü konteyner 1056px, telefonda duyuru bandı 15px/65px, logo %10 küçük ve gövde satır yüksekliği 1.5’tir. Telefon alanlarında bayraklı +90 seçici vardır. Yukarı çık düğmesi, kaydırmalı başlık ve kart/düğme geçişleri referans sürelerindedir; 404 footer haritası gizlenir. #2178
- **[Backend]**: Haber, duyuru, blog, eğitim ve şampiyon sayfaları artık yerel seed yerine Reonix portalından okunur. Reonix yanıt vermezse bu sayfalar boş kalır; yerel `cms_articles`, `cms_trainings` ve şampiyon tablolarına düşülmez. Eğitim başvurusu, formun yabancı anahtarı için yayındaki eğitimin gölge satırını tutar.

## [2026-10-24]

- **[UI]**: Telefon ve tablet menüsü referanstaki gibi soldan kayarak açılır. Kurumsal, Startkey ve Akademi alt menüleri ok ya da başlığa dokununca açılır; aynı anda tek alt menü açık kalır. Menüde logo, tam genişlik başvuru ve Portal düğmeleri, açık sayfanın vurgusu var; dil seçici menünün dışında tek kalır. Menü açıkken sayfa kaymaz; Escape ile kapanır, odak menü içinde kalır ve kapanınca hamburgere döner. Masaüstü alt menüleri klavye odağıyla da açılır.
- **[UI]**: Header logosu yüksek çözünürlüklü dosyaya (`/media/brand/startkey-logo.png`, 500×200) geçti.

- **[Bugfix]**: İngilizce ve Almanca eğitim detayları referans yolunda açılıyor (`/en/education-detail/…`, `/de/education-detail/…`). Eğitim kartındaki “Detay” düğmesi bu yola gider; görsel ve başlık referanstaki gibi Türkçe detayı açar. Eski `/en/egitim-detay/…` yolu çalışmaya devam eder.
- **[Content]**: Kurumsal, akademi ve footer içeriği canlı siteden yeniden alındı: yeni blog, duyuru, yönetim kadrosu ve eğitim kayıtları geldi. Eğitim listesi referanstaki 16 kaydı gösterir; eski eğitimlerin detay sayfası açık kalır. Ücretli eğitimlerde “Ödeme Bilgileri” bloğu form üstünde görünür.
- **[UI]**: Danışman başvuru sayfasının alt gövdesi tamamlandı: başvuru ve sunum düğmeleri, “İş Ortaklarımız” ve “Sosyal Sorumluluk İş Ortaklarımız” kaydırıcıları. Kurumsal sayfalardaki iş ortağı logoları referanstaki gibi kayar.
- **[UI]**: İç sayfalar referans yerleşimine yaklaştırıldı: header altındaki boşluk, CMS gövdelerindeki sütun aralığı, görsellerin boyutu, haber/duyuru/blog kart ve detayları, iletişim, şampiyonlar, eğitim ve başvuru formları, paylaş düğmeleri, liste ve paragraf aralıkları, telefonda yazı boyutları.
- **[SEO]**: Portföy listesi ve danışman formu başlıkları referansla aynı. Referans ile yerel adres farkları ve önerilen yönlendirmeler `docs/URL_MAP.md` içinde.

## [2026-10-15]

- **[UI]**: Alt sayfa kabukları referans yerleşime alındı. Liste sayfalama düğmeleri ofis listesiyle aynı yuvarlak biçimi kullanır. Portföy, blog, haber, duyuru, kadro, şampiyon, eğitim ve iletişim sayfalarının kart, ızgara ve filtre yerleşimi referans ölçülerine çekildi. Danışman başvurusunun tanıtım gövdesi üç dilde canlı sayfadan basılır.
- **[Portal]**: Franchise masasında ofis kullanıcıları listelenir. Ad, e-posta ve telefon düzenlenir; şifre portalda belirlenir. Başka bir ağa da kayıtlı hesap değiştirilemez.
- **[Backend]**: Ana sayfadaki öne çıkan portföy ve popüler şehir kaydırıcıları, portal bağlıyken Reonix’te yayındaki ilanlardan gelir. Kartta il, ilçe, oda ve alan görünür. Şehir kartı o ilin ilan listesini açar.
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
