window.ChampionTour = window.ChampionTour || {};

const championTourRenovationBalance = (() => {
  const anchors = [
    [1, 100, 250], [2, 180, 450], [3, 280, 700], [4, 400, 1000],
    [5, 550, 1400], [10, 1750, 4000], [20, 7000, 15000], [29, 14700, 65000]
  ];
  return Object.freeze(Array.from({ length: 29 }, (_, offset) => {
    const step = offset + 1;
    const upperIndex = anchors.findIndex((anchor) => anchor[0] >= step);
    const upper = anchors[Math.max(0, upperIndex)];
    const lower = anchors[Math.max(0, upperIndex - 1)] || upper;
    const ratio = upper[0] === lower[0] ? 0 : (step - lower[0]) / (upper[0] - lower[0]);
    return Object.freeze({
      step,
      totalXp: Math.round(lower[1] + (upper[1] - lower[1]) * ratio),
      coins: Math.round((lower[2] + (upper[2] - lower[2]) * ratio) / 10) * 10
    });
  }));
})();

window.ChampionTour.GameData = Object.freeze({
  uiIcons: Object.freeze({
    level: 'assets/CozyAcademy/Full/UI/level.png',
    energy: 'assets/CozyAcademy/Full/UI/energy.png',
    coins: 'assets/CozyAcademy/Full/UI/coin.png',
    gems: 'assets/CozyAcademy/Full/UI/gem.png',
    storage: 'assets/CozyAcademy/Full/UI/storage_v2.svg',
    sell: 'assets/CozyAcademy/Full/UI/sell.png',
    info: 'assets/CozyAcademy/Full/UI/info.png',
    menu: 'assets/CozyAcademy/Full/UI/menu.png',
    producerEnergy: 'assets/CozyAcademy/Full/UI/energy.png'
  }),

  customers: Object.freeze({
    coach: 'assets/CozyAcademy/Full/Customers/customer_emre.png',
    captain: 'assets/CozyAcademy/Full/Customers/customer_maya.png',
    scout: 'assets/CozyAcademy/Full/Customers/customer_derya.png',
    keeper: 'assets/CozyAcademy/Full/Customers/customer_kaan.png',
    physio: 'assets/CozyAcademy/Full/Customers/customer_selin.png',
    groundskeeper: 'assets/CozyAcademy/Full/Customers/customer_hasan.png'
  }),

  absoluteMaxItemLevel: 12,
  balanceVersion: 4,

  chains: Object.freeze({
    footballs: Object.freeze({
      id: 'footballs',
      maxItemLevel: 7,
      name: 'Futbol Topları',
      producerId: 'ball_basket',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6, 7]),
      assets: Object.freeze([
        null,
        'assets/CozyAcademy/Full/Items/football_lv1.png?v=historic-football-v1',
        'assets/CozyAcademy/Full/Items/football_lv2.png?v=historic-football-v1',
        'assets/CozyAcademy/Full/Items/football_lv3.png?v=historic-football-v1',
        'assets/CozyAcademy/Full/Items/football_lv4.png?v=historic-football-v1',
        'assets/CozyAcademy/Full/Items/football_lv5.png?v=historic-football-v1',
        'assets/CozyAcademy/Full/Items/football_lv6.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv7.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv8.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv9.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv10.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv11.png?v=historic-football-v1',
        'assets/CozyAcademy/Progression/Items/football_lv12.png?v=historic-football-v1'
      ]),
      itemNames: Object.freeze([
        null, 'Antrenman Topu', 'Kaliteli Antrenman Topu', 'Maç Topu',
        'Profesyonel Top', 'İmzalı Top', 'Şampiyonluk Topu',
        'Elit Akademi Topu', 'Hatıra Topu', 'Gümüş Şampiyon Topu',
        'Altın Şampiyon Topu', 'Efsane Top', 'Ustalık Topu'
      ]),
      symbols: Object.freeze([null, '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽'])
    }),
    equipment: Object.freeze({
      id: 'equipment',
      maxItemLevel: 6,
      name: 'Hidrasyon Zinciri',
      producerId: 'equipment_locker',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/CozyAcademy/Full/Items/hydration_lv1.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/hydration_lv2.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/hydration_lv3.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/hydration_lv4.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/hydration_lv5.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/hydration_lv6.png?v=storybook-items-v2',
        'assets/CozyAcademy/Progression/Items/hydration_lv7.png',
        'assets/CozyAcademy/Progression/Items/hydration_lv8.png',
        'assets/CozyAcademy/Progression/Items/hydration_lv9.png',
        'assets/CozyAcademy/Progression/Items/hydration_lv10.png',
        'assets/CozyAcademy/Progression/Items/hydration_lv11.png',
        'assets/CozyAcademy/Progression/Items/hydration_lv12.png'
      ]),
      itemNames: Object.freeze([
        null, 'Su Bardağı', 'Su Şişesi', 'Spor Matarası',
        'Takım Shakerı', 'Termos', 'Profesyonel Hidrasyon Seti',
        'Takım Su Tankı', 'Çiftli Matara Seti', 'Hidrasyon Sırtlığı',
        'Akıllı İçecek Ünitesi', 'Elit Hidrasyon İstasyonu', 'Ustalık Hidrasyon Sistemi'
      ]),
      symbols: Object.freeze(new Array(13).fill('●'))
    }),
    training: Object.freeze({
      id: 'training',
      maxItemLevel: 7,
      name: 'Antrenman Zinciri',
      producerId: 'training_cart',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6, 7]),
      assets: Object.freeze([
        null,
        'assets/CozyAcademy/Pilot/Training/Items/training_lv1.png?v=storybook-items-v2',
        'assets/CozyAcademy/Pilot/Training/Items/training_lv2.png?v=storybook-items-v2',
        'assets/CozyAcademy/Pilot/Training/Items/training_lv3.png?v=storybook-items-v2',
        'assets/CozyAcademy/Pilot/Training/Items/training_lv4.png?v=storybook-items-v2',
        'assets/CozyAcademy/Pilot/Training/Items/training_lv5.png?v=storybook-items-v2',
        'assets/CozyAcademy/Pilot/Training/Items/training_lv6.png?v=storybook-items-v2',
        'assets/CozyAcademy/Progression/Items/training_lv7.png?v=storybook-items-v2',
        'assets/CozyAcademy/Progression/Items/training_lv8.png',
        'assets/CozyAcademy/Progression/Items/training_lv9.png',
        'assets/CozyAcademy/Progression/Items/training_lv10.png',
        'assets/CozyAcademy/Progression/Items/training_lv11.png',
        'assets/CozyAcademy/Progression/Items/training_lv12.png'
      ]),
      itemNames: Object.freeze([
        null, 'Antrenman Diski', 'Küçük Koni', 'Uzun Koni',
        'Koni Yığını', 'Ağırlıklı Koni', 'Antrenman Kiti',
        'Çeviklik Parkuru', 'Geri Dönüş Ağı', 'Koç Ekipman Seti',
        'Modüler Antrenman Alanı', 'Elit Antrenman Sistemi', 'Ustalık Komuta İstasyonu'
      ]),
      symbols: Object.freeze(new Array(13).fill('●'))
    }),
    trophies: Object.freeze({
      id: 'trophies',
      maxItemLevel: 6,
      name: 'Başarı Zinciri',
      producerId: 'trophy_cabinet',
      unlockLevel: 1,
      orderEligibleLevels: Object.freeze([1, 2, 3, 4, 5, 6]),
      assets: Object.freeze([
        null,
        'assets/CozyAcademy/Full/Items/trophy_lv1.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/trophy_lv2.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/trophy_lv3.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/trophy_lv4.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/trophy_lv5.png?v=storybook-items-v2',
        'assets/CozyAcademy/Full/Items/trophy_lv6.png?v=storybook-items-v2',
        'assets/CozyAcademy/Progression/Items/trophy_lv7.png',
        'assets/CozyAcademy/Progression/Items/trophy_lv8.png',
        'assets/CozyAcademy/Progression/Items/trophy_lv9.png',
        'assets/CozyAcademy/Progression/Items/trophy_lv10.png',
        'assets/CozyAcademy/Progression/Items/trophy_lv11.png',
        'assets/CozyAcademy/Progression/Items/trophy_lv12.png'
      ]),
      itemNames: Object.freeze([
        null, 'Madalya', 'Bronz Kupa', 'Gümüş Kupa',
        'Altın Kupa', 'Şampiyonluk Kupası', 'Efsane Kupası',
        'Onur Madalyası', 'Akademi Plaketi', 'Gümüş Defne Kupası',
        'Altın Şampiyon Kupası', 'Kanatlı Efsane Kupası', 'Ustalık Anıtı'
      ]),
      symbols: Object.freeze(new Array(13).fill('●'))
    })
  }),

  producers: Object.freeze({
    ball_basket: Object.freeze({
      id: 'ball_basket',
      name: 'Futbol Topu Arabası',
      chainId: 'footballs',
      unlockLevel: 1,
      description: 'Futbol topu zincirinden nesneler üretir.',
      artwork: 'assets/CozyAcademy/Full/ProducersV3/producer-football.png',
      artworks: Object.freeze([
        null,
        'assets/CozyAcademy/Full/ProducersV3/producer-football.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-football.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-football.png'
      ])
    }),
    equipment_locker: Object.freeze({
      id: 'equipment_locker',
      name: 'Su ve İçecek İstasyonu',
      chainId: 'equipment',
      unlockLevel: 1,
      description: 'İçecek ve hidrasyon zincirinden nesneler üretir.',
      artwork: 'assets/CozyAcademy/Full/ProducersV3/producer-hydration.png',
      artworks: Object.freeze([
        null,
        'assets/CozyAcademy/Full/ProducersV3/producer-hydration.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-hydration.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-hydration.png'
      ])
    }),
    training_cart: Object.freeze({
      id: 'training_cart',
      name: 'Koni Arabası',
      chainId: 'training',
      unlockLevel: 1,
      description: 'Koni ve saha işaretleme ekipmanları üretir.',
      artwork: 'assets/CozyAcademy/Full/ProducersV3/producer-training.png',
      artworks: Object.freeze([
        null,
        'assets/CozyAcademy/Full/ProducersV3/producer-training.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-training.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-training.png'
      ])
    }),
    trophy_cabinet: Object.freeze({
      id: 'trophy_cabinet',
      name: 'Kupa Atölyesi',
      chainId: 'trophies',
      unlockLevel: 1,
      description: 'Madalya ve kupa zincirinden nesneler üretir.',
      artwork: 'assets/CozyAcademy/Full/ProducersV3/producer-trophy.png',
      artworks: Object.freeze([
        null,
        'assets/CozyAcademy/Full/ProducersV3/producer-trophy.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-trophy.png',
        'assets/CozyAcademy/Full/ProducersV3/producer-trophy.png'
      ])
    })
  }),

  producerProgression: Object.freeze({
    levels: Object.freeze({
      1: Object.freeze({
        normalOrderMaxLevel: 6,
        drops: Object.freeze({ 0: .85, 1: .15 })
      }),
      2: Object.freeze({
        normalOrderMaxLevel: 8,
        drops: Object.freeze({ 0: .80, 1: .20 })
      }),
      3: Object.freeze({
        normalOrderMaxLevel: 10,
        drops: Object.freeze({ 0: .75, 1: .25 })
      })
    }),
    reputationMilestones: Object.freeze([
      Object.freeze({ reputation: 100, producerId: 'ball_basket', level: 2 }),
      Object.freeze({ reputation: 220, producerId: 'training_cart', level: 2 }),
      Object.freeze({ reputation: 360, producerId: 'equipment_locker', level: 2 }),
      Object.freeze({ reputation: 520, producerId: 'trophy_cabinet', level: 2 }),
      Object.freeze({ reputation: 720, producerId: 'ball_basket', level: 3 }),
      Object.freeze({ reputation: 950, producerId: 'training_cart', level: 3 }),
      Object.freeze({ reputation: 1220, producerId: 'equipment_locker', level: 3 }),
      Object.freeze({ reputation: 1520, producerId: 'trophy_cabinet', level: 3 })
    ]),
    masteryMilestones: Object.freeze({
      footballs: 1850,
      training: 2600
    }),
    retirement: Object.freeze({
      ball_basket: Object.freeze({
        reputation: 2200,
        replacementId: 'jersey_station',
        replacementName: 'Forma Üreticisi',
        replacementArtwork: 'assets/CozyAcademy/Progression/Producers/producer_jersey_lv1.png'
      })
    })
  }),

  testing: Object.freeze({
    enabled: true,
    bypassEnergy: false,
    infiniteEnergyInTest: true
  }),

  storage: Object.freeze({
    initialCapacity: 8,
    slotUnlockCost: 10
  }),

  economy: Object.freeze({
    defaultItemSellPrice: 2
  }),

  academyEconomy: Object.freeze({
    version: 2,
    renovations: championTourRenovationBalance
  }),

  productionModes: Object.freeze({
    energyOptions: Object.freeze([1, 2, 4, 8, 16]),
    defaultEnergy: 1,
    rareLevel3Chance: .02,
    rareLevel4Chance: .005,
    dropTables: Object.freeze({
      1: Object.freeze([{ level: 1, weight: .9 }, { level: 2, weight: .09 }, { level: 3, weight: .009 }, { level: 5, weight: .001 }]),
      2: Object.freeze([{ level: 2, weight: .84 }, { level: 3, weight: .14 }, { level: 4, weight: .018 }, { level: 6, weight: .002 }]),
      4: Object.freeze([{ level: 3, weight: .84 }, { level: 4, weight: .14 }, { level: 5, weight: .018 }, { level: 7, weight: .002 }]),
      8: Object.freeze([{ level: 4, weight: .84 }, { level: 5, weight: .14 }, { level: 6, weight: .018 }, { level: 8, weight: .002 }]),
      16: Object.freeze([{ level: 5, weight: .84 }, { level: 6, weight: .14 }, { level: 7, weight: .018 }, { level: 9, weight: .002 }])
    })
  }),

  bubbles: Object.freeze({
    durationMs: 30000,
    byLevel: Object.freeze({
      3: Object.freeze({ chance: .12, cost: 1 }),
      4: Object.freeze({ chance: .10, cost: 2 }),
      5: Object.freeze({ chance: .08, cost: 4 }),
      6: Object.freeze({ chance: .06, cost: 7 }),
      7: Object.freeze({ chance: .045, cost: 11 }),
      8: Object.freeze({ chance: .035, cost: 17 }),
      9: Object.freeze({ chance: .025, cost: 26 }),
      10: Object.freeze({ chance: .015, cost: 40 }),
      11: Object.freeze({ chance: .01, cost: 60 }),
      12: Object.freeze({ chance: .005, cost: 90 })
    })
  }),

  coinChain: Object.freeze({
    maxLevel: 4,
    level4Reward: 100,
    assets: Object.freeze([
      null,
      'assets/CozyAcademy/Full/UI/coin.png',
      'assets/CozyAcademy/Full/UI/coin.png',
      'assets/CozyAcademy/Full/UI/coin.png',
      'assets/CozyAcademy/Full/UI/coin.png'
    ])
  }),

  specialOrders: Object.freeze({
    maxItemRequiredCount: 3,
    diamondReward: 1,
    rewards: Object.freeze({
      coins: 900,
      gems: 1,
      reputation: 100,
      mastery: 1
    })
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
    Object.freeze({ id: 'football_1', level: 1, nameKey: 'item.football.lv1', descriptionKey: 'item.football.lv1.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv1.png', sprite: 'assets/ModernPixelArt/Items/football_lv1.png', nextLevel: 2 }),
    Object.freeze({ id: 'football_2', level: 2, nameKey: 'item.football.lv2', descriptionKey: 'item.football.lv2.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv2.png', sprite: 'assets/ModernPixelArt/Items/football_lv2.png', nextLevel: 3 }),
    Object.freeze({ id: 'football_3', level: 3, nameKey: 'item.football.lv3', descriptionKey: 'item.football.lv3.description', rarityKey: 'rarity.uncommon', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv3.png', sprite: 'assets/ModernPixelArt/Items/football_lv3.png', nextLevel: 4 }),
    Object.freeze({ id: 'football_4', level: 4, nameKey: 'item.football.lv4', descriptionKey: 'item.football.lv4.description', rarityKey: 'rarity.rare', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv4.png', sprite: 'assets/ModernPixelArt/Items/football_lv4.png', nextLevel: 5 }),
    Object.freeze({ id: 'football_5', level: 5, nameKey: 'item.football.lv5', descriptionKey: 'item.football.lv5.description', rarityKey: 'rarity.epic', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv5.png', sprite: 'assets/ModernPixelArt/Items/football_lv5.png', nextLevel: 6 }),
    Object.freeze({ id: 'football_6', level: 6, nameKey: 'item.football.lv6', descriptionKey: 'item.football.lv6.description', rarityKey: 'rarity.legendary', producerId: 'football_academy', icon: 'assets/ModernPixelArt/Items/football_lv6.png', sprite: 'assets/ModernPixelArt/Items/football_lv6.png', nextLevel: null })
  ]),

  orders: Object.freeze({
    slotCount: 6,
    difficultyPattern: Object.freeze(['easy', 'easy', 'medium', 'medium', 'hard', 'variable']),
    reputationRewards: Object.freeze({
      easy: Object.freeze([10, 14]),
      medium: Object.freeze([20, 28]),
      hard: Object.freeze([40, 55]),
      variable: Object.freeze([14, 42])
    }),
    levelWeights: Object.freeze([0, .42, .28, .17, .09, .035, .005, .003, .002, .001, .0005, 0, 0]),
    rewards: Object.freeze({
      1: Object.freeze({ coins: 12, xp: 4, gems: 0, eventPoints: 1 }),
      2: Object.freeze({ coins: 22, xp: 7, gems: 0, eventPoints: 2 }),
      3: Object.freeze({ coins: 40, xp: 12, gems: 0, eventPoints: 3 }),
      4: Object.freeze({ coins: 70, xp: 20, gems: 0, eventPoints: 5 }),
      5: Object.freeze({ coins: 115, xp: 32, gems: 0, eventPoints: 8 }),
      6: Object.freeze({ coins: 180, xp: 50, gems: 0, eventPoints: 12 }),
      7: Object.freeze({ coins: 280, xp: 72, gems: 0, eventPoints: 15 }),
      8: Object.freeze({ coins: 420, xp: 96, gems: 0, eventPoints: 18 }),
      9: Object.freeze({ coins: 620, xp: 126, gems: 0, eventPoints: 22 }),
      10: Object.freeze({ coins: 900, xp: 164, gems: 0, eventPoints: 28 }),
      11: Object.freeze({ coins: 1300, xp: 210, gems: 0, eventPoints: 35 }),
      12: Object.freeze({ coins: 1800, xp: 270, gems: 0, eventPoints: 45 })
    })
  })
});
