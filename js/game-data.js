window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.GameData = Object.freeze({
  maxItemLevel: 6,

  testing: Object.freeze({
    enabled: true,
    bypassEnergy: true,
    bypassProducerCooldown: true,
    producerXpIncrement: 25
  }),

  producer: Object.freeze({
    id: 'football_academy',
    nameKey: 'producer.football_academy.name',
    maxCharges: 8,
    cooldownMs: 30000,
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
    Object.freeze({ id: 'football_1', level: 1, nameKey: 'item.football.lv1', descriptionKey: 'item.football.lv1.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/icons/football_lv1.png', sprite: 'assets/Football/Ball/ball_lv1.png', nextLevel: 2 }),
    Object.freeze({ id: 'football_2', level: 2, nameKey: 'item.football.lv2', descriptionKey: 'item.football.lv2.description', rarityKey: 'rarity.common', producerId: 'football_academy', icon: 'assets/icons/football_lv2.png', sprite: 'assets/Football/Ball/ball_lv2.png', nextLevel: 3 }),
    Object.freeze({ id: 'football_3', level: 3, nameKey: 'item.football.lv3', descriptionKey: 'item.football.lv3.description', rarityKey: 'rarity.uncommon', producerId: 'football_academy', icon: 'assets/icons/football_lv3.png', sprite: 'assets/Football/Ball/ball_lv3.png', nextLevel: 4 }),
    Object.freeze({ id: 'football_4', level: 4, nameKey: 'item.football.lv4', descriptionKey: 'item.football.lv4.description', rarityKey: 'rarity.rare', producerId: 'football_academy', icon: 'assets/icons/football_lv4.png', sprite: 'assets/Football/Ball/ball_lv4.png', nextLevel: 5 }),
    Object.freeze({ id: 'football_5', level: 5, nameKey: 'item.football.lv5', descriptionKey: 'item.football.lv5.description', rarityKey: 'rarity.epic', producerId: 'football_academy', icon: 'assets/icons/football_lv5.png', sprite: 'assets/Football/Ball/ball_lv5.png', nextLevel: 6 }),
    Object.freeze({ id: 'football_6', level: 6, nameKey: 'item.football.lv6', descriptionKey: 'item.football.lv6.description', rarityKey: 'rarity.legendary', producerId: 'football_academy', icon: 'assets/icons/football_lv6.png', sprite: 'assets/Football/Ball/ball_lv6.png', nextLevel: null })
  ]),

  orders: Object.freeze({
    slotCount: 3,
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
