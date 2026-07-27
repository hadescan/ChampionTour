window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.SportsContent = (function () {
  'use strict';

  const footballRenovations = [
    ['clubhouse-foundation', 'Kulüp binası temeli', 'Hasarlı temel güçlendirildi ve bina güvenli hale getirildi.', '🏗', 'clubhouse', 'Kulüp Binası'],
    ['clubhouse-walls', 'Kulüp binası duvarları', 'Yıpranmış duvarlar onarıldı ve sıcak tonlarla yenilendi.', '🧱', 'clubhouse', 'Kulüp Binası'],
    ['clubhouse-roof', 'Kulüp binası çatısı', 'Eksik çatı tamamlandı; bina artık hava koşullarına hazır.', '🏠', 'clubhouse', 'Kulüp Binası'],
    ['clubhouse-windows', 'Kulüp binası camları', 'Kırık pencerelerin yerini aydınlık cephe camları aldı.', '▦', 'clubhouse', 'Kulüp Binası'],
    ['academy-sign', 'Akademi tabelası', 'Champion Tour tabelası merkez binaya yerleştirildi.', '⚜', 'clubhouse', 'Kulüp Binası'],
    ['clubhouse-flag', 'Akademi bayrağı', 'Kulüp binasında akademinin bayrağı dalgalanmaya başladı.', '🚩', 'clubhouse', 'Kulüp Binası'],
    ['clubhouse-landscape', 'Kulüp binası peyzajı', 'Giriş çevresi çiçekler ve oturma alanlarıyla canlandı.', '🌼', 'landscape', 'Kulüp Binası'],

    ['stands-concrete', 'Tribün betonları', 'Eski tribün taşıyıcıları güçlendirilip temizlendi.', '🏟', 'stands', 'Ana Tribün'],
    ['stands-seats', 'Tribün koltukları', 'Aileler ve taraftarlar için yeni koltuklar eklendi.', '💺', 'stands', 'Ana Tribün'],
    ['stands-roof', 'Tribün çatısı', 'Seyircileri koruyan modern çatı tamamlandı.', '⛱', 'stands', 'Ana Tribün'],
    ['stands-boards', 'Reklam panoları', 'Saha kenarına Champion Tour panoları yerleştirildi.', '▤', 'stands', 'Ana Tribün'],
    ['stands-vip', 'VIP alanı', 'Konuklar için sıcak ve premium bir izleme alanı açıldı.', '★', 'stands', 'Ana Tribün'],

    ['pitch-drainage', 'Saha drenajı', 'Bozuk zeminin altına yeni drenaj hatları döşendi.', '💧', 'pitch', 'Ana Saha'],
    ['pitch-base', 'Saha zemini', 'Ana sahanın zemini dengelendi ve güvenli hale getirildi.', '▦', 'pitch', 'Ana Saha'],
    ['pitch-grass', 'Profesyonel çimler', 'Sararmış çimlerin yerini canlı spor çimi aldı.', '🌱', 'pitch', 'Ana Saha'],
    ['goals', 'Kale direkleri', 'Paslanmış kaleler profesyonel kalelerle değiştirildi.', '🥅', 'pitch', 'Ana Saha'],
    ['pitch-lines', 'Saha çizgileri', 'Maç standartlarındaki saha çizgileri tamamlandı.', '⚽', 'pitch', 'Ana Saha'],
    ['pitch-irrigation', 'Sulama sistemi', 'Çimleri koruyan otomatik sulama sistemi devreye girdi.', '💦', 'pitch', 'Ana Saha'],

    ['fitness-shell', 'Fitness salonu yapısı', 'Yarım kalmış performans merkezinin yapısı tamamlandı.', '🏋', 'fitness', 'Performans Merkezi'],
    ['fitness-equipment', 'Fitness ekipmanları', 'Sporcular için profesyonel ekipmanlar kuruldu.', '💪', 'fitness', 'Performans Merkezi'],
    ['locker-room', 'Soyunma odası', 'Takımlar için düzenli ve modern bir soyunma alanı açıldı.', '👕', 'fitness', 'Performans Merkezi'],
    ['medical-room', 'Sağlık merkezi', 'Sporcu sağlığı için profesyonel müdahale odası hazırlandı.', '✚', 'fitness', 'Performans Merkezi'],

    ['main-path', 'Ana yürüyüş yolu', 'Kırık taşlar güvenli kampüs yollarıyla değiştirildi.', '➜', 'paths', 'Kampüs Altyapısı'],
    ['campus-gate', 'Kampüs giriş kapısı', 'Güvenli ve davetkâr ana giriş tamamlandı.', '🛡', 'paths', 'Kampüs Altyapısı'],
    ['training-pitch', 'Antrenman sahası', 'Genç takımlar için ikinci saha kullanıma açıldı.', '⚽', 'pitch', 'Kampüs Altyapısı'],
    ['floodlight-bases', 'Işık direkleri', 'Akşam antrenmanları için yeni direkler kuruldu.', '🔆', 'lighting', 'Kampüs Altyapısı'],
    ['floodlights', 'Saha aydınlatması', 'Profesyonel projektörler ilk kez yakıldı.', '✨', 'lighting', 'Kampüs Altyapısı'],
    ['champions-square', 'Şampiyonlar meydanı', 'Başarıları kutlayan altın detaylı meydan açıldı.', '🏆', 'landscape', 'Kampüs Altyapısı'],
    ['football-finale', 'Football Academy tamamlandı', 'Tüm tesisler yaşayan, modern ve profesyonel bir akademiye dönüştü.', '⭐', 'lighting', 'Tamamlanma']
  ].map((entry, index) => Object.freeze({
    id: entry[0],
    level: index + 2,
    title: entry[1],
    description: entry[2],
    icon: entry[3],
    zone: entry[4],
    facility: entry[5]
  }));

  const footballChains = Object.freeze([
    Object.freeze({
      id: 'footballs',
      name: 'Top Zinciri',
      producerTheme: 'Top Sepeti',
      items: Object.freeze([
        'Sönük Futbol Topu',
        'Antrenman Topu',
        'Maç Topu',
        'Profesyonel Maç Topu',
        'Şampiyonluk Topu',
        'Elit Turnuva Topu'
      ])
    }),
    Object.freeze({
      id: 'football-boots',
      name: 'Krampon Zinciri',
      producerTheme: 'Ekipman Dolabı',
      items: Object.freeze([
        'Eski Krampon',
        'Temel Krampon',
        'Antrenman Kramponu',
        'Profesyonel Krampon',
        'Elit Krampon',
        'Altın Maç Kramponu'
      ])
    }),
    Object.freeze({
      id: 'referee-equipment',
      name: 'Hakem Ekipmanı Zinciri',
      producerTheme: 'Teknik Ekip Bölmesi',
      items: Object.freeze([
        'Düdük',
        'Sarı Kart',
        'Kırmızı Kart',
        'Hakem Not Defteri',
        'Hakem Seti',
        'Profesyonel Hakem Seti'
      ])
    }),
    Object.freeze({
      id: 'training-equipment',
      name: 'Antrenman Ekipmanı Zinciri',
      producerTheme: 'Antrenman Arabası',
      items: Object.freeze([
        'Koni',
        'İşaret Diski',
        'Çeviklik Merdiveni',
        'Antrenman Direği',
        'Mini Kale',
        'Profesyonel Antrenman Seti'
      ])
    })
  ]);

  const academies = Object.freeze([
    Object.freeze({
      id: 'football',
      name: 'Football Academy',
      shortName: 'Futbol',
      icon: '⚽',
      theme: 'football',
      description: 'Şampiyonların yetişeceği futbol tesisini yeniden kur.',
      producer: Object.freeze({
        id: 'football-equipment-station',
        name: 'Football Equipment Station',
        rule: 'single-evolving-producer',
        chainIds: Object.freeze(footballChains.map((chain) => chain.id))
      }),
      chains: footballChains,
      renovations: Object.freeze(footballRenovations)
    }),
    Object.freeze({
      id: 'basketball',
      name: 'Basketball Academy',
      shortName: 'Basketbol',
      icon: '🏀',
      theme: 'basketball',
      description: 'Yeni nesil basketbolcular için kampüs sahası.',
      producer: null,
      chains: Object.freeze([]),
      renovations: Object.freeze([])
    }),
    Object.freeze({
      id: 'baseball',
      name: 'Baseball Academy',
      shortName: 'Beyzbol',
      icon: '⚾',
      theme: 'baseball',
      description: 'Vuruş ve saha eğitiminin yeni merkezi.',
      producer: null,
      chains: Object.freeze([]),
      renovations: Object.freeze([])
    }),
    Object.freeze({
      id: 'shooting',
      name: 'Shooting Academy',
      shortName: 'Atıcılık',
      icon: '🎯',
      theme: 'shooting',
      description: 'Odaklanma ve hassasiyet antrenman tesisi.',
      producer: null,
      chains: Object.freeze([]),
      renovations: Object.freeze([])
    }),
    Object.freeze({
      id: 'swimming',
      name: 'Swimming Academy',
      shortName: 'Yüzme',
      icon: '🏊',
      theme: 'swimming',
      description: 'Geleceğin yüzücüleri için performans havuzu.',
      producer: null,
      chains: Object.freeze([]),
      renovations: Object.freeze([])
    }),
    Object.freeze({
      id: 'horse',
      name: 'Horse Academy',
      shortName: 'Binicilik',
      icon: '🐎',
      theme: 'horse',
      description: 'Modern ahırlar ve profesyonel eğitim parkuru.',
      producer: null,
      chains: Object.freeze([]),
      renovations: Object.freeze([])
    })
  ]);

  function getAcademy(id) {
    return academies.find((academy) => academy.id === id) || null;
  }

  return Object.freeze({
    academies,
    getAcademy
  });
})();
