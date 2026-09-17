## [2026-09-17]

- **[Bugfix]**: Dil menüsü yönlendirmesi `0.0.0.0:3000` yerine ziyaretçinin açık olduğu origin’de kalacak şekilde düzeltildi.
- **[Docs]**: Faz 1 dersleri, doğrulama checklist’i ve script kullanımını içeren sayfa yeniden oluşturma playbook’u eklendi (`docs/PAGE_RECREATION_PLAYBOOK.md`).
- **[Frontend]**: StartKey.com.tr ana sayfası Türkçe, İngilizce ve Almanca olarak referans siteden alınan içerik, asset ve tema çalışma zamanı ile yeniden oluşturuldu.
- **[Backend]**: Ana sayfa istatistik, öne çıkan portföy, popüler şehir ve arama formu lookup verilerini sunan Laravel API eklendi.
- **[Backend]**: Bülten kayıt endpoint'i doğrulama, idempotent e-posta ve dakikada 5 istek sınırı ile eklendi.
- **[Infrastructure]**: PostgreSQL, Redis, Laravel API, nginx ve Next.js yığını `./start.sh` ile tek komutta ayağa kalkacak şekilde Docker'a alındı.
- **[Security]**: Bülten formu için reCAPTCHA v2 doğrulaması ve yetkisiz locale / bilinmeyen lookup reddi eklendi.
