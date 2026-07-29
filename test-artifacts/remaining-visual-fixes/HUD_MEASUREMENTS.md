# HUD ölçüm tablosu

Ölçüm yöntemi: referans görsel 824 px genişlikten 390 px oyun genişliğine
normalize edildi; yeni sürüm değerleri gerçek tarayıcı DOM ölçümüdür.

| Öğeler | Referans (390 px normalize) | Yeni HUD (390×844) |
|---|---:|---:|
| HUD toplam yüksekliği | yaklaşık 55–58 px | 56 px |
| Seviye kitap/arma rozeti | yaklaşık 46×54 px | 48×55 px |
| Kaynak kapsülü yüksekliği | yaklaşık 40–43 px | 42 px |
| Kapsüller arası boşluk | yaklaşık 4 px | 4 px |
| XP kapsülü | yaklaşık 160 px | 163 px (430 px görünümünde) |
| Enerji kapsülü | yaklaşık 70 px | 72 px (430 px görünümünde) |
| Altın kapsülü | yaklaşık 83 px | 84 px (430 px görünümünde) |
| Elmas kapsülü | yaklaşık 80 px | 81 px (430 px görünümünde) |

Canlı sınır kontrolü:

- 390×844: `body 390×844`, yatay taşma yok.
- 360×800: üçüncü sipariş sağ kenarı `348.95 px`, görünür alan sınırı
  `349 px`; dördüncü sipariş `352.95 px` konumunda ve tamamen maskeli.
- 430×932: HUD kapsülleri `x=9..421` aralığında, viewport içinde.

