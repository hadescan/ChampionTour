# Champion Tour UI Guide v1.0

Bu doküman Champion Tour web sürümünün resmi kullanıcı arayüzü standardıdır.

Bu kurallar tüm yeni ekranlarda, tüm yeni özelliklerde ve tüm yeni kodlarda
korunmalıdır. Hiçbir yeni özellik bu tasarım dilini bozmayacaktır.

## Genel Tasarım

Champion Tour sıcak, sevimli, premium, sade, modern ve rahat okunabilir bir
casual merge oyunudur.

Tüm ekranlar Merge Mansion, Travel Town ve Tasty Travels kalitesinde
görünmelidir.

## Genel Yerleşim

- Boş alan bırakmaktan korkma.
- Hiçbir öğe birbirine yapışık görünmemeli.
- Arayüz ferah hissettirmeli.

## Renk Paleti

- Sıcak krem
- Açık bej
- Pastel yeşil
- Pastel mavi
- Turuncu vurgu
- Altın ödüller
- Kırmızı yalnızca uyarılar için kullanılmalı.

## Köşe Yuvarlaklığı

Tüm kartlar, paneller, butonlar ve slotlar yumuşak yuvarlatılmış köşeler
kullanmalıdır. Keskin köşeler kullanılmayacaktır.

## Gölge

Sert gölge kullanılmayacaktır. Tüm gölgeler yumuşak, geniş blur değerli ve
düşük opacity olacaktır.

## Board

- Board 7 sütun × 9 satır olacaktır.
- Board arka planı CSS ile oluşturulacaktır.
- Board arka planında PNG kullanılmayacaktır.
- Arka plan sıcak krem, hafif radyal degrade, çok hafif noise ve premium
  görünüm kullanacaktır.

## Slot

- Slotlar eşit boyutta olacaktır.
- Yuvarlatılmış köşeler kullanılacaktır.
- Çok hafif iç ve dış gölge kullanılacaktır.
- Slotlar buton gibi görünmemelidir.
- Slotlar boş alan hissi vermelidir.

## Merge Item

- Merge item boyutu değiştirilmeyecektir.
- Her item aynı fiziksel alanı kaplayacaktır.
- Item'lar daima tam ortalanacaktır.
- Her item altında ortak oval gölge kullanılacaktır.

## Producer

- Producer merge item'lardan daha büyük olacaktır.
- Tıklanabilir olduğu ilk bakışta anlaşılmalıdır.
- Tıklanınca hafif küçülme, hafif büyüme ve küçük pop animasyonu
  uygulanacaktır.

## Animasyon

- Animasyonlar hızlı, yumuşak ve akıcı olacaktır.
- Aşırı uzun animasyon kullanılmayacaktır.
- Merge sırasında parlama, küçük büyüme ve hafif bounce uygulanacaktır.

## Butonlar

- Tüm butonlar premium, parlak, yumuşak ve hafif gölgeli olacaktır.
- Hover efekti bulunacaktır.
- Basılınca hafif küçülecektir.

## Yazılar

- Modern sans-serif font kullanılacaktır.
- Kalınlık okunabilir olmalıdır.
- Yazılar gerektiğinde gölge ile desteklenebilir.

## Kod Standardı

- CSS okunabilir yazılacaktır.
- Tekrarlayan kodlardan kaçınılacaktır.
- Bileşenler yeniden kullanılabilir olacaktır.
- Magic number kullanılmayacaktır.
- Kod mümkün olduğunca modüler olacaktır.

## Responsive

- Öncelik mobil görünümdür.
- Tablet desteklenecektir.
- Masaüstü ikinci plandadır.

## Performans

- CSS öncelikli çözümler tercih edilecektir.
- Gereksiz PNG kullanılmayacaktır.
- Animasyonlar GPU dostu olacaktır.

## En Önemli Kural

Yeni eklenecek hiçbir özellik mevcut Champion Tour tasarım dilini
bozmayacaktır. Yeni eklenen her özellik aynı oyunun doğal bir parçası gibi
görünmelidir.

Kod yazarken yalnızca çalışan kod üretmek yeterli değildir. Kod aynı zamanda
Champion Tour'un görsel kimliğini ve kullanıcı deneyimini korumalıdır.

Yeni bir özellik eklemeden önce mevcut tasarım dili analiz edilmelidir. Yeni
bileşen mevcut arayüzle uyumsuz görünüyorsa önce mevcut stile uyacak şekilde
tasarlanmalı, ardından kodlanmalıdır.
