## [2026-09-17]

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
