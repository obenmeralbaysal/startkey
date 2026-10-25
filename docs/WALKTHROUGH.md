# Walkthrough

**Tarih:** 2026-10-24

Bu dosya yapılan işin çalışma hafızasıdır. Değişiklik listesi `docs/CHANGELOG.md` içindedir. Geçici bırakılanlar `docs/TECHNICAL_DEBT.md` içindedir. Sayfa kurma sırası `docs/PAGE_RECREATION_PLAYBOOK.md` içindedir.

Yeni bir oturum deploy, Docker, ofis verisi veya iki sistemin sınırına dokunacaksa önce burayı okur.

---

## 1. İki sistem

| | StartKey | Reonix |
| --- | --- | --- |
| Kod | `/Applications/XAMPP/xamppfiles/htdocs/startkey-sistem` | `/Applications/XAMPP/xamppfiles/htdocs/reonix` |
| Compose adı | `startkey` | `reonix` |
| Ne iş yapar | Public site ve `/portal` | Ofis işinin kaynağı |
| Veritabanı | Kendi Postgres’i | Kendi Postgres’i (`emlakcrm`) |

StartKey franchise merkezidir. Reonix altyapıdır. Tarayıcı Reonix ekranını, adını, adresini ve oturumunu görmez. Çağrı StartKey API sunucusundan gider. Ofis işi Reonix’te kalır: talep, portföy, eşleşme, onay, Sahibinden, kapanış, hakediş. StartKey bu işler için ikinci bir tablo açmaz.

StartKey veritabanında kalanlar: kurumsal CMS, genel iletişim, bülten, eğitim başvurusu, danışman yorumu.

Kullanıcıya görünen ad `Portal`’dır. `Reonix` yalnızca sunucu kodu ve yapılandırmada kalır.

---

## 2. Yerelde ayağa kaldırma

2026-10-24 öğleden sonra ayakta olan yığınlar bunlardı. Diğer projeler (binicilikfederasyonu, linklme, sporizi) durduruldu.

**StartKey** — site `http://localhost:3030`, API `http://localhost:8080`.

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/startkey-sistem
docker compose up -d --build api web
```

Postgres ve Redis bununla gelir. Çalışan konteynerler: `startkey-web-1`, `startkey-nginx-1`, `startkey-api-1`, `startkey-postgres-1`, `startkey-redis-1`. Web host portu `3030`’dur. Compose örneğindeki varsayılan `3000` değildir.

**Reonix** — API `http://127.0.0.1:8091`.

```bash
docker start reonix-db reonix-redis reonix-backend reonix-nginx
```

Bu dört konteyner loopback `8091` ile kayıtlıdır. `docker compose up` onları yeniden kurar. Compose dosyasındaki `reonix-gateway` host `8080`’i ister. StartKey nginx de `8080`’dedir. İkisi aynı anda `8080`’i alamaz. Yerel testte gateway açılmaz.

`startkeytest` adında bir konteyner veya Compose projesi bu Docker motorunda yok.

**Testler**, yığın ayaktayken:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/startkey-sistem
docker compose exec api php artisan test
```

StartKey testleri `api/phpunit.xml` ile sqlite bellek kullanır.

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/reonix
docker compose exec backend php artisan test
```

Reonix testleri `emlakcrm_test` veritabanına gider. Bu veritabanı Reonix Postgres’indedir.

---

## 3. Sunucular

| Ortam | Adres | Not |
| --- | --- | --- |
| Reonix production origin | `72.61.21.251` (`srv1563085.hstgr.cloud`) | `reonix.app` deploy’u. `~/reonix`, proje `emlakcrm`. Konteyner adları ve `3000` / `8080` sabittir. |
| Reonix test ve Sinapp test | `188.132.205.243` | Test yolu sunucuda `/root/reonix-test`. Sinapp test deploy’u da bu makinededir. |

`test.reonix.app` bu test makinesine gider. Production origin’de ikinci kopya açılmaz.

Test yığını kendi Compose projesidir: kendi konteyner adları, kendi Postgres volume’u, kendi Redis volume’u, Sinapp’in `80` / `443` bağlamasına dokunmayan portlar. Production volume bağlanmaz. Veritabanı boş açılır, ardından `php artisan migrate --force`.

DNS: `test.reonix.app` A kaydı `188.132.205.243`. Bu makinedeki Nginx Proxy Manager’a Force SSL’li proxy host eklenir. Test konteynerleri NPM ağına katılır.

| Yol | Hedef |
| --- | --- |
| `/` | test frontend, konteyner içi `3000` |
| `/api` | test nginx |
| `/storage` | test nginx |

`/api` ve `/storage` sonunda eğik çizgi taşımaz. Websocket açık kalır.

Frontend imajı build edilmeden önce ortam test host’udur. `NEXT_PUBLIC_API_URL` build anında gömülür.

- `APP_URL=https://test.reonix.app`
- `FRONTEND_URL=https://test.reonix.app`
- `NEXT_PUBLIC_API_URL=https://test.reonix.app/api/v1`
- `SANCTUM_STATEFUL_DOMAINS=test.reonix.app`
- `ALLOWED_ORIGINS=https://test.reonix.app`
- `SESSION_DOMAIN=test.reonix.app`
- yeni `APP_KEY`, yeni veritabanı parolası

Posta test kutusuna gider. WhatsApp mock kalır; canlı Meta webhook `reonix.app` üzerinde durur. PayTR / Sinapp dönüş adresleri ve secret’lar, test ödemesi bilinçli açılmadıkça boş kalır. reCAPTCHA anahtarına `test.reonix.app` eklenir. GitHub workflow’da test işi yoktur; bu yığın elle veya ayrı bir workflow ile gider.

---

## 4. Test bildirimleri

2026-10-24’te `188.132.205.243` üzerindeki `/root/reonix-test` okundu. API, queue ve scheduler aynı ayarı kullanır. Dört dış kanal sunucudan çıkmaz.

| Kanal | Ayar | Sonuç |
| --- | --- | --- |
| E-posta | Mailer `log`, Brevo anahtarı boş | Yalnızca log |
| SMS | NetGSM kapalı | Gönderim atlanır |
| WhatsApp | Meta mock açık, token ve telefon kimliği boş | Meta çağrılmaz |
| Push | OneSignal uygulama kimliği ve anahtarı boş | Gönderim atlanır |

Gelen kutu okuma da kapalıdır. Uygulama içi bildirim kutusu olay yazmaya devam eder.

---

## 5. Ofis konumu

Reonix `offices` tablosunda konum, metin `address` alanıdır. Enlem veya boylam kolonu yoktur.

2026-10-24 sayımı: aktif 88 ofisten 85’inin adresi dolu. Biçim şehir / ilçe / mahalle / sokak. Adresi boş olan üç kayıt: `Startkey Ref Gayrimenkul`, `bostan`, `Oben Deneme`.

StartKey `cms_offices` tablosunda `latitude` ve `longitude` kolonları vardır (`2026_09_19_000800_create_office_consultant_cms_tables`). Aynı gün çalışan StartKey Postgres’inde 85 ofis satırının 85’inde her iki kolon da doludur. İş kaydının kaynağı Reonix adres metnidir.

---

## 6. Public site ve portal

Public site referans yerleşimindedir. `/portal` Apple tarzı cam kabuktur: masaüstünde yan menü, tablette ikon şeridi, telefonda alt sekme. Public site bu dilden muaftır ve `%80` ölçeği (`--sk-scale`) kullanır. Portal bu ölçeği kullanmaz.

Portal bağlıyken public ofis, danışman ve portföy listeleri Reonix katalogundan okunur. Ana sayfadaki öne çıkan portföy ve popüler şehir kaydırıcıları yayındaki ilanlardan gelir. Bağlantı yoksa seed anlık görüntüsü kalır.

Franchise masası ofis kullanıcılarını listeler. Ad, e-posta ve telefon düzenlenir. Şifre portalda belirlenir. Başka bir ağa da kayıtlı hesap değiştirilemez. Aynı e-posta ikinci ofiste yeni profil açmaz. Birden fazla ofisi olan hesap ofis değiştirir.

Public danışman yorumu, Reonix süperadmin onaylamadan sitede görünmez. Onay ve ret `/admin/consultant-reviews` ekranındadır.

Ayrıntılı değişiklik sırası `docs/CHANGELOG.md` son kaydından geriye okunur. Son anlamlı gün `2026-10-15`’tir.
