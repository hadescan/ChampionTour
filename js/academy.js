window.ChampionTour = window.ChampionTour || {};

window.ChampionTour.AcademyProgression = (function () {
  'use strict';

  const STORAGE_KEY = 'championTour.prototype.academy.v2';
  const LEGACY_STORAGE_KEY = 'championTour.prototype.academy.v1';
  const MAX_LEVEL = 30;

  const ACADEMIES = Object.freeze([
    Object.freeze({
      id: 'football',
      name: 'Football Academy',
      shortName: 'Futbol',
      icon: '⚽',
      theme: 'football',
      description: 'Şampiyonların yetişeceği futbol tesisini yeniden kur.',
      available: true
    }),
    Object.freeze({
      id: 'basketball',
      name: 'Basketball Academy',
      shortName: 'Basketbol',
      icon: '🏀',
      theme: 'basketball',
      description: 'Yeni nesil basketbolcular için kampüs sahası.',
      available: false
    }),
    Object.freeze({
      id: 'baseball',
      name: 'Baseball Academy',
      shortName: 'Beyzbol',
      icon: '⚾',
      theme: 'baseball',
      description: 'Vuruş ve saha eğitiminin yeni merkezi.',
      available: false
    }),
    Object.freeze({
      id: 'shooting',
      name: 'Shooting Academy',
      shortName: 'Atıcılık',
      icon: '🎯',
      theme: 'shooting',
      description: 'Odaklanma ve hassasiyet antrenman tesisi.',
      available: false
    }),
    Object.freeze({
      id: 'swimming',
      name: 'Swimming Academy',
      shortName: 'Yüzme',
      icon: '🏊',
      theme: 'swimming',
      description: 'Geleceğin yüzücüleri için performans havuzu.',
      available: false
    }),
    Object.freeze({
      id: 'horse',
      name: 'Horse Academy',
      shortName: 'Binicilik',
      icon: '🐎',
      theme: 'horse',
      description: 'Modern ahırlar ve profesyonel eğitim parkuru.',
      available: false
    })
  ]);

  const FOOTBALL_RENOVATIONS = Object.freeze([
    ['clubhouse-roof', 'Kulüp binası çatısı', 'Eksik çatı tamamlandı; bina artık yağmura karşı güvende.', '🏠'],
    ['pitch-drainage', 'Saha drenajı', 'Bozuk zeminin altına yeni drenaj hatları döşendi.', '💧'],
    ['pitch-grass', 'Ana saha çimleri', 'Yıpranmış saha canlı, profesyonel çimlerle yenilendi.', '🌱'],
    ['pitch-lines', 'Saha çizgileri', 'Antrenman sahasının çizgileri yeniden çizildi.', '▦'],
    ['goals', 'Yeni kaleler', 'Paslanmış kalelerin yerini güvenli antrenman kaleleri aldı.', '🥅'],
    ['stands-frame', 'Tribün iskeleti', 'Eski tribün güçlendirilip güvenli hale getirildi.', '🏟'],
    ['stands-seats', 'Tribün koltukları', 'Aileler ve taraftarlar için yeni koltuklar eklendi.', '💺'],
    ['locker-room', 'Soyunma odası', 'Oyuncular için temiz ve düzenli bir soyunma alanı açıldı.', '👕'],
    ['showers', 'Duş alanları', 'Antrenman sonrası kullanım için modern duşlar kuruldu.', '🚿'],
    ['fitness-shell', 'Fitness salonu', 'Yarım kalan salonun yapısı tamamlandı.', '🏋'],
    ['fitness-equipment', 'Fitness ekipmanları', 'Performans antrenmanları için yeni ekipmanlar geldi.', '💪'],
    ['medical-room', 'Sağlık odası', 'Sporcu sağlığı için profesyonel müdahale odası açıldı.', '✚'],
    ['main-path', 'Ana yürüyüş yolu', 'Kırık zemin, güvenli ve sıcak tonlu taşlarla yenilendi.', '➜'],
    ['side-paths', 'Tesis bağlantıları', 'Saha ve binalar yeni yollarla birbirine bağlandı.', '↗'],
    ['training-pitch', 'Antrenman sahası', 'İkinci saha genç takımlar için kullanıma açıldı.', '⚽'],
    ['training-equipment', 'Antrenman alanı', 'Koniler, engeller ve mini kaleler yerleştirildi.', '🚩'],
    ['floodlight-bases', 'Işık direkleri', 'Akşam antrenmanları için direkler kuruldu.', '🔆'],
    ['floodlights', 'Saha aydınlatması', 'Profesyonel projektörler ilk kez yakıldı.', '✨'],
    ['clubhouse-facade', 'Kulüp binası cephesi', 'Merkez bina Champion Tour renkleriyle yenilendi.', '🎨'],
    ['academy-sign', 'Akademi tabelası', 'Kampüs girişine yeni Football Academy tabelası asıldı.', '⚜'],
    ['analysis-room', 'Taktik analiz odası', 'Takımlar için dijital analiz merkezi hazırlandı.', '▤'],
    ['cafeteria', 'Sporcu kafeteryası', 'Dengeli beslenme sunan sıcak bir sosyal alan açıldı.', '🥗'],
    ['trees', 'Kampüs ağaçları', 'Yürüyüş yollarının çevresine yeni ağaçlar dikildi.', '🌳'],
    ['gardens', 'Peyzaj alanları', 'Boş alanlar çiçekler ve dinlenme köşeleriyle canlandı.', '🌼'],
    ['flags', 'Şampiyonluk bayrakları', 'Boş direklerde akademinin bayrakları dalgalanmaya başladı.', '🚩'],
    ['security', 'Kampüs girişi', 'Güvenli ve davetkâr bir ana giriş tamamlandı.', '🛡'],
    ['scoreboard', 'Dijital skorboard', 'Ana sahaya modern maç ekranı kuruldu.', '▣'],
    ['trophy-court', 'Şampiyonlar meydanı', 'Başarıları kutlayan altın detaylı meydan açıldı.', '🏆'],
    ['finale', 'Football Academy tamamlandı', 'Tüm tesisler ışıklarıyla yaşayan profesyonel bir akademiye dönüştü.', '⭐']
  ].map((entry, index) => Object.freeze({
    id: entry[0],
    level: index + 2,
    title: entry[1],
    description: entry[2],
    icon: entry[3],
    zone: [
      'clubhouse', 'pitch', 'pitch', 'pitch', 'pitch', 'stands', 'stands',
      'clubhouse', 'clubhouse', 'fitness', 'fitness', 'fitness', 'paths',
      'paths', 'pitch', 'pitch', 'lighting', 'lighting', 'clubhouse',
      'clubhouse', 'clubhouse', 'clubhouse', 'landscape', 'landscape',
      'landscape', 'paths', 'stands', 'landscape', 'lighting'
    ][index]
  })));

  const state = {
    level: 1,
    xp: 0,
    appliedLevel: 1,
    activeAcademyId: 'football'
  };

  function xpRequired(level = state.level) {
    if (level >= MAX_LEVEL) return null;
    return 60 + level * 15;
  }

  function readSavedState() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (current) return current;

      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (!legacy) return null;
      const appliedCount = Object.values(legacy.improvements || {})
        .reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
      return {
        level: legacy.level,
        xp: legacy.xp,
        appliedLevel: Math.min(
          Number(legacy.level) || 1,
          Math.max(1, appliedCount + 1)
        ),
        activeAcademyId: 'football'
      };
    } catch (error) {
      console.warn('Akademi ilerleme kaydı okunamadı.', error);
      return null;
    }
  }

  function load() {
    const saved = readSavedState();
    if (!saved) return;
    state.level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(saved.level) || 1)));
    state.xp = Math.max(0, Math.floor(Number(saved.xp) || 0));
    state.appliedLevel = Math.max(
      1,
      Math.min(state.level, Math.floor(Number(saved.appliedLevel) || 1))
    );
    state.activeAcademyId = String(saved.activeAcademyId || 'football');
    if (state.level === MAX_LEVEL) state.xp = 0;
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Akademi ilerleme kaydı yazılamadı.', error);
    }
  }

  function getAcademies() {
    const footballComplete = state.appliedLevel >= MAX_LEVEL;
    return ACADEMIES.map((academy, index) => ({
      ...academy,
      status: index === 0
        ? footballComplete ? 'completed' : 'active'
        : index === 1 && footballComplete ? 'available' : 'locked',
      progress: index === 0 ? (state.appliedLevel - 1) / (MAX_LEVEL - 1) : 0
    }));
  }

  function getState() {
    const required = xpRequired();
    const pendingRenovations = Math.max(0, state.level - state.appliedLevel);
    const completed = state.appliedLevel >= MAX_LEVEL;
    return {
      level: state.level,
      maxLevel: MAX_LEVEL,
      xp: state.xp,
      xpToNext: required,
      progress: required ? Math.min(1, state.xp / required) : 1,
      appliedLevel: state.appliedLevel,
      pendingRenovations,
      pendingUpgrades: pendingRenovations,
      completed,
      activeAcademyId: state.activeAcademyId,
      nextWorld: completed ? 'basketball' : null,
      nextRenovation: pendingRenovations > 0
        ? FOOTBALL_RENOVATIONS[state.appliedLevel]
        : null
    };
  }

  function addXp(amount) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    const levelUps = [];
    while (remaining > 0 && state.level < MAX_LEVEL) {
      const required = xpRequired();
      const accepted = Math.min(remaining, required - state.xp);
      state.xp += accepted;
      remaining -= accepted;
      if (state.xp < required) continue;
      state.xp = 0;
      state.level += 1;
      levelUps.push(state.level);
    }
    if (state.level === MAX_LEVEL) state.xp = 0;
    save();
    return { levelUps, state: getState() };
  }

  function applyNextRenovation() {
    if (state.appliedLevel >= state.level || state.appliedLevel >= MAX_LEVEL) {
      return null;
    }
    const renovation = FOOTBALL_RENOVATIONS[state.appliedLevel];
    state.appliedLevel += 1;
    save();
    return { renovation, state: getState() };
  }

  function setActiveAcademy(id) {
    const academy = getAcademies().find((entry) => entry.id === id);
    if (!academy || academy.status === 'locked') return false;
    state.activeAcademyId = id;
    save();
    return true;
  }

  load();

  return {
    MAX_LEVEL,
    ACADEMIES,
    FOOTBALL_RENOVATIONS,
    addXp,
    applyNextRenovation,
    getAcademies,
    getState,
    setActiveAcademy
  };
})();
