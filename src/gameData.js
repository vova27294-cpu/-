// Claude: единый источник игровых данных и чистой логики.
// Вынесено из App.jsx, чтобы api.js (локальная симуляция сервера) мог
// использовать те же персонажей/редкости/шансы, что и интерфейс —
// без дублирования и без риска рассинхронизации.

export const RARITIES = {
  common:    { key: "common",    label: "Обычная",          weight: 40, border: "#475569", glow: "rgba(71,85,105,0.35)",  text: "#cbd5e1", grad: ["#1e293b", "#0f172a"] },
  uncommon:  { key: "uncommon",  label: "Необычная",        weight: 25, border: "#10b981", glow: "rgba(16,185,129,0.45)", text: "#6ee7b7", grad: ["#064e3b", "#0f172a"] },
  rare:      { key: "rare",      label: "Редкая",           weight: 18, border: "#3b82f6", glow: "rgba(59,130,246,0.55)", text: "#93c5fd", grad: ["#1e3a8a", "#0f172a"] },
  epic:      { key: "epic",      label: "Эпическая",        weight: 10, border: "#a855f7", glow: "rgba(168,85,247,0.6)",  text: "#d8b4fe", grad: ["#581c87", "#0f172a"] },
  legendary: { key: "legendary", label: "Легендарная",       weight: 6,  border: "#facc15", glow: "rgba(250,204,21,0.7)",  text: "#fde68a", grad: ["#78350f", "#0f172a"] },
  mythic:    { key: "mythic",    label: "Сверхлегендарная", weight: 1,  border: "#ec4899", glow: "rgba(236,72,153,0.85)", text: "#f9a8d4", grad: ["#831843", "#0f172a"] },
};
export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

export const SERIES = [
  "Общага в измерении ВК",
  "Рабовладельчий дом Вики",
  "Галактический охотник",
  "Игры Вики",
  "Путь к власти",
];

export const ABILITIES = [
  "Всегда идёт вперёд", "Второе дыхание", "Тень среди своих", "Несокрушимый щит",
  "Взгляд провидца", "Искра хаоса", "Последний рубеж", "Голос стаи",
  "Холодный расчёт", "Стальные нервы", "Пробуждение силы", "Свет во тьме",
  "Быстрее мысли", "Разлом реальности", "Верность до конца", "Буря вопросов",
  "Тихий шаг", "Огненное сердце", "Ледяной разум", "Последний козырь",
  "Гром среди ясного неба", "Невидимая рука", "Клятва хранителя", "Эхо прошлого",
  "Северный ветер", "Королевский указ", "Механическое сердце", "Финальный аккорд",
];

const NAMES = [
  "Захар","Воков","Вика","Паша","Юра","Даня","Санчоуст","Прокс","Барс","Енот",
  "Мика","Роакс","Лорк","Андрей","Миша","Скаф","Марго","Макс","Глеб","Катзо",
  "Шейн","Санс","Ларго","Белуга","Гидеон","Кира","Шредер","Леон",
];

// простой детерминированный ГПСЧ, чтобы данные не "прыгали" между рендерами
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1312);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

function buildCharacters() {
  // распределение редкостей на 28 персонажей
  const plan = [
    ...Array(6).fill("common"),
    ...Array(6).fill("uncommon"),
    ...Array(6).fill("rare"),
    ...Array(5).fill("epic"),
    ...Array(4).fill("legendary"),
    ...Array(1).fill("mythic"),
  ];
  const statRanges = {
    common: [30, 55], uncommon: [45, 65], rare: [55, 75],
    epic: [65, 85], legendary: [78, 95], mythic: [90, 99],
  };
  return NAMES.map((name, i) => {
    const rarity = plan[i % plan.length];
    const [lo, hi] = statRanges[rarity];
    return {
      id: `char-${i}`,
      name,
      rarity,
      series: SERIES[i % SERIES.length],
      ability: ABILITIES[i % ABILITIES.length],
      cost: { common: 100, uncommon: 180, rare: 300, epic: 500, legendary: 900, mythic: 2000 }[rarity],
      stats: {
        power: randInt(lo, hi),
        defense: randInt(lo - 5, hi - 5),
        speed: randInt(lo - 3, hi + 3),
        intel: randInt(lo - 8, hi),
      },
      description: `${name} — один из ключевых персонажей вселенной «Хроники», связанный с сюжетом «${SERIES[i % SERIES.length]}».`,
    };
  });
}
export const CHARACTERS = buildCharacters();

export const GAMES = [
  { id: "g1", title: "Общага в измерении ВК", desc: "Кооперативное приключение: выживите и раскройте тайны общаги, застрявшей между мирами.", chars: 12, reward: "50–150 монет", icon: "🏚️", minReward: 50, maxReward: 150, winChance: 0.62 },
  { id: "g2", title: "Рабовладельческий дом Вики", desc: "Тактическая карточная дуэль один на один за контроль над домом.", chars: 10, reward: "80–200 монет", icon: "♟️", minReward: 80, maxReward: 200, winChance: 0.55 },
  { id: "g3", title: "Галактический охотник", desc: "Аркадная охота на боссов вместе с друзьями, ставки — редкие карты.", chars: 15, reward: "Карта + монеты", icon: "🚀", minReward: 40, maxReward: 120, winChance: 0.5 },
  { id: "g4", title: "Игры Вики", desc: "Серия мини-испытаний на скорость и реакцию.", chars: 8, reward: "20–60 монет", icon: "🎯", minReward: 20, maxReward: 60, winChance: 0.7 },
  { id: "g5", title: "Путь к власти", desc: "Пошаговая стратегия за влияние во вселенной «Хроник».", chars: 7, reward: "100–300 монет", icon: "👑", minReward: 100, maxReward: 300, winChance: 0.45 },
];

export const ACHIEVEMENT_DEFS = [
  { id: "a1", title: "Первый шаг", desc: "Получить первую карту", check: (s) => s.totalCards >= 1, reward: 50 },
  { id: "a2", title: "Коллекционер", desc: "Собрать 10 уникальных персонажей", check: (s) => s.unique >= 10, reward: 100 },
  { id: "a3", title: "Редкий гость", desc: "Получить редкую карту", check: (s) => s.byRarity.rare > 0, reward: 200 },
  { id: "a4", title: "Легенда", desc: "Получить легендарную карту", check: (s) => s.byRarity.legendary > 0, reward: 500 },
  { id: "a5", title: "Сверхудача", desc: "Получить сверхлегендарную карту", check: (s) => s.byRarity.mythic > 0, reward: 1000 },
  { id: "a6", title: "Обменщик", desc: "Совершить 5 обменов", check: () => false, reward: 300 },
];

export const PULL_COOLDOWN_MS = 90 * 1000; // укорочено для демонстрации (в ТЗ — часы)

// rarityBias: 0 = обычный пакет … 3 = супер-пак (сдвигает шансы к редким)
export const PACKS = [
  { id: "p1", name: "Обычный пакет", price: 100, desc: "3 карты (обычные и необычные)", rarityBias: 0, cardCount: 3 },
  { id: "p2", name: "Редкий пакет", price: 300, desc: "3 карты (редкие и эпические)", rarityBias: 1, cardCount: 3 },
  { id: "p3", name: "Легендарный пакет", price: 800, desc: "3 карты (эпические и легендарные)", rarityBias: 2, cardCount: 3 },
  { id: "p4", name: "Супер-пак", price: 1500, desc: "5 карт, включая шанс на сверхлегендарную", rarityBias: 3, cardCount: 5 },
];

export function weightedPick(bias = 0) {
  // bias сдвигает вес в сторону редких категорий (используется магазином)
  const boosted = RARITY_ORDER.map((r, i) => {
    const mult = 1 + bias * (i / (RARITY_ORDER.length - 1)) * 2.2;
    return RARITIES[r].weight * mult;
  });
  const total = boosted.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    roll -= boosted[i];
    if (roll <= 0) return RARITY_ORDER[i];
  }
  return "common";
}

export function pullRandomCard(bias = 0) {
  const rarity = weightedPick(bias);
  const pool = CHARACTERS.filter((c) => c.rarity === rarity);
  return pool[randInt(0, pool.length - 1)];
}

export function simulateMatch(game) {
  const win = rng() < game.winChance;
  const amount = randInt(game.minReward, game.maxReward);
  return { win, coinsDelta: win ? amount : -Math.round(amount * 0.3) };
}
