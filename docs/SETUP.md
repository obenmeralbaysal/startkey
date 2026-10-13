# Kurulum — sıfırdan boş sunucu

Bu kılavuz üzerinde **yalnızca StartKey** (ve onun önündeki NPM) olacak yeni bir Ubuntu VPS içindir.

Satıver + ResidenceHero **zaten duran** makine: [`SETUP_COLOCATED.md`](./SETUP_COLOCATED.md) — bu dosyadaki “boş VPS’e NPM kur, 8080 yayınla” adımları o makinede Satıver’i kırar.

Fotoğraf, seed, imaj boyutu: [`MEDIA.md`](./MEDIA.md).

---

## 0. Bir cümle

Sunucuya Docker + NPM koyarsın. StartKey kendi compose’u ile kalkar. Ziyaretçi NPM üzerinden HTTPS görür. Kod Git’ten, fotoğraflar `rsync` ile, ilanlar Postgres volume’da durur.

```text
İnternet → NPM :80 / :443  →  startkey-web:3000
                                      ↓
                                 nginx (API, iç ağ)
                                      ↓
                                 postgres + redis
```

---

## 1. Sunucu

| | Minimum | Rahat |
| --- | --- | --- |
| OS | Ubuntu 24.04 LTS | 24.04 |
| RAM | 4 GB + 2 GB swap | 8 GB |
| Disk | 40 GB SSD (11 GB fotoğraf + imaj) | 80 GB+ |
| CPU | 2 vCPU | 4 vCPU |
| Ağ | Sabit IPv4 + domain A kaydı | aynı |

4 GB’ta swap yoksa ilk Next production build OOM ile düşer.

---

## 2. Kullanıcı, güvenlik duvarı, Docker

Root ile bağlan, günlük kullanıcı:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Sonra **`deploy` ile SSH**.

```bash
sudo timedatectl set-timezone Europe/Istanbul
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw fail2ban
```

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

81 (NPM panel) ve 8080 **internete açılmaz.**

4 GB RAM ise swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Docker Engine + Compose v2 ([Docker Ubuntu kurulumu](https://docs.docker.com/engine/install/ubuntu/)):

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
```

Oturumu kapat, yeniden SSH. `docker` / `docker compose` `sudo`suz çalışmalı.

---

## 3. Nginx Proxy Manager

NPM **apt ile değil**, ayrı klasör:

```bash
sudo mkdir -p /root/nginx-proxy-manager
sudo tee /root/nginx-proxy-manager/docker-compose.yml >/dev/null <<'EOF'
services:
  app:
    image: jc21/nginx-proxy-manager:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - default
      - startkey

networks:
  startkey:
    external: true
    name: startkey-network
EOF
```

`startkey-network` henüz yok; StartKey `up` olduktan sonra oluşur. İlk seferde `networks.startkey` satırlarını **yorum yapıp** yalnız NPM’i kaldırabilirsin; StartKey ayağa kalkınca ağı ekleyip `docker compose up -d` tekrar.

```bash
cd /root/nginx-proxy-manager
sudo docker compose up -d
```

Panel (kendi PC):

```bash
ssh -L 8181:127.0.0.1:81 deploy@SUNUCU_IP
```

Tarayıcı: `http://127.0.0.1:8181` — ilk giriş NPM varsayılanı (kurulum sihirbazı). Şifreyi değiştir. Let’s Encrypt için gerçek e-posta; `admin@example.com` olmaz.

---

## 4. Domain

A `@` / `www` → VPS IPv4, Cloudflare **gri bulut**.

```bash
curl -4 ifconfig.me; echo
dig +short STARTKEY_DOMAIN A
```

---

## 5. Repoyu çek ve ağır dosyaları kopyala

```bash
cd ~
git clone git@github.com:yilmazaygin/startkey.git startkey
cd ~/startkey
```

Git **11 GB fotoğrafı getirmez.** PC’den [`MEDIA.md`](./MEDIA.md) §5:

1. `rsync` `web/public/media/`
2. `rsync` `api/database/data/` (`portfolio-seed.json`, `offices-seed.json` şart)
3. İstersen lokal `pg_dump` (yol A)

```bash
mkdir -p ~/startkey/web/public/media
du -sh ~/startkey/web/public/media/property
# 11G civarı görmeden “site hazır” deme
```

---

## 6. `.env`

```bash
cd ~/startkey
cp .env.example .env
sed -i 's/\r$//' .env
```

```bash
# çıktıyı şifre yöneticisine yaz
echo "APP_KEY=base64:$(openssl rand -base64 32)"
echo "DB_PASSWORD=$(openssl rand -hex 24)"
```

`nano .env`:

```bash
APP_KEY=
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info
DB_DATABASE=startkey
DB_USERNAME=startkey
DB_PASSWORD=
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

`HOST_UID` / `HOST_GID` = `id -u` / `id -g`.

Boş VPS’te `8080` Satıver’de değil; yine de UFW 8080 kapalı kalsın. İnternet yalnız 80/443. Hedef: web host’ta yayınlanmasa da olur (NPM konteyner adına gider).

`./start.sh` lokal içindir (`localhost` bekler). Canlıda `docker compose up` kullan; `start.sh` host 3000/8080 açar — boş sunucuda duman için işe yarar, NPM varken şart değil.

---

## 7. Compose up

Medyayı imaja gömmeyen yol hazır değilse önce [`MEDIA.md`](./MEDIA.md) §3 — aksi halde tek build diski doldurur.

Ağ adı `startkey-network` olacak şekilde compose’a named network eklenmeli (NPM §3). Yoksa:

```bash
docker network create startkey-network
```

```bash
cd ~/startkey
docker compose up -d --build
```

İlk build uzun. `api` girişte `migrate` + `db:seed` (JSON şart).

```bash
docker compose ps
docker compose logs -f --tail=80 api web
```

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/tr
curl -sS 'http://127.0.0.1:8080/api/v1/homepage?locale=tr' | head -c 200
```

Dump restore: [`MEDIA.md`](./MEDIA.md) §5.4.

---

## 8. NPM’i StartKey ağına bağla

```bash
sudo docker network connect startkey-network nginx-proxy-manager-app-1
# veya NPM compose'a external startkey ağı ekleyip:
cd /root/nginx-proxy-manager && sudo docker compose up -d
```

Yeni Proxy Host:

| Alan | Değer |
| --- | --- |
| Domain | StartKey FQDN (+ www) |
| Scheme | `http` |
| Forward Hostname | `startkey-web` (`docker ps` ile ad) |
| Forward Port | `3000` |
| Custom Locations | boş |
| SSL | yeni sertifika, Force SSL |

`127.0.0.1` yazma.

---

## 9. Duman

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://STARTKEY_DOMAIN/tr
curl -sS -o /dev/null -w '%{http_code}\n' http://STARTKEY_DOMAIN/tr
```

HTTPS `200`, HTTP yönlendirme. Fotoğraf: [`MEDIA.md`](./MEDIA.md) §10.

---

## 10. Yedek ve güncelleme

```bash
# güncelleme
cd ~/startkey
git pull
docker compose up -d --build
```

```bash
# yedek — down -v YOK
mkdir -p ~/backups
docker compose exec -T postgres \
  pg_dump -U startkey --no-owner --no-acl startkey \
  > ~/backups/startkey-$(date +%F).sql
```

Yasağı: `docker compose down -v`, `docker system prune -a`, `migrate:fresh`.

---

## 11. Kontrol listesi

- [ ] UFW yalnız 22 / 80 / 443
- [ ] NPM ayakta, panel tünelle
- [ ] Clone + media rsync + seed JSON
- [ ] `.env` production, sırlar dolu
- [ ] `/tr` ve API 200
- [ ] HTTPS Proxy Host
- [ ] Yedek klasörü başka disk / makine
