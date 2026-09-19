# StartKey

StartKey.com.tr public websitesinin lokal yeniden oluşturması. Faz 1 yalnızca ana sayfayı kapsar.

## Çalıştırma

Docker ve Docker Compose yeterlidir. Depo kökünde:

```bash
./start.sh
```

İlk çalıştırmada `.env` yoksa `.env.example` kopyalanır; `APP_KEY` ve `DB_PASSWORD` üretilir. Ardından PostgreSQL, Redis, Laravel API, nginx ve Next.js ayağa kalkar.

Hazır olduğunda:

| Servis | Adres |
| --- | --- |
| Website (Türkçe, varsayılan) | http://localhost:3000 |
| Website (TR / EN / DE) | http://localhost:3000/tr · `/en` · `/de` |
| API | http://localhost:8080/api/v1/homepage?locale=tr |

Portlar `.env` içindeki `WEB_PORT` (varsayılan `3000`) ve `API_PORT` (varsayılan `8080`) ile değişir.

Durdurmak için:

```bash
docker compose down
```

## Diller

Referans sitedeki gibi üç dil vardır: Türkçe (`tr`), English (`en`), Deutsch (`de`). `/` Türkçe ana sayfayı rewrite eder; yönlendirme yapmaz.

Sonraki public sayfalar için yöntem, checklist ve script listesi: `docs/PAGE_RECREATION_PLAYBOOK.md`.

## Canlı kurulum

Lokal `./start.sh` canlı VPS için değildir.

| Durum | Kılavuz |
| --- | --- |
| Satıver + ResidenceHero **aynı** sunucu | [`docs/SETUP_COLOCATED.md`](docs/SETUP_COLOCATED.md) |
| Boş Ubuntu VPS | [`docs/SETUP.md`](docs/SETUP.md) |
| Fotoğraf, seed, büyük Docker imajı | [`docs/MEDIA.md`](docs/MEDIA.md) |

## Geçici veriler

Portföy, istatistik, şehir ve arama dropdown verileri Reonix gelene kadar referans siteden alınmış seed verisidir. Kayıtlar `docs/TECHNICAL_DEBT.md` içindedir.
