/**
 * data.js
 * Sabit oyun verisi: sporlar, item zincirleri, producer tanımları.
 * Bu dosya SADECE veri içerir, mantık içermez.
 */

window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.DATA = {
  // --- SPORLAR ---
  // Her sporun kendi merge zinciri, kendi producer'ı ve görsel teması var.
  sports: {
    football: {
      id: 'football',
      nameKey: 'sport.football.name',
      unlocked: true,
      producerId: 'sports_bag',
      chainId: 'football_chain'
    }
  },

  // --- ITEM ZİNCİRLERİ ---
  // Her chain, level -> item tanımı şeklinde bir dizi.
  chains: {
    football_chain: {
      id: 'football_chain',
      sportId: 'football',
      levels: [
        { level: 1, nameKey: 'item.football.lv1', icon: 'football_lv1.png' },
        { level: 2, nameKey: 'item.football.lv2', icon: 'football_lv2.png' },
        { level: 3, nameKey: 'item.football.lv3', icon: 'football_lv3.png' },
        { level: 4, nameKey: 'item.football.lv4', icon: 'football_lv4.png' },
        { level: 5, nameKey: 'item.football.lv5', icon: 'football_lv5.png' },
        { level: 6, nameKey: 'item.football.lv6', icon: 'football_lv6.png' }
      ]
    }
  },

  // --- PRODUCER TANIMLARI ---
  producers: {
    sports_bag: {
      id: 'sports_bag',
      nameKey: 'producer.sports_bag.name',
      chainId: 'football_chain',
      icon: 'sports_bag.svg',
      // Her seviye için: cooldown (ms) ve seviye 1 üstü item gelme olasılığı (dropRates)
      levels: {
        1: { cooldownMs: 3 * 60 * 1000, dropRates: { 1: 1.0 } },
        2: { cooldownMs: 2.5 * 60 * 1000, dropRates: { 1: 0.9, 2: 0.1 } },
        3: { cooldownMs: 2 * 60 * 1000, dropRates: { 1: 0.8, 2: 0.2 } },
        4: { cooldownMs: 1.5 * 60 * 1000, dropRates: { 1: 0.7, 2: 0.25, 3: 0.05 } },
        5: { cooldownMs: 1 * 60 * 1000, dropRates: { 1: 0.6, 2: 0.3, 3: 0.1 } },
        6: { cooldownMs: 0.5 * 60 * 1000, dropRates: { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05 } }
      }
    }
  },

  // --- BOARD ---
  board: {
    columns: 7,
    rows: 9
  },

  // --- ENERGY ---
  // Not: GDD'de "Energy: MVP'de gerekli değil" diye işaretlenmişti, ancak
  // kullanıcı isteğiyle üretim artık cooldown yerine enerjiyle sınırlanıyor.
  // Producer'daki dropRates hâlâ geçerli (üretilen topun kalitesi için),
  // ama levels[].cooldownMs artık üretim tetiklemede KULLANILMIYOR.
  energy: {
    startingEnergy: 100,
    maxEnergy: 100,
    regenIntervalMs: 2 * 60 * 1000, // 2 dakikada 1 enerji
    costPerProduction: 1
  }
};
