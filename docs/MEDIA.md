# Görseller, veri ve Docker imajı

Lokal sitede her şey birebir duruyor: sayfalar, 721 ilan, ofisler, danışmanlar, fotoğraflar. Amaç aynı kopyanın **sunucuda da kaybolmadan** durması. Bu dosya o yolu anlatır.

Kod nasıl kurulur: mevcut sunucu için [`SETUP_COLOCATED.md`](./SETUP_COLOCATED.md), boş sunucu için [`SETUP.md`](./SETUP.md).

---

## 1. Basitçe ne oluyor?

Üç şey var. Birbirine karıştırılmamalı.

| Ne | Örnek | Nereye konur | Kod değişince |
| --- | --- | --- | --- |
| Kod | şablon, Laravel, Next | Git | Yeniden çekilir, site güncellenir |
| Yazı / ilan / ofis | 721 ilan, haber, form kaydı | PostgreSQL volume | **Kalır** |
| Fotoğraf | `web/public/media` (~11 GB) | Sunucu klasörü (imaja değil) | **Kalır** |
| Şifre / domain | `.env` | Yalnız sunucu diski | **Kalır** (Git’e girmez) |

Lokal “tık çalışıyor” çünkü bu üçü senin diskinde bir arada. Canlıda da aynı üçlü olacak; sadece **fotoğrafı Docker imajına ve GitHub’a koymayacağız**.

---

## 2. Şu anki sorun (neden 40+ GB imaj?)

`docker/web/Dockerfile` derlemede tüm `web/public/` klasörünü imaja kopyalıyor. İçinde `web/public/media/property` var: ~11 GB, ~99 bin dosya.

Sonuç:

* Her `docker compose build web` bu 11 GB’ı tekrar paketler.
* İmaj ~47 GB olur; disk (az önce olduğu gibi) dolar.
* Aynı fotoğraflar hem ev klasöründe hem imaj katmanında durur.
* `git add .` dersen GitHub 11 GB + 99 bin dosyayı yutamaz (yavaşlar, limit, clone ölür).

Lokal sitenin birebir görünmesi doğru. Yanlış olan, o birebirliği **imajın içine gömmek**.

---

## 3. İzlenecek yol

```text
Git          = kod (küçük)
rsync        = fotoğraflar + büyük seed JSON
Postgres     = canlı veri (volume, asla down -v yok)
.env         = sunucuda kalır
Docker imaj  = yalnızca Next/Laravel programı (medya yok)
```

Hedef: web imajı **~1 GB civarı**. Fotoğraflar konteyner açılınca klasör olarak bağlanır (`/app/public/media`). Sen header’ı değiştirirsin, `git pull` + küçük rebuild; 721 ilan ve fotoğraflar yerinde kalır.

Bu ayrım artık repoda: `.dockerignore` medyayı imaja sokmaz; `docker-compose.yml` `./web/public/media` klasörünü konteynere **salt okunur** bağlar. Dosyalar disktan silinmez.

---

## 4. Git’e ne gider, ne gitmez

**Gider (küçük, metin/kod):**

* `web/src`, `api/app`, compose, Dockerfile
* Küçük tema / font asset’leri (`web/public/themes`)
* `.env.example` (boş sırlar)

**Gitmez:**

* `.env` (gerçek şifre)
* `web/public/media/property` (11 GB ilan fotoğrafı)
* `node_modules/`, `.next/`, `vendor/`
* `web/public/media` altındaki diğer ağır klasörler (`property` şart; `user` / `content` küçükse Git’te kalabilir)

**Büyük seed JSON** (`api/database/data/portfolio-seed.json` ~45 MB, `offices-seed.json` ~12 MB):

* GitHub tek dosyada 100 MB üstünü reddeder; 50 MB civarı uyarı verir.
* Bu iki dosya **felaket kurtarma** içindir. Git yerine sunucuya `rsync` ile gider.
* API her açılışta `db:seed` çalıştırır ve bu dosyaları **bekler**. Dump alsan bile JSON’lar sunucuda olmalı; yoksa konteyner ayağa kalkmaz.

`git add .` **kullanma.** Medya ignore edilmeden eklenirse repo şişer.

---

## 5. Lokal → sunucu ilk kopya

PC’de site duruyor. Sunucuya **bir kez** şunlar gider.

### 5.1 Kod

```bash
# PC
cd ~/MyFiles/sinapp/startkey
git push origin main
```

Sunucuda `git clone` / `git pull`. Yalnızca Git’teki dosyalar gelir. 11 GB fotoğraf gelmez — bu doğru.

### 5.2 Fotoğraflar (`rsync`)

PC’den (kendi kullanıcı/host ile):

```bash
rsync -aH --info=progress2 \
  ./web/public/media/ \
  deploy@SUNUCU_IP:~/startkey/web/public/media/
```

İlk sefer ~11 GB, saatler sürebilir. Sonraki seferler yalnız yeni/değişen dosya.

Kesilirse **aynı komutu tekrar çalıştır**; `rsync` kaldığı yerden devam eder.

### 5.3 Seed JSON

```bash
rsync -a \
  ./api/database/data/ \
  deploy@SUNUCU_IP:~/startkey/api/database/data/
```

Özellikle `portfolio-seed.json` ve `offices-seed.json` Git’te olmayabilir; bunlarsız API seed patlar.

### 5.4 Veritabanı — iki yoldan biri yeter

**Yol A (lokal ile %100 aynı satırlar):** lokal Postgres dump, sunucuda restore.

Lokal (stack açıkken):

```bash
cd ~/MyFiles/sinapp/startkey
docker compose exec -T postgres \
  pg_dump -U startkey --no-owner --no-acl startkey \
  > /tmp/startkey.sql
rsync -a /tmp/startkey.sql deploy@SUNUCU_IP:~/startkey/startkey.sql
```

Sunucuda volume oluştuktan sonra (SETUP dosyasındaki sıra):

```bash
docker compose exec -T postgres \
  psql -U startkey startkey < ~/startkey/startkey.sql
```

**Yol B:** JSON’lar yerindeyse API giriş scripti `migrate` + `db:seed` yapar. Seed’ler `updateOrCreate` kullanır; tekrar çalışınca satır çoğalmaz. Görünen içerik lokal dump ile aynıdır (aynı seed dosyalarıysa).

İlk canlıda **A + rsync media** en az sürprizdir: lokalde ne görüyorsan sunucuda odur.

Dump’taki `startkey` kullanıcı/veritabanı adı sunucu `.env` ile aynı olmalı.

---

## 6. Ne kalıcı, ne yasak

Kalıcı Docker volume: `startkey_postgres-data` (compose adı `postgres-data`).

```bash
# Güvenli — kod/konteyner durur, veri durur
docker compose down

# YASAK (canlı) — Postgres volume silinir, ilanlar gider
docker compose down -v
```

Ayrıca canlıda **yapma:**

* `docker system prune -a` (Satıver / ResidenceHero / NPM imajı da gider)
* `migrate:fresh`, `db:wipe`
* Web imajını medya ile tekrar paketlemek
* Sunucu `.env` dosyasını Git’e commit

Yedek (ayda / önemli işten önce):

```bash
docker compose exec -T postgres \
  pg_dump -U startkey --no-owner --no-acl startkey \
  > ~/backups/startkey-$(date +%F).sql
rsync -a ~/startkey/web/public/media/ ~/backups/startkey-media/
```

Yedekleri **aynı VPS’ten başka yere** de kopyala (disk ölürse volume da ölür).

---

## 7. Kod güncellemesi (fotoğraf gitmez)

```text
PC’de kod değiştir → git push
sunucu: git pull
sunucu: docker compose build web && docker compose up -d
```

`public/media` mount ise yeni imaj boş media getirmez; eski klasör bağlanır.

`.env` içindeki `NEXT_PUBLIC_*` (Reonix URL, reCAPTCHA site key) **build anında** Next bundle’a girer. Bunları değiştirince web’i yeniden build et.

---

## 8. Reonix sonrası

İlan/ofis/danışman nihai kaynağı Reonix olacak. O gün:

* Şablonlar aynı kalır.
* Seed / dump **geçmiş kopyadır**; Reonix yazınca onun satırı geçerli olur.
* Fotoğraflar büyük ihtimalle Reonix/storage’a taşınır; o geçiş ayrı iş.
* Bu dosyadaki kural değişmez: **program Git’te, asıl veri volume’da, ağır dosya diskte.**

---

## 9. Disk hesabı (kabaca)

| Parça | İlk kopya |
| --- | --- |
| Fotoğraflar | ~11 GB |
| Seed JSON | ~60 MB |
| Postgres volume | yüzlerce MB |
| Web imajı (medya dışındayken) | ~1 GB hedef |
| Web imajı (medya içindeyken, şu an) | ~47 GB — canlıda kullanılmayacak |

Satıver + ResidenceHero yanında **en az ~20 GB boş** disk bırak. 47 GB imaj + cache o VPS’i doldurur.

---

## 10. Kontrol

Sunucuda media bağlandıktan sonra:

```bash
# Klasör dolu mu?
du -sh ~/startkey/web/public/media/property

# Site fotoğrafı 200 mü? (örnek bir dosya adı lokalden bak)
curl -sS -o /dev/null -w '%{http_code}\n' https://DOMAIN/media/property/ORNEK.jpg
```

404 ise mount yok veya rsync bitmemiş demektir; imajı şişirmeye geri dönme, `rsync`’i tamamla.
