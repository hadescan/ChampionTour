window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.GameData = Object.freeze({
  uiIcons: Object.freeze({
    level: 'assets/icons/ct-level.svg',
    energy: 'assets/icons/ct-energy.svg',
    coins: 'assets/icons/ct-coin.svg',
    gems: 'assets/icons/ct-gem.svg',
    storage: 'assets/icons/ct-storage.svg',
    sell: 'assets/icons/ct-sell.svg',
    producerEnergy: 'assets/icons/ct-producer-energy.svg'
  }),

  maxItemLevel: 6,

  chains: Object.freeze({
    footballs: Object.freeze({
      id: 'footballs',
      name: 'Top Zinciri',
      producerId: 'ball_basket',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/Football/Reference/football_lv1.png',
        'assets/Football/Reference/football_lv2.png',
        'assets/Football/Reference/football_lv3.png',
        'assets/Football/Reference/football_lv4.png',
        'assets/Football/Reference/football_lv5.png',
        'assets/Football/Reference/football_lv6.png'
      ]),
      itemNames: Object.freeze([
        null, 'Antrenman Topu', 'Kaliteli Antrenman Topu', 'Maç Topu',
        'Profesyonel Top', 'İmzalı Top', 'Şampiyonluk Topu'
      ]),
      symbols: Object.freeze([null, '⚽', '⚽', '⚽', '⚽', '⚽', '⚽'])
    }),
    equipment: Object.freeze({
      id: 'equipment',
      name: 'Hidrasyon Zinciri',
      producerId: 'equipment_locker',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/Football/Reference/hydration_lv1.png',
        'assets/Football/Reference/hydration_lv2.png',
        'assets/Football/Reference/hydration_lv3.png',
        'assets/Football/Reference/hydration_lv4.png',
        'assets/Football/Reference/hydration_lv5.png',
        'assets/Football/Reference/hydration_lv6.png'
      ]),
      itemNames: Object.freeze([
        null, 'Su Bardağı', 'Su Şişesi', 'Spor Matarası',
        'Takım Shakerı', 'Termos', 'Profesyonel Hidrasyon Seti'
      ]),
      symbols: Object.freeze([null, '👕', '👟', '🛡', '🧤', '🎽', '⭐'])
    }),
    training: Object.freeze({
      id: 'training',
      name: 'Antrenman Zinciri',
      producerId: 'training_cart',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/Football/Reference/training_lv1.png',
        'assets/Football/Reference/training_lv2.png',
        'assets/Football/Reference/training_lv3.png',
        'assets/Football/Reference/training_lv4.png',
        'assets/Football/Reference/training_lv5.png',
        'assets/Football/Reference/training_lv6.png'
      ]),
      itemNames: Object.freeze([
        null, 'Antrenman Konisi', 'Koni Seti', 'Antrenman Engeli',
        'Koordinasyon Merdiveni', 'Mini Kale', 'Profesyonel Antrenman İstasyonu'
      ]),
      symbols: Object.freeze([null, '🔶', '🚧', '🥅', '🥅', '🎯', '🏟'])
    }),
    trophies: Object.freeze({
      id: 'trophies',
      name: 'Başarı Zinciri',
      producerId: 'trophy_cabinet',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/Football/Reference/trophy_lv1.png',
        'assets/Football/Reference/trophy_lv2.png',
        'assets/Football/Reference/trophy_lv3.png',
        'assets/Football/Reference/trophy_lv4.png',
        'assets/Football/Reference/trophy_lv5.png',
        'assets/Football/Reference/trophy_lv6.png'
      ]),
      itemNames: Object.freeze([
        null, 'Madalya', 'Bronz Kupa', 'Gümüş Kupa',
        'Altın Kupa', 'Şampiyonluk Kupası', 'Efsane Kupası'
      ]),
      symbols: Object.freeze([null, '🏅', '🏆', '🏆', '🏆', '🏆', '👑'])
    })
  }),

  producers: Object.freeze({
    ball_basket: Object.freeze({
      id: 'ball_basket',
      name: 'Futbol Ekipmanı Sandığı',
      chainId: 'footballs',
      unlockLevel: 1,
      description: 'Futbol topu zincirinden nesneler üretir.',
      artwork: 'assets/Football/Producer/producer_ball_basket_v2.png'
    }),
    equipment_locker: Object.freeze({
      id: 'equipment_locker',
      name: 'Su ve İçecek İstasyonu',
      chainId: 'equipment',
      unlockLevel: 1,
      description: 'İçecek ve hidrasyon zincirinden nesneler üretir.',
      artwork: 'assets/Football/Producer/producer_hydration_v2.png'
    }),
    training_cart: Object.freeze({
      id: 'training_cart',
      name: 'Antrenman Ekipmanı Kulübesi',
      chainId: 'training',
      unlockLevel: 1,
      description: 'Saha ve antrenman ekipmanı zincirinden nesneler üretir.',
      artwork: 'assets/Football/Producer/producer_training_v2.png'
    }),
    trophy_cabinet: Object.freeze({
      id: 'trophy_cabinet',
      name: 'Kupa Atölyesi',
      chainId: 'trophies',
      unlockLevel: 1,
      description: 'Madalya ve kupa zincirinden nesneler üretir.',
      artwork: 'assets/Football/Producer/producer_trophy_v2.png'
    })
  }),

  testing: Object.freeze({
    enabled: true,
    bypassEnergy: false,
    bypassProducerCooldown: false,
    producerXpIncrement: 25
  }),

  storage: Object.freeze({
    initialCapacity: 8,
    slotUnlockCost: 10
  }),

  economy: Object.freeze({
    defaultItemSellPrice: 2
  }),

  producer: Object.freeze({
    id: 'football_academy',
    nameKey: 'producer.football_academy.name',
    energyCost: 1,
    maxLevel: 6,
    levels: Object.freeze([
      null,
      Object.freeze({ level: 1, xpToNext: 100, diamondReward: 0, artwork: 'assets/Football/Producer/producer_lv1.png' }),
      Object.freeze({ level: 2, xpToNext: 250, diamondReward: 1, artwork: 'assets/Football/Producer/producer_lv2.png' }),
      Object.freeze({ level: 3, xpToNext: 450, diamondReward: 1, artwork: 'assets/Football/Producer/producer_lv3.png' }),
      Object.freeze({ level: 4, xpToNext: 700, diamondReward: 2, artwork: 'assets/Football/Producer/producer_lv4.png' }),
      Object.freeze({ level: 5, xpToNext: 1000, diamondReward: 2, artwork: 'assets/Football/Producer/producer_lv5.png' }),
      Object.freeze({ level: 6, xpToNext: null, diamondReward: 3, artwork: 'assets/Football/Producer/producer_lv6.png' })
    ]),
    dropRates: Object.freeze([
      Object.freeze({ level: 1, weight: 1 })
    ])
  }),

  items: Object.freeze([
    null,
    Object.freeze({ id: 'football_1', level: 1, nameKey: 'item.football.lv1', descriptionKey: 'item.football.lv1.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv1.png', sprite: 'assets/Football/Reference/football_lv1.png', nextLevel: 2 }),
    Object.freeze({ id: 'football_2', level: 2, nameKey: 'item.football.lv2', descriptionKey: 'item.football.lv2.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv2.png', sprite: 'assets/Football/Reference/football_lv2.png', nextLevel: 3 }),
    Object.freeze({ id: 'football_3', level: 3, nameKey: 'item.football.lv3', descriptionKey: 'item.football.lv3.description', rarityKey: 'rarity.uncommon', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv3.png', sprite: 'assets/Football/Reference/football_lv3.png', nextLevel: 4 }),
    Object.freeze({ id: 'football_4', level: 4, nameKey: 'item.football.lv4', descriptionKey: 'item.football.lv4.description', rarityKey: 'rarity.rare', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv4.png', sprite: 'assets/Football/Reference/football_lv4.png', nextLevel: 5 }),
    Object.freeze({ id: 'football_5', level: 5, nameKey: 'item.football.lv5', descriptionKey: 'item.football.lv5.description', rarityKey: 'rarity.epic', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv5.png', sprite: 'assets/Football/Reference/football_lv5.png', nextLevel: 6 }),
    Object.freeze({ id: 'football_6', level: 6, nameKey: 'item.football.lv6', descriptionKey: 'item.football.lv6.description', rarityKey: 'rarity.legendary', producerId: 'football_academy', icon: 'assets/Football/Reference/football_lv6.png', sprite: 'assets/Football/Reference/football_lv6.png', nextLevel: null })
  ]),

  orders: Object.freeze({
    slotCount: 6,
    levelWeights: Object.freeze([0, .42, .28, .17, .09, .035, .005]),
    rewards: Object.freeze({
      1: Object.freeze({ coins: 12, xp: 4, gems: 0, eventPoints: 1 }),
      2: Object.freeze({ coins: 22, xp: 7, gems: 0, eventPoints: 2 }),
      3: Object.freeze({ coins: 40, xp: 12, gems: 0, eventPoints: 3 }),
      4: Object.freeze({ coins: 70, xp: 20, gems: 0, eventPoints: 5 }),
      5: Object.freeze({ coins: 115, xp: 32, gems: 0, eventPoints: 8 }),
      6: Object.freeze({ coins: 180, xp: 50, gems: 0, eventPoints: 12 })
    })
  })
});
