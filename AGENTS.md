# Champion Tour — AGENTS.md

Bu dosya, Champion Tour projesinde kod yazarken uyulması gereken kuralları tanımlar.
Kaynak doküman: CHAMPION TOUR — MASTER GAME DESIGN DOCUMENT v1.0

## Teknoloji

- Vanilla HTML5, CSS3, JavaScript.
- **Framework yok.** React, Vue, jQuery, build tool (webpack/vite) kullanılmaz.
- Tarayıcıda doğrudan `file://` ile açılabilmeli. Bu yüzden ES module import/export
  yerine düz `<script>` etiketleri ve global namespace (`window.ChampionTour.*`) kullanılır.
- Kod, `file://` üzerinden CORS sorunu yaşamadan çalışmalı (fetch ile dış dosya okuma yok;
  veri dosyaları JS objesi olarak tanımlanır, JSON fetch edilmez).

## Geliştirme Sırası (GDD'den, bağlayıcı)

1. Merge Board
2. Producer
3. Merge
4. Orders
5. Economy
6. UI
7. Art
8. Audio
9. Save System
10. Monetization

Bir önceki sistem tamamen oynanabilir olmadan bir sonrakine geçilmez.

## Dosya Yapısı

```
champion-tour/
  index.html
  css/style.css
  js/
    i18n.js       -> çeviri sözlüğü + t(key) fonksiyonu
    data.js        -> sabit oyun verisi (sporlar, item zincirleri, producer tanımları)
    board.js       -> 7x9 grid render + hücre yönetimi
    producer.js    -> producer mantığı (cooldown, seviye, üretim)
    merge.js       -> merge kuralları ve animasyon tetikleyicileri
    main.js        -> oyun state'i, init, game loop (requestAnimationFrame / setInterval)
  assets/icons/    -> SVG ikonlar
```

## i18n Kuralı

- **Hiçbir UI metni koda gömülmez.** Her metin `i18n.js` içindeki bir key üzerinden gelir.
- Kullanım: `t('board.empty_cell')` gibi.
- Şu an desteklenen diller: `tr`, `en`. Varsayılan: `tr`.

## Görsel Üretimi — ART_DIRECTION.md

Canva (veya başka bir araç) ile üretilecek her görsel, `ART_DIRECTION.md`
dosyasındaki kalıcı sanat yönetimi kurallarına uymak ZORUNDA. Yeni bir görsel
istenmeden önce o doküman kontrol edilir. Kullanıcı açıkça değiştirmediği
sürece bu kurallar tüm proje boyunca geçerlidir.

## Kullanıcı Arayüzü — UI_GUIDE.md

Tüm yeni ekranlar, bileşenler ve UI/UX değişiklikleri `UI_GUIDE.md` içindeki
Champion Tour UI Guide v1.0 kurallarına uymak ZORUNDADIR. Yeni bir özellik
tasarlanmadan veya kodlanmadan önce mevcut tasarım dili analiz edilir ve bu
doküman kontrol edilir. `ART_DIRECTION.md` görsel üretim dilini,
`UI_GUIDE.md` ise arayüz standardını belirler; iki belge birlikte bağlayıcıdır.

## SVG İkon Stili (GDD → ICON STYLE bölümünden)

- Master çizim SVG olarak yapılır.
- Gradient: **linear**, yön **top-left → bottom-right**, duraklar **%0 / %40 / %100**.
- Outline: base rengin **koyu tonu**, kalınlık **1.5–2px**, köşeler yuvarlak.
- Highlight: **yumuşak beyaz**, **top-left** konumunda.
- Shadow: **%20–25 opaklık**, **soft blur**, **bottom-right** konumunda.
- Sert (hard) gölge yok, siyah outline yok, düz (flat) ikon yok.
- Renk paleti: pastel, sıcak tonlar, doygunluk düşük-orta. Neon yok.

## Producer / Enerji Sistemi (GDD'den SAPMA — kullanıcı kararı)

GDD'de producer'ın 3 dakikalık bir cooldown ile üretim yaptığı tanımlanmıştı.
Kullanıcı kararıyla bu değiştirildi: **üretim artık cooldown yerine ENERJİ ile
sınırlanıyor.**

- Oyuncu 100 enerji ile başlar (max 100).
- Her üretim 1 enerji harcar (bkz. `data.js -> DATA.energy.costPerProduction`).
- Enerji 2 dakikada 1 puan kendiliğinden yenilenir (`regenIntervalMs`).
- Producer'daki `levels[].dropRates` hâlâ geçerli (üretilen topun seviyesi/kalitesi
  için), ama `levels[].cooldownMs` artık üretim tetiklemede KULLANILMIYOR
  (veri olarak dursun, ileride gerekirse geri getirilebilir).
- Enerji tükenince üretim yapılamaz, oyuncu regen'i bekler; UI'da top bar'daki
  enerji pill'i canlı geri sayımı gösterir.

Bu, GDD'nin "Energy: MVP'de gerekli değil" notuyla ve "No time pressure" pillar'ıyla
kısmen çelişiyor — bilerek yapılan bir tasarım tercihi olarak kaydedildi.

## Board / Merge Kuralları

- Grid: 7 sütun × 9 satır = 63 hücre.
- Bir hücrede bir obje olur (item ya da producer).
- Sadece aynı seviyedeki aynı item'lar merge olur.
- Çapraz (diagonal) merge yok.
- Merge sınırsızdır (unlimited merges).

## Genel Kod Kuralları

- Geçici hack yok, üretimde debug kodu bırakılmaz.
- Küçük, yeniden kullanılabilir fonksiyonlar tercih edilir.
- Global state tek bir yerde tutulur (`main.js` içindeki `GameState`), dağınık global
  değişken yaratılmaz.
- Bir özellik gerçekten tarayıcıda test edilip çalıştığı doğrulanmadan "tamamlandı"
  sayılmaz.
