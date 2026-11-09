// Claude: клиент backend API «Хроник».
//
// ЧЕСТНОЕ ОГРАНИЧЕНИЕ (см. README.md): среда, где выполняется этот прототип
// (чат с превью файлов), не может держать настоящий сервер, базу данных или
// сетевые соединения — код живёт только в браузере пользователя. Поэтому
// каждый метод сначала пытается обратиться к настоящему REST API по
// API_BASE_URL (на случай, если бэкенд когда-нибудь появится по этому же
// адресу), а если сеть недоступна — откатывается на локальную симуляцию,
// которая живёт в этом модуле и ведёт себя так же, как должен вести себя
// сервер (тот же контракт ответов), включая простую защиту от гонок.
//
// Когда появится реальный backend (см. дорожную карту в README, этапы 9+),
// нужно будет просто убрать функции simulate* и блок LOCAL_STATE — весь
// остальной код (App.jsx) менять не придётся, он уже работает через api.*.

import {
  CHARACTERS, PACKS, GAMES, PULL_COOLDOWN_MS, pullRandomCard, simulateMatch,
} from "./gameData";

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env && process.env.API_BASE_URL) || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Ошибка запроса (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------------------------------------------------------------------- */
/*  Локальное состояние "сервера" — держится в памяти модуля               */
/* ---------------------------------------------------------------------- */

const LOCAL_STATE = {
  nickname: "Гость_4821",
  level: 12,
  xp: 340,
  coins: 1250,
  crystals: 48,
  cards: {}, // characterId -> count
  cooldownEndsAt: 0,
  tradesCompleted: 0,
  busy: false, // простая CAS-блокировка, как договаривались для Engine V2
};

function collectionPayload() {
  return {
    nickname: LOCAL_STATE.nickname,
    level: LOCAL_STATE.level,
    xp: LOCAL_STATE.xp,
    coins: LOCAL_STATE.coins,
    crystals: LOCAL_STATE.crystals,
    cards: Object.entries(LOCAL_STATE.cards).map(([characterId, count]) => ({ characterId, count })),
    cooldownEndsAt: LOCAL_STATE.cooldownEndsAt,
  };
}

function addCard(characterId, amount = 1) {
  LOCAL_STATE.cards[characterId] = (LOCAL_STATE.cards[characterId] || 0) + amount;
}

// имитирует задержку и недоступность бэкенда в этой среде
function localDelay(ms = 260) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLock(fn) {
  // Claude: та же идея CAS/блокировки, что обсуждалась для Engine V2 —
  // здесь она тривиальна (один клиент, память процесса), но интерфейс
  // сохранён, чтобы логика переносилась на реальный сервер без изменений.
  if (LOCAL_STATE.busy) throw new Error("Запрос уже выполняется, подождите");
  LOCAL_STATE.busy = true;
  try {
    await localDelay();
    return await fn();
  } finally {
    LOCAL_STATE.busy = false;
  }
}

/* ---------------------------------------------------------------------- */
/*  API                                                                    */
/* ---------------------------------------------------------------------- */

export const api = {
  getCollection: () =>
    request("/collection").catch(() => withLock(async () => collectionPayload())),

  pullCard: () =>
    request("/cards/pull", { method: "POST" }).catch(() =>
      withLock(async () => {
        const now = Date.now();
        if (now < LOCAL_STATE.cooldownEndsAt) {
          throw new Error("Карта ещё не готова — подождите таймер");
        }
        const character = pullRandomCard();
        addCard(character.id);
        LOCAL_STATE.cooldownEndsAt = now + PULL_COOLDOWN_MS;
        LOCAL_STATE.xp += 25;
        return {
          characterId: character.id,
          character,
          cooldownEndsAt: LOCAL_STATE.cooldownEndsAt,
          coins: LOCAL_STATE.coins,
          crystals: LOCAL_STATE.crystals,
        };
      })
    ),

  sellCard: (characterId) =>
    request(`/cards/${characterId}/sell`, { method: "POST" }).catch(() =>
      withLock(async () => {
        const character = CHARACTERS.find((c) => c.id === characterId);
        if (!character) throw new Error("Такой карты нет");
        const owned = LOCAL_STATE.cards[characterId] || 0;
        if (owned <= 0) throw new Error("У вас нет этой карты");
        LOCAL_STATE.cards[characterId] = owned - 1;
        const gain = Math.round(character.cost / 4);
        LOCAL_STATE.coins += gain;
        return {
          coins: LOCAL_STATE.coins,
          cards: Object.entries(LOCAL_STATE.cards).map(([id, count]) => ({ characterId: id, count })),
        };
      })
    ),

  getShopPacks: () =>
    request("/shop/packs").catch(() => withLock(async () => ({ packs: PACKS }))),

  buyPack: (packId) =>
    request("/shop/buy", { method: "POST", body: JSON.stringify({ packId }) }).catch(() =>
      withLock(async () => {
        const pack = PACKS.find((p) => p.id === packId);
        if (!pack) throw new Error("Такого пакета нет");
        if (LOCAL_STATE.coins < pack.price) throw new Error("Недостаточно монет");
        LOCAL_STATE.coins -= pack.price;
        // интерфейс сейчас показывает одну открытую карту за раз (PullModal),
        // поэтому выдаём первую — остальные из pack.cardCount сразу добавляем в коллекцию
        const drawn = Array.from({ length: pack.cardCount }, () => pullRandomCard(pack.rarityBias));
        drawn.slice(1).forEach((c) => addCard(c.id));
        const character = drawn[0];
        addCard(character.id);
        return { characterId: character.id, character, coins: LOCAL_STATE.coins, extraCards: drawn.slice(1) };
      })
    ),

  playGame: (gameId) =>
    request(`/games/${gameId}/play`, { method: "POST" }).catch(() =>
      withLock(async () => {
        const game = GAMES.find((g) => g.id === gameId);
        if (!game) throw new Error("Такой игры нет");
        const { win, coinsDelta } = simulateMatch(game);
        LOCAL_STATE.coins = Math.max(0, LOCAL_STATE.coins + coinsDelta);
        return { win, coinsDelta, coins: LOCAL_STATE.coins };
      })
    ),

  // Этап 4 — ИИ (пока без настоящей модели: локальные заготовки по лору)
  askOracle: (question) =>
    request("/oracle/ask", { method: "POST", body: JSON.stringify({ question }) }).catch(() =>
      withLock(async () => ({ answer: localOracleAnswer(question) }))
    ),

  getAiMove: (gameId, state, moves) =>
    request("/games/ai-move", { method: "POST", body: JSON.stringify({ gameId, state, moves }) }).catch(() =>
      withLock(async () => ({ move: moves && moves.length ? moves[0] : null }))
    ),

  moderateGame: (title, description, rules = {}) =>
    request("/admin/moderate-game", { method: "POST", body: JSON.stringify({ title, description, rules }) }).catch(() =>
      withLock(async () => ({ approved: true, reason: "Локальная заглушка модерации (нет бэкенда)" }))
    ),

  generateCharacterDraft: (name, rarity, series) =>
    request("/admin/characters/generate-description", { method: "POST", body: JSON.stringify({ name, rarity, series }) }).catch(() =>
      withLock(async () => ({
        description: `${name} — персонаж редкости «${rarity}» из сюжета «${series}». (черновик сгенерирован локально, без бэкенда)`,
      }))
    ),
};

function localOracleAnswer(question) {
  const q = (question || "").toLowerCase().trim();
  if (!q) return "Оракул молчит — спроси о персонаже или серии.";
  const bySeries = ["общага", "рабовладельч", "галактическ", "игры вики", "путь к власти"];
  const character = CHARACTERS.find((c) => q.includes(c.name.toLowerCase()));
  if (character) {
    return `${character.name} (${character.rarity}) связан с сюжетом «${character.series}». Особая способность: «${character.ability}».`;
  }
  const seriesHit = CHARACTERS.find((c) => bySeries.some((s) => q.includes(s) && c.series.toLowerCase().includes(s)));
  if (seriesHit) {
    return `В сюжете «${seriesHit.series}» встречаются такие персонажи, как ${seriesHit.name}, и другие герои вселенной «Хроники».`;
  }
  return "Оракул отвечает только по открытым данным вселенной «Хроники» — попробуй спросить про конкретного персонажа или сюжетную серию.";
}
