# Sistem işleri

## Katalog taraması (ofis ve danışman)

**Amaç:** StartKey.com.tr üzerindeki her public ofisi ve danışmanı (tr/en/de) yerel seed dosyasına almak. Ofis ve danışman ciro, işlem ve kulüp rozetleri `rankBadges` olarak yazılır. Rozeti olmayan kayıt `[]` gider; içe aktarma bu listeyle Reonix’teki eski rozetleri siler.

**Komut:**

```bash
python3 scripts/crawl-offices.py
```

Çıktı `api/database/data/offices-seed.json` dosyasıdır. Yarım kalan çalıştırma, dosyada tamamlanmış satırları atlayarak sürer.

Reonix’e göndermek ayrı komuttur ve ağı kullanır:

```bash
python3 scripts/import-catalogue.py
```

**Sıklık:** Her gece bir kez. Örnek crontab (sunucunun proje kökünde, saat 03:00):

```cron
0 3 * * * cd /path/to/startkey && python3 scripts/crawl-offices.py && python3 scripts/import-catalogue.py
```

`/path/to/startkey` sunucudaki depo köküdür. İçe aktarma `REONIX_BASE_URL` ve `REONIX_PORTAL_KEY` değerlerini ortamdan okur; bu değerler crontab satırına yazılmaz.

**Container:** Yok. Komutlar host üzerinde `scripts/` içinden çalışır. Laravel scheduler veya queue kullanmaz.

**Timeout:** Tam tarama ofis ve danışman sayısına bağlıdır. İstekler arasında en az 3 saniye vardır. Yarım kalırsa aynı komut kaldığı yerden sürer.

**Retry:** Sayfa isteği komutun içinde 4 kez denenir. Başarısız sayfa atlanır; komutun kendisi yeniden kuyruğa alınmaz.

**Yük:** Referans siteye sıralı istek. Gece tek çalıştırma.

**Hata:** Başarısız sayfa stderr’e yazılır. Seed, o ana kadarki kontrol noktasıyla durur. İçe aktarma, eksik ortam değişkeninde çıkar ve gövde basmaz.

**Idempotency:** Aynı `importKey` (`office:{id}`, `consultant:{id}`) yeniden gönderilir. `rankBadges` her kayıtta vardır; boş liste o kaydın rozetlerini değiştirir.
