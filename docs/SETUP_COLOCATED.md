# Kurulum — Satıver + ResidenceHero olan sunucu

Bu kılavuz **dolu VPS** içindir: üzerinde Satıver, ResidenceHero ve Nginx Proxy Manager (NPM) çalışıyordur. Amaç StartKey’i **onları bozmadan** yanına koymak.

Boş makine: [`SETUP.md`](./SETUP.md). Fotoğraf / imaj / kaybolmama: [`MEDIA.md`](./MEDIA.md).

Satıver’in kendi NPM notları: Satıver reposu `docs/NPM.md`. ResidenceHero yanı: RH `docs/COLOCATED_WITH_SATIVER.md`. **O dosyalardaki Satıver / RH kayıtlarını değiştirme.**

---

## 0. Bir cümle

StartKey kendi klasöründe, kendi Docker ağında kalkar. İnternet 80/443’ü NPM tutmaya devam eder. NPM’e **yeni bir domain** eklenir; Satıver ve RH host’larına dokunulmaz.

```text
İnternet → NPM :80 / :443
              ├─ sativer.com.tr     → sativer-gateway:80     (dokunma)
              ├─ RH domainleri      → residencehero-traefik  (dokunma)
              └─ startkey domain    → startkey-web:3000      (yeni)
```

---

## 1. Önce zarar verme

Aşağıdakileri **çalıştırma:**

| Yasak | Neden |
| --- | --- |
| Satıver / RH klasöründe `docker compose down -v` | Onların Postgres’i silinir |
| `docker system prune -a` | NPM, Satıver, RH imajı gider |
| Host’ta `80`, `443`, `81`, `8080` yayınlamak | 80/443 NPM’de; **8080 Satıver yedek kapısı** |
| StartKey’i `~/sativer` veya `~/residencehero` içine koymak | `down` sizin ağı da etkileyebilir |
| Satıver NPM Proxy Host’una Custom Location | Satıver 502 olur |
| Cloudflare turuncu bulut (HTTP-01 öncesi) | Let’s Encrypt bozulur |
| Medyayı imaja gömüp `build` | Disk dolar; Satıver/RH da sıkışır — [`MEDIA.md`](./MEDIA.md) |

StartKey eklemeden Satıver ve RH ayakta olmalı:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
curl -sS -o /dev/null -w 'sativer %{http_code}\n' https://SATIVER_DOMAIN/healthz
```

Satıver `200` değilse StartKey ekleme.

Bilinen colocated host (Satıver `docs/NPM.md`): NPM `/root/nginx-proxy-manager`, Satıver `~/sativer`, ağ `sativer-network`, RH `residencehero-network`. SSH kullanıcısı genelde `deploy`.

---

## 2. Disk, RAM, port

```bash
free -h
df -h /
```

| | En az |
| --- | --- |
| RAM | İki Next (RH + StartKey) için **8 GB** + swap. 4 GB’ta ikinci build düşer |
| Boş disk | **≥ 20 GB** (11 GB fotoğraf + imaj; 47 GB’lık eski web imajı **yapılmayacak**) |
| Host 80/443 | Yalnız NPM |
| Host 8080 | Satıver; UFW kapalı kalır. StartKey **8080 almaz** |

---

## 3. Domain ve DNS

Satıver / RH zone’una **dokunma**. StartKey için ayrı FQDN (geçici `startkey.ornek.com` veya müşteri alanı).

Cloudflare A `@` / `www` → bu VPS IPv4, **DNS only (gri bulut)**.

```bash
curl -4 ifconfig.me; echo
dig +short STARTKEY_DOMAIN A
```

IP sunucu değilse sertifika isteme.

---

## 4. Repoyu çek

`deploy` yazabilir klasör. Satıver’in yanına, ayrı:

```bash
cd ~
git clone git@github.com:yilmazaygin/startkey.git startkey
cd ~/startkey
```

HTTPS + token da olur. Private ise deploy key.

Bu clone **fotoğrafları getirmez.** [`MEDIA.md`](./MEDIA.md) §5: `rsync` media + `api/database/data/*.json` (özellikle `portfolio-seed.json`, `offices-seed.json`).

```bash
mkdir -p ~/startkey/web/public/media
# PC'den rsync bitmeden siteyi "bitti" sayma
```

---

## 5. `.env`

```bash
cd ~/startkey
cp .env.example .env
sed -i 's/\r$//' .env
```

Sırlar (sohbete yapıştırma; şifre yöneticisine yaz):

```bash
APP_KEY="base64:$(openssl rand -base64 32)"
DB_PASS="$(openssl rand -hex 24)"
```

`.env` içinde en az:

```bash
APP_KEY=         # yukarıdaki
APP_ENV=production
APP_DEBUG=false
DB_DATABASE=startkey
DB_USERNAME=startkey
DB_PASSWORD=     # yukarıdaki
WEB_PORT=3000
API_PORT=8080
HOST_UID=1000
HOST_GID=1000
NEXT_PUBLIC_REONIX_URL=
# Unused. Public forms use the v3 pair below.
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=
RECAPTCHA_V3_SECRET_KEY=
RECAPTCHA_V3_MIN_SCORE=0.5
```

`HOST_UID` / `HOST_GID` sunucudaki `id -u` / `id -g` (`deploy`).

**Kritik (colocated):** `docker-compose.behind-npm.yml` host’ta **hiç port yayınlamaz** (8080 Satıver’de kalır). NPM `startkey-web:3000` görür.

`NEXT_PUBLIC_*` web **build** anında gömülür. Domain/key değişince web rebuild.

Satıver veya RH `.env` şifrelerini kopyalama.

---

## 6. Yığını kaldır (Satıver/RH compose’una dokunma)

```bash
cd ~/startkey
```

```bash
export SK='docker compose -f docker-compose.yml -f docker-compose.behind-npm.yml'
$SK up -d --build
```

`./start.sh` kullanma (3000 ve 8080 yayınlar). İlk Next build 5–15 dk. Medya imaja girmez (`.dockerignore`).

```bash
docker compose ps
docker compose logs -f --tail=80 api web
```

`startkey-web-1` / `startkey-api-1` healthy. İsimler `startkey-` ile başlar; `sativer-` / `residencehero-` / `nginx-proxy-manager` **Restart / Recreate** olmamalı.

API içeriden:

```bash
docker compose exec api php artisan --version
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/tr
# web host'ta yayınlı değilse:
docker compose exec web wget -qO- http://127.0.0.1:3000/tr | head -c 200
```

`/tr` HTML, `/api/v1/homepage?locale=tr` (nginx iç ağ) JSON.

Entrypoint `migrate` + `db:seed` çalıştırır. JSON yoksa api düşer → `rsync` §4.

Lokal dump kullanacaksan [`MEDIA.md`](./MEDIA.md) §5.4 — seed’den **sonra** restore, veya JSON + dump birlikte (seed `updateOrCreate`).

---

## 7. NPM’i StartKey ağına bağla

Satıver ve RH Proxy Host satırına **dokunma**.

StartKey compose kendi ağını `startkey-network` adıyla verse (hedef):

```bash
docker network ls | grep -E 'sativer|residencehero|startkey'
```

NPM compose (`/root/nginx-proxy-manager/docker-compose.yml`) — `app.networks` listesine **ekle**, eskileri silme:

```yaml
services:
  app:
    networks:
      - default
      - sativer
      - residencehero
      - startkey

networks:
  sativer:
    external: true
    name: sativer-network
  residencehero:
    external: true
    name: residencehero-network
  startkey:
    external: true
    name: startkey-network
```

```bash
cd /root/nginx-proxy-manager
sudo docker compose up -d
```

Ağ varken tek seferlik:

```bash
sudo docker network connect startkey-network nginx-proxy-manager-app-1
```

NPM konteyner adı `docker ps | grep npm` ile bak.

**Yanlış:** Forward Hostname `127.0.0.1` — NPM’in içi, 502.

**Doğru:** konteyner adı + **iç** port: `startkey-web` ve `3000`.

---

## 8. Yeni Proxy Host (yalnız StartKey domain)

Panel: Satıver `docs/NPM.md` — host 81 UFW kapalı, tünel `ssh -L 8181:127.0.0.1:81 …`

| Alan | Değer |
| --- | --- |
| Domain Names | StartKey FQDN (+ www) |
| Scheme | `http` |
| Forward Hostname | `startkey-web` (veya `startkey-web-1` — `docker ps` ile doğrula) |
| Forward Port | `3000` |
| Custom Locations | **boş** |
| Websockets | açık |
| SSL | Request a new Certificate, Force SSL, gerçek e-posta |

Let’s Encrypt e-postası `admin@example.com` olmaz.

Kaydetmeden Satıver / RH host’larını açıp kaydetme.

---

## 9. Duman — üç site

```bash
curl -sS -o /dev/null -w 'startkey https %{http_code}\n' https://STARTKEY_DOMAIN/tr
curl -sS -o /dev/null -w 'startkey http  %{http_code}\n' http://STARTKEY_DOMAIN/tr
curl -sS -o /dev/null -w 'sativer  %{http_code}\n' https://SATIVER_DOMAIN/healthz
curl -sS -o /dev/null -w 'rh      %{http_code}\n' https://RH_DOMAIN/
```

Beklenen: StartKey HTTPS `200`, HTTP `301`/`308`; Satıver `200`; RH önceki gibi `200`.

Fotoğraf: [`MEDIA.md`](./MEDIA.md) §10. Boş medya = rsync bitmemiş, Satıver bozulmuş değil.

---

## 10. Kod güncelleme (canlı StartKey)

Repo `startkey` kullanıcısına aittir. Root ile çekmek için bu dizin Git’e güvenli yazılır (`safe.directory`). Güncelleme:

```bash
cd ~/startkey
make deploy
```

Sıra: `git pull --ff-only`, yeni dosyaların sahibi yine `startkey`, web imajı yeniden kurulur, web ayağa kalkar, API konteyneri yeniden başlar (migration çalışır; ilan varsa seed atlanır). `down` yok.

`docker compose down` kullanma: named `startkey-network` NPM’e bağlıdır, `down` ağı silmeye çalışır ve bu hatayı verir. `down -v` yok. Satıver/RH dizinine girip `compose` çalıştırma.

İlk kurulumda ağ yoksa bir kez: `docker network create startkey-network`

---

## 11. Takılan güncelleme (Satıver / RH / fotoğraf bozulmadan)

Kod dün çalışıyordu, `compose down` veya `up` ağı/API’yi karıştırdıysa. **Fotoğrafı yeniden `rsync` etme.** Volume ve `web/public/media` durur.

Yasak: `~/sativer` / ResidenceHero compose, `docker compose down`, `down -v`, `docker network rm startkey-network`, `docker system prune`, `migrate:fresh`.

```bash
# 1) Öteki siteler ayakta mı? (yalnız bak)
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'sativer|residencehero|nginx-proxy-manager|startkey'

# 2) Fotoğraf ve DB yerinde mi?
du -sh ~/startkey/web/public/media/property
docker compose -f docker-compose.yml -f docker-compose.behind-npm.yml exec -T postgres \
  psql -U startkey -d startkey -tAc 'SELECT COUNT(*) FROM cms_listings'

# 3) API seed’de mi, yoksa php-fpm hazır mı?
docker compose -f docker-compose.yml -f docker-compose.behind-npm.yml logs --tail=30 api
```

`seeding reference data` görüyorsan bitmesini bekle (`[api] ready` veya `skipping seed`). `GET /index.php 200` varsa API zaten iş görür.

```bash
export SK='docker compose -f docker-compose.yml -f docker-compose.behind-npm.yml'
cd ~/startkey
git pull
# .env içine FORCE_DB_SEED= ekle (boş). 1 yazma.

# 4) API’yi recreate ETME (seed yeniden çalışır). Nginx + web.
$SK up -d --no-deps nginx web

# Nginx Restarting + inspect’te startkey_default varsa eski konteyner
# `api` hostunu çözemez. Yalnız nginx’i overlay ağına al:
$SK up -d --no-deps --force-recreate nginx
# veya: docker network connect startkey-network startkey-nginx-1 && docker start startkey-nginx-1

# 5) Hepsi startkey-network’te mi? (NPM dahil)
docker inspect startkey-api-1 startkey-nginx-1 startkey-web-1 \
  --format '{{.Name}} {{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
docker network inspect startkey-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

`startkey-web-1` yoksa: `$SK up -d --no-deps web`. Ağda yoksa: `docker network connect startkey-network startkey-web-1` (NPM’i çıkarma).

```bash
# 6) Duman — üç site + bir fotoğraf
$SK exec web wget -qO- http://127.0.0.1:3000/tr | head -c 80
curl -sS -o /dev/null -w 'startkey %{http_code}\n' https://STARTKEY_DOMAIN/tr
curl -sS -o /dev/null -w 'sativer  %{http_code}\n' https://SATIVER_DOMAIN/healthz
curl -sS -o /dev/null -w 'rh       %{http_code}\n' https://RH_DOMAIN/
curl -sS -o /dev/null -w 'media    %{http_code}\n' https://STARTKEY_DOMAIN/media/property/BIR_DOSYA.jpg
```

Sonraki güncellemeler: `git pull` + `$SK build web && $SK up -d --no-deps web`. API/PHP değişmediyse api’ye dokunma. `down` yok.

---

## 12. 502 / “öteki site düştü” kontrolü

1. `docker ps` — `sativer-gateway`, RH, NPM, `startkey-web` hepsi `Up` mı?
2. StartKey 8080 yayınlıyor mu? Yayınlıyorsa kapat (Satıver kapısı).
3. NPM `startkey-network` üzerinde mi? Hostname konteyner adı mı?
4. Port `3000` (web içi), `8080` değil.
5. `~/sativer` `down` olduysa önce Satıver `up`, sonra NPM `up` (Satıver `docs/NPM.md`).
6. Disk `%100` mü? Medya imaja girdiyse prune **etme**; [`MEDIA.md`](./MEDIA.md).

---

## 13. Kontrol listesi

- [ ] Satıver ve RH StartKey’ten önce `200`
- [ ] `~/startkey` ayrı klasör
- [ ] Host 80/443/81/8080 StartKey’te yok
- [ ] Media + seed JSON `rsync` (Git yetmez)
- [ ] `.env` sunucuda, Git’te değil
- [ ] NPM’e yalnız yeni domain; eski host’lar aynı
- [ ] Üç domain duman testi
- [ ] `docker compose down -v` bilinmiyor / kullanılmayacak
