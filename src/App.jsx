import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Users, Gamepad2, Layers, User, Search, Coins, Gem, Bell,
  ChevronLeft, ShoppingBag, Trophy, Sparkles, X, Shield, Zap, Brain,
  Sword, ArrowUpDown, Settings, Repeat, Check, Clock, Star
} from "lucide-react";
import { api } from "./api"; // Claude: клиент backend API + локальная симуляция (этап 3-4)
import {
  RARITIES, RARITY_ORDER, CHARACTERS, GAMES, ACHIEVEMENT_DEFS,
  PULL_COOLDOWN_MS, PACKS, pullRandomCard,
} from "./gameData"; // Claude: игровые данные вынесены в общий модуль (см. README)

/* -------------------------------------------------------------------- */
/*  ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ                                           */
/* -------------------------------------------------------------------- */

function RarityBadge({ rarity, size = "sm" }) {
  const r = RARITIES[rarity];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"}`}
      style={{ color: r.text, background: `${r.border}22`, border: `1px solid ${r.border}66` }}
    >
      {r.label}
    </span>
  );
}

function Avatar({ name, rarity, size = 64, ring = true }) {
  const r = RARITIES[rarity];
  return (
    <div
      className="flex items-center justify-center rounded-2xl font-bold select-none shrink-0"
      style={{
        width: size, height: size,
        background: `linear-gradient(150deg, ${r.grad[0]}, ${r.grad[1]})`,
        border: ring ? `2px solid ${r.border}` : "1px solid #1e293b",
        boxShadow: ring ? `0 0 16px ${r.glow}` : "none",
        color: r.text,
        fontSize: size / 2.6,
      }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function CoinPill({ icon: Icon, value, color }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1">
      <Icon size={14} color={color} />
      <span className="text-xs font-semibold text-slate-100">{value.toLocaleString("ru-RU")}</span>
    </div>
  );
}

function Screen({ children }) {
  return <div className="px-4 pt-4 pb-28 min-h-full">{children}</div>;
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
      <h2 className="text-sm font-semibold text-slate-200 tracking-wide">{children}</h2>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  ГЛАВНЫЙ ЭКРАН                                                        */
/* -------------------------------------------------------------------- */

function HomeScreen({ user, collection, cooldownLeft, onPull, onOpenCharacter, onNav, recentPulls, pullLoading }) {
  const canPull = cooldownLeft <= 0 && !pullLoading;
  const fmt = (ms) => {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={user.nickname} rarity="epic" size={44} />
          <div>
            <div className="text-[11px] text-purple-300 font-medium">Ур. {user.level}</div>
            <div className="text-sm font-semibold text-white leading-tight">{user.nickname}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CoinPill icon={Coins} value={user.coins} color="#facc15" />
          <CoinPill icon={Gem} value={user.crystals} color="#38bdf8" />
          <button onClick={() => onNav("notifications")} className="relative bg-slate-900/80 border border-slate-700 rounded-full p-2">
            <Bell size={16} className="text-slate-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 border border-slate-950" />
          </button>
        </div>
      </div>

      <div
        className="mt-5 rounded-3xl p-6 relative overflow-hidden border border-purple-800/50"
        style={{ background: "radial-gradient(circle at 30% 20%, rgba(147,51,234,0.35), transparent 60%), linear-gradient(160deg,#0b0b1e,#05050c)" }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-purple-600/20 blur-2xl" />
        <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full bg-blue-600/20 blur-2xl" />
        <div className="relative">
          <h1 className="text-3xl font-black text-white tracking-tight">ХРОНИКИ</h1>
          <p className="text-xs text-purple-300 mt-1">Собирай. Исследуй. Открывай.</p>

          <button
            onClick={onPull}
            disabled={!canPull}
            className="mt-6 w-full rounded-2xl py-3.5 font-bold text-sm transition active:scale-95 disabled:active:scale-100"
            style={{
              background: canPull ? "linear-gradient(90deg,#7c3aed,#4f46e5)" : "#1e293b",
              color: canPull ? "white" : "#64748b",
              boxShadow: canPull ? "0 0 24px rgba(124,58,237,0.55)" : "none",
            }}
          >
            {pullLoading ? "Загрузка..." : canPull ? "ПОЛУЧИТЬ КАРТУ" : `Доступно через ${fmt(cooldownLeft)}`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-5">
        {[
          { key: "characters", label: "Персонажи", icon: Users },
          { key: "games", label: "Игры", icon: Gamepad2 },
          { key: "collection", label: "Коллекция", icon: Layers },
          { key: "trade", label: "Обмен", icon: Repeat },
          { key: "shop", label: "Магазин", icon: ShoppingBag },
          { key: "achievements", label: "Достижения", icon: Trophy },
          { key: "oracle", label: "Оракул", icon: Brain },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-900/70 border border-slate-800 rounded-2xl py-3.5 active:scale-95 transition"
          >
            <item.icon size={18} className="text-purple-300" />
            <span className="text-[11px] text-slate-300">{item.label}</span>
          </button>
        ))}
      </div>

      {recentPulls.length > 0 && (
        <>
          <SectionTitle>Последние полученные карты</SectionTitle>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {recentPulls.map((c, idx) => (
              <button key={idx} onClick={() => onOpenCharacter(c)} className="flex flex-col items-center gap-1.5 shrink-0">
                <Avatar name={c.name} rarity={c.rarity} size={56} />
                <span className="text-[10px] text-slate-400 w-14 text-center truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Новое событие</SectionTitle>
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-800/20 flex items-center justify-center text-lg">🎉</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Сезон «Великая троица»</div>
          <div className="text-xs text-slate-400">Новые персонажи и повышенные шансы на легендарных карт</div>
        </div>
      </div>
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/*  ПЕРСОНАЖИ                                                            */
/* -------------------------------------------------------------------- */

function CharactersScreen({ collection, onOpenCharacter }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = CHARACTERS.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || c.rarity === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <Screen>
      <h1 className="text-xl font-bold text-white mb-3">Персонажи</h1>
      <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5">
        <Search size={16} className="text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск персонажа..."
          className="bg-transparent outline-none text-sm text-white placeholder:text-slate-500 flex-1"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-4 px-4">
        {[{ key: "all", label: "Все" }, ...RARITY_ORDER.map((r) => ({ key: r, label: RARITIES[r].label }))].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition"
            style={
              filter === f.key
                ? { background: "#7c3aed", borderColor: "#7c3aed", color: "white" }
                : { background: "transparent", borderColor: "#334155", color: "#94a3b8" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {filtered.map((c) => {
          const owned = collection[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => onOpenCharacter(c)}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 bg-slate-900/60 border border-slate-800 relative active:scale-95 transition"
            >
              {owned > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-slate-950/90 border border-slate-700 text-slate-200 rounded-full px-1.5 py-0.5">
                  ×{owned}
                </span>
              )}
              <Avatar name={c.name} rarity={c.rarity} size={52} ring={owned > 0} />
              <span className={`text-[11px] font-medium truncate w-full text-center ${owned > 0 ? "text-white" : "text-slate-500"}`}>{c.name}</span>
              <span className="text-[9px]" style={{ color: RARITIES[c.rarity].text }}>{RARITIES[c.rarity].label}</span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-slate-500 mt-10">Ничего не найдено</p>}
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/*  КОЛЛЕКЦИЯ                                                            */
/* -------------------------------------------------------------------- */

function CollectionScreen({ collection, onOpenCharacter }) {
  const [sortBy, setSortBy] = useState("rarity");

  const owned = CHARACTERS.filter((c) => collection[c.id] > 0);
  const totalCards = Object.values(collection).reduce((a, b) => a + b, 0);
  const byRarity = RARITY_ORDER.reduce((acc, r) => {
    acc[r] = owned.filter((c) => c.rarity === r).length;
    return acc;
  }, {});
  const duplicates = owned.reduce((sum, c) => sum + Math.max(0, collection[c.id] - 1), 0);

  const sorted = [...owned].sort((a, b) => {
    if (sortBy === "rarity") return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    if (sortBy === "name") return a.name.localeCompare(b.name, "ru");
    if (sortBy === "cost") return b.cost - a.cost;
    return 0;
  });

  return (
    <Screen>
      <h1 className="text-xl font-bold text-white mb-3">Моя коллекция</h1>
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex gap-6">
        <div>
          <div className="text-xl font-black text-white">{owned.length} / {CHARACTERS.length}</div>
          <div className="text-[11px] text-slate-400">персонажей</div>
        </div>
        <div>
          <div className="text-xl font-black text-white">{duplicates}</div>
          <div className="text-[11px] text-slate-400">дубликатов</div>
        </div>
        <div>
          <div className="text-xl font-black text-white">{totalCards}</div>
          <div className="text-[11px] text-slate-400">всего карт</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {RARITY_ORDER.map((r) => (
          <div key={r} className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-xs" style={{ color: RARITIES[r].text }}>{RARITIES[r].label}</span>
            <span className="text-xs font-semibold text-white">{byRarity[r]}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-sm font-semibold text-slate-200">Карты</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ArrowUpDown size={12} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 px-2 py-1 outline-none"
          >
            <option value="rarity">По редкости</option>
            <option value="name">По имени</option>
            <option value="cost">По стоимости</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Коллекция пуста. Получите первую карту на главном экране!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {sorted.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenCharacter(c)}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 bg-slate-900/60 border border-slate-800 relative active:scale-95 transition"
            >
              <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-slate-950/90 border border-slate-700 text-slate-200 rounded-full px-1.5 py-0.5">
                ×{collection[c.id]}
              </span>
              <Avatar name={c.name} rarity={c.rarity} size={52} />
              <span className="text-[11px] font-medium text-white truncate w-full text-center">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/*  ИГРЫ                                                                 */
/* -------------------------------------------------------------------- */

function GamesScreen({ onPlay }) {
  return (
    <Screen>
      <h1 className="text-xl font-bold text-white mb-4">Игры</h1>
      <div className="flex flex-col gap-3">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => onPlay(g)}
            className="flex items-center gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 text-left active:scale-[0.98] transition"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-950 border border-indigo-800/50 flex items-center justify-center text-2xl">
              {g.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{g.title}</div>
              <div className="text-[11px] text-slate-400">{g.chars} персонажей · {g.reward}</div>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-slate-500" />
          </button>
        ))}
      </div>
    </Screen>
  );
}

function GameDetailModal({ game, onClose, onFinishMatch, coins }) {
  const [state, setState] = useState("idle"); // idle | playing | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const startMatch = async () => {
    setState("playing");
    setError("");
    try {
      // Claude: награда теперь считается сервером — GET/POST не должен зависеть от клиента
      const data = await api.playGame(game.id);
      setResult({ win: data.win, delta: data.coinsDelta });
      setState("result");
      onFinishMatch(data.coinsDelta, data.coins);
    } catch (e) {
      setError(e.message || "Матч сейчас недоступен, попробуйте позже");
      setState("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-slate-950 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 pb-8"
      >
        {state === "idle" && (
          <>
            <div className="text-4xl mb-2">{game.icon}</div>
            <h2 className="text-lg font-bold text-white">{game.title}</h2>
            <p className="text-sm text-slate-400 mt-1">{game.desc}</p>
            <div className="flex gap-2 mt-3 text-xs text-slate-400">
              <span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">{game.chars} персонажей</span>
              <span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">Награда: {game.reward}</span>
            </div>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
            <button
              onClick={startMatch}
              className="mt-5 w-full rounded-2xl py-3 font-bold text-sm text-white"
              style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}
            >
              ИГРАТЬ
            </button>
            <button onClick={onClose} className="mt-2 w-full text-center text-xs text-slate-500 py-2">Отмена</button>
          </>
        )}
        {state === "playing" && (
          <div className="flex flex-col items-center py-10">
            <div className="w-16 h-16 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 mt-4">Идёт матч...</p>
          </div>
        )}
        {state === "result" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="text-3xl mb-2">{result.win ? "🏆" : "💀"}</div>
            <h2 className="text-lg font-bold text-white">{result.win ? "Победа!" : "Поражение"}</h2>
            <p className={`text-sm mt-1 font-semibold ${result.delta >= 0 ? "text-yellow-400" : "text-red-400"}`}>
              {result.delta >= 0 ? "+" : ""}{result.delta} монет
            </p>
            <button onClick={onClose} className="mt-5 w-full rounded-2xl py-3 font-bold text-sm text-white bg-slate-800">
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  ПРОФИЛЬ                                                              */
/* -------------------------------------------------------------------- */

function ProfileScreen({ user, collection, onNav }) {
  const owned = CHARACTERS.filter((c) => collection[c.id] > 0).length;
  const totalCards = Object.values(collection).reduce((a, b) => a + b, 0);
  const mythic = CHARACTERS.filter((c) => c.rarity === "mythic" && collection[c.id] > 0).length;
  const xpForLevel = user.level * 200;

  return (
    <Screen>
      <div className="flex flex-col items-center pt-4">
        <Avatar name={user.nickname} rarity="mythic" size={84} />
        <h1 className="text-lg font-bold text-white mt-3">{user.nickname}</h1>
        <p className="text-xs text-purple-300">Ур. {user.level}</p>
        <div className="w-full max-w-[220px] h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${Math.min(100, (user.xp / xpForLevel) * 100)}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">{user.xp} / {xpForLevel} опыта</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-white">{totalCards}</div>
          <div className="text-[10px] text-slate-400">всего карт</div>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-white">{owned}</div>
          <div className="text-[10px] text-slate-400">уникальных</div>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-white">{mythic}</div>
          <div className="text-[10px] text-slate-400">сверхлегендарных</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        {[
          { key: "collection", label: "Моя коллекция", icon: Layers },
          { key: "achievements", label: "Достижения", icon: Trophy },
          { key: "oracle", label: "Оракул", icon: Brain },
          { key: "trade", label: "Обмен картами", icon: Repeat },
          { key: "settings", label: "Настройки профиля", icon: Settings },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className="flex items-center gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3.5 text-left"
          >
            <item.icon size={17} className="text-purple-300" />
            <span className="text-sm text-white flex-1">{item.label}</span>
            <ChevronLeft size={14} className="rotate-180 text-slate-500" />
          </button>
        ))}
      </div>

      <div className="mt-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-yellow-400" />
          <span className="text-sm text-white font-semibold">{user.coins.toLocaleString("ru-RU")} монет</span>
        </div>
        <button onClick={() => onNav("shop")} className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-700/40 rounded-full px-3 py-1.5">
          Пополнить
        </button>
      </div>
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/*  ДОСТИЖЕНИЯ / МАГАЗИН / ОБМЕН / НАСТРОЙКИ (второстепенные экраны)      */
/* -------------------------------------------------------------------- */

function SubHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={onBack} className="p-1.5 -ml-1.5 text-slate-400"><ChevronLeft size={20} /></button>
      <h1 className="text-lg font-bold text-white">{title}</h1>
    </div>
  );
}

function AchievementsScreen({ collection, onBack }) {
  const owned = CHARACTERS.filter((c) => collection[c.id] > 0);
  const stats = {
    totalCards: Object.values(collection).reduce((a, b) => a + b, 0),
    unique: owned.length,
    byRarity: RARITY_ORDER.reduce((acc, r) => { acc[r] = owned.filter((c) => c.rarity === r).length; return acc; }, {}),
  };
  return (
    <Screen>
      <SubHeader title="Достижения" onBack={onBack} />
      <div className="flex flex-col gap-2.5">
        {ACHIEVEMENT_DEFS.map((a) => {
          const done = a.check(stats);
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-2xl p-3.5 border ${done ? "bg-purple-900/20 border-purple-700/50" : "bg-slate-900/60 border-slate-800"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? "bg-purple-600/30" : "bg-slate-800"}`}>
                {done ? <Check size={18} className="text-purple-300" /> : <Trophy size={16} className="text-slate-500" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{a.title}</div>
                <div className="text-[11px] text-slate-400">{a.desc}</div>
              </div>
              <div className="text-[11px] font-semibold text-yellow-400">+{a.reward}</div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function ShopScreen({ onBack, coins, onBuyPack }) {
  return (
    <Screen>
      <SubHeader title="Магазин" onBack={onBack} />
      <p className="text-xs text-slate-500 -mt-2 mb-4">Только внутриигровая валюта — реальные деньги не используются.</p>
      <div className="flex flex-col gap-3">
        {PACKS.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-800 to-slate-950 border border-purple-700/50 flex items-center justify-center">
              <Sparkles size={18} className="text-purple-300" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{p.name}</div>
              <div className="text-[11px] text-slate-400">{p.desc}</div>
            </div>
            <button
              disabled={coins < p.price}
              onClick={() => onBuyPack(p)}
              className="flex items-center gap-1 text-xs font-semibold rounded-full px-3 py-1.5 disabled:opacity-40"
              style={{ background: "rgba(250,204,21,0.12)", color: "#facc15", border: "1px solid rgba(250,204,21,0.3)" }}
            >
              <Coins size={12} /> {p.price}
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function ComingSoonScreen({ title, onBack, note }) {
  return (
    <Screen>
      <SubHeader title={title} onBack={onBack} />
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Clock size={22} className="text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">{note || "Этот раздел появится на следующем этапе разработки — потребуется серверная часть (друзья, синхронный обмен, уведомления в реальном времени)."}</p>
      </div>
    </Screen>
  );
}

function SettingsScreen({ onBack, sound, setSound }) {
  const Row = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3.5">
      <span className="text-sm text-white">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full relative transition"
        style={{ background: value ? "#7c3aed" : "#334155" }}
      >
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: value ? 22 : 2 }} />
      </button>
    </div>
  );
  return (
    <Screen>
      <SubHeader title="Настройки" onBack={onBack} />
      <div className="flex flex-col gap-2.5">
        <Row label="Музыка" value={sound.music} onChange={(v) => setSound((s) => ({ ...s, music: v }))} />
        <Row label="Звуки" value={sound.sfx} onChange={(v) => setSound((s) => ({ ...s, sfx: v }))} />
      </div>
      <p className="text-[11px] text-slate-500 mt-4">На прототипе используются заглушки звука — реальные аудиофайлы подключаются на следующем этапе.</p>
    </Screen>
  );
}

/* -------------------------------------------------------------------- */
/*  МОДАЛКИ: профиль персонажа + получение карты                        */
/* -------------------------------------------------------------------- */

function CharacterModal({ character, count, onClose, onSell }) {
  if (!character) return null;
  const r = RARITIES[character.rarity];
  const stats = [
    { label: "Сила", value: character.stats.power, icon: Sword },
    { label: "Защита", value: character.stats.defense, icon: Shield },
    { label: "Скорость", value: character.stats.speed, icon: Zap },
    { label: "Интеллект", value: character.stats.intel, icon: Brain },
  ];
  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-slate-950 border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 pb-8 relative"
        style={{ borderColor: r.border }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X size={18} /></button>
        <div className="flex flex-col items-center">
          <Avatar name={character.name} rarity={character.rarity} size={96} />
          <h2 className="text-xl font-bold text-white mt-3">{character.name}</h2>
          <RarityBadge rarity={character.rarity} size="md" />
          <p className="text-[11px] text-slate-500 mt-1.5">{character.series}</p>
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">{character.description}</p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2">
              <s.icon size={14} className="text-purple-300" />
              <span className="text-[11px] text-slate-400 flex-1">{s.label}</span>
              <span className="text-xs font-bold text-white">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Особая способность</div>
          <div className="text-sm text-purple-200 font-medium mt-0.5">«{character.ability}»</div>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <span>Стоимость: {character.cost} 🪙</span>
          <span>У вас: {count > 0 ? `×${count}` : "нет"}</span>
        </div>

        {count > 1 && (
          <button
            onClick={() => onSell(character)}
            className="mt-4 w-full rounded-2xl py-3 font-bold text-sm text-white bg-slate-800 active:scale-95 transition"
          >
            Продать дубликат (+{Math.round(character.cost / 4)} 🪙)
          </button>
        )}
      </div>
    </div>
  );
}

function PullModal({ phase, card, onReveal, onAddToCollection, onSell, onClose }) {
  const r = card ? RARITIES[card.rarity] : null;
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(124,58,237,0.25), transparent 65%)" }} />

      {phase === "opening" && (
        <div className="relative flex flex-col items-center">
          <div
            className="w-40 h-56 rounded-2xl relative flex items-center justify-center animate-cardspin"
            style={{
              background: "linear-gradient(160deg,#1e1b4b,#0b0b1e)",
              border: "2px solid #6d28d9",
              boxShadow: "0 0 50px rgba(124,58,237,0.65)",
            }}
          >
            <Star size={40} className="text-purple-300 animate-pulse" />
          </div>
          <p className="text-purple-300 text-sm font-semibold mt-8 tracking-widest">ОТКРЫТИЕ КАРТЫ...</p>
        </div>
      )}

      {phase === "revealed" && card && (
        <div className="relative flex flex-col items-center px-6 w-full max-w-sm animate-cardpop">
          <div
            className="w-full rounded-3xl p-5 relative"
            style={{
              background: `linear-gradient(160deg, ${r.grad[0]}, ${r.grad[1]})`,
              border: `2px solid ${r.border}`,
              boxShadow: `0 0 60px ${r.glow}`,
            }}
          >
            <div className="flex justify-center"><Avatar name={card.name} rarity={card.rarity} size={110} /></div>
            <div className="text-center mt-3">
              <RarityBadge rarity={card.rarity} size="md" />
              <h2 className="text-xl font-black text-white mt-2">{card.name}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.series}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[["Сила", card.stats.power], ["Защита", card.stats.defense], ["Скорость", card.stats.speed], ["Интеллект", card.stats.intel]].map(([l, v]) => (
                <div key={l} className="bg-black/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{l}</span>
                  <span className="text-xs font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full mt-5">
            <button onClick={onAddToCollection} className="w-full rounded-2xl py-3 font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
              В коллекцию
            </button>
            <div className="flex gap-2">
              <button onClick={onSell} className="flex-1 rounded-2xl py-2.5 font-semibold text-xs text-slate-200 bg-slate-800/80">
                Продать ({Math.round(card.cost / 4)} 🪙)
              </button>
              <button onClick={onClose} className="flex-1 rounded-2xl py-2.5 font-semibold text-xs text-slate-400 bg-slate-900/80">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cardspin { 0% { transform: rotateY(0deg) scale(0.9);} 50% { transform: rotateY(180deg) scale(1.05);} 100% { transform: rotateY(360deg) scale(0.9);} }
        .animate-cardspin { animation: cardspin 1.4s ease-in-out infinite; }
        @keyframes cardpop { 0% { transform: scale(0.7); opacity: 0;} 100% { transform: scale(1); opacity: 1;} }
        .animate-cardpop { animation: cardpop 0.4s cubic-bezier(.2,1.4,.4,1); }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  ТОСТ                                                                 */
/* -------------------------------------------------------------------- */

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg animate-toastin">
      {message}
      <style>{`@keyframes toastin { 0% { transform: translate(-50%,-12px); opacity:0;} 100% { transform: translate(-50%,0); opacity:1;} } .animate-toastin { animation: toastin 0.25s ease-out; }`}</style>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  НАВИГАЦИЯ                                                            */
/* -------------------------------------------------------------------- */

const NAV_ITEMS = [
  { key: "home", label: "Главная", icon: Home },
  { key: "characters", label: "Персонажи", icon: Users },
  { key: "games", label: "Игры", icon: Gamepad2 },
  { key: "collection", label: "Коллекция", icon: Layers },
  { key: "profile", label: "Профиль", icon: User },
];

function BottomNav({ active, onNav }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-800">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button key={item.key} onClick={() => onNav(item.key)} className="flex flex-col items-center gap-1 py-2.5 relative">
              {isActive && <span className="absolute inset-x-3 top-0.5 bottom-0.5 rounded-xl bg-purple-600/15" />}
              <item.icon size={19} className="relative" style={{ color: isActive ? "#c084fc" : "#64748b" }} />
              <span className="relative text-[10px]" style={{ color: isActive ? "#c084fc" : "#64748b" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  APP                                                                  */
/* -------------------------------------------------------------------- */

function OracleScreen({ onBack }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const data = await api.askOracle(question.trim());
      setAnswer(data.answer || "Оракул молчит.");
    } catch (e) {
      setAnswer(e.message || "Оракул сейчас отдыхает, попробуйте позже.");
    } finally { setLoading(false); }
  };
  return (
    <Screen title="Оракул Хроник" onBack={onBack}>
      <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 mb-4">
        <div className="flex items-center gap-3 mb-2"><Brain size={22}/><div className="font-bold">Лорный помощник</div></div>
        <div className="text-sm text-slate-400">Оракул отвечает только по открытым данным вселенной.</div>
      </div>
      {answer && <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 mb-4 text-sm leading-6">{answer}</div>}
      <textarea value={question} onChange={e=>setQuestion(e.target.value.slice(0,500))} placeholder="Спроси про персонажа или серию…" className="w-full h-28 rounded-2xl bg-slate-900 border border-slate-800 p-4 outline-none resize-none" />
      <button onClick={ask} disabled={loading || !question.trim()} className="w-full mt-3 rounded-2xl bg-violet-600 disabled:opacity-50 py-3 font-bold">{loading ? "Оракул думает…" : "Спросить"}</button>
    </Screen>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState({ nickname: "Гость_4821", level: 12, xp: 340, coins: 1250, crystals: 48 });
  const [collection, setCollection] = useState({});
  const [recentPulls, setRecentPulls] = useState([]);
  const [lastPullTime, setLastPullTime] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [pullPhase, setPullPhase] = useState(null); // null | opening | revealed
  const [pullCard, setPullCard] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [toast, setToast] = useState("");
  const [sound, setSound] = useState({ music: true, sfx: true });
  const toastTimer = useRef(null);

  const [loadingCollection, setLoadingCollection] = useState(true);
  const [pullLoading, setPullLoading] = useState(false);

  // Claude: баланс и коллекция теперь приходят только с сервера
  useEffect(() => {
    api
      .getCollection()
      .then((data) => {
        setUser((u) => ({
          ...u,
          nickname: data.nickname ?? u.nickname,
          level: data.level ?? u.level,
          xp: data.xp ?? u.xp,
          coins: data.coins ?? u.coins,
          crystals: data.crystals ?? u.crystals,
        }));
        const map = {};
        (data.cards || []).forEach((c) => { map[c.characterId] = c.count; });
        setCollection(map);
        if (data.cooldownEndsAt) setLastPullTime(data.cooldownEndsAt - PULL_COOLDOWN_MS);
      })
      .catch(() => showToast("Нет связи с сервером — демо-режим"))
      .finally(() => setLoadingCollection(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const left = PULL_COOLDOWN_MS - (Date.now() - lastPullTime);
      setCooldownLeft(Math.max(0, left));
    }, 250);
    return () => clearInterval(t);
  }, [lastPullTime]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  };

  const addToCollection = (character, amount = 1) => {
    setCollection((prev) => ({ ...prev, [character.id]: (prev[character.id] || 0) + amount }));
  };

  const sellCharacter = async (character) => {
    try {
      const data = await api.sellCard(character.id);
      if (data.cards) {
        const map = {};
        data.cards.forEach((c) => { map[c.characterId] = c.count; });
        setCollection(map);
      } else {
        setCollection((prev) => {
          const next = { ...prev };
          if (next[character.id] > 0) next[character.id] -= 1;
          return next;
        });
      }
      if (typeof data.coins === "number") setUser((u) => ({ ...u, coins: data.coins }));
      showToast(`Продано за ${Math.round(character.cost / 4)} 🪙`);
    } catch (e) {
      showToast(e.message || "Не удалось продать карту");
    }
  };

  // Claude: карта, кулдаун и цена паков теперь проверяются сервером, не клиентом
  const startPull = async () => {
    if (cooldownLeft > 0 || pullLoading) return;
    setPullLoading(true);
    try {
      const data = await api.pullCard();
      const character = CHARACTERS.find((c) => c.id === data.characterId) || data.character || pullRandomCard();
      setPullCard(character);
      setPullPhase("opening");
      setLastPullTime(data.cooldownEndsAt ? data.cooldownEndsAt - PULL_COOLDOWN_MS : Date.now());
      if (typeof data.coins === "number") setUser((u) => ({ ...u, coins: data.coins, crystals: data.crystals ?? u.crystals }));
      setTimeout(() => setPullPhase("revealed"), 1600);
    } catch (e) {
      showToast(e.message || "Не удалось получить карту");
    } finally {
      setPullLoading(false);
    }
  };

  const finishPullAdd = () => {
    // Карта уже начислена сервером в /api/cards/pull — здесь только локально отражаем результат
    addToCollection(pullCard);
    setRecentPulls((prev) => [pullCard, ...prev].slice(0, 8));
    setUser((u) => ({ ...u, xp: u.xp + 25 }));
    showToast(`${pullCard.name} добавлен в коллекцию`);
    setPullPhase(null);
    setPullCard(null);
  };

  const finishPullSell = async () => {
    try {
      const data = await api.sellCard(pullCard.id);
      if (typeof data.coins === "number") setUser((u) => ({ ...u, coins: data.coins }));
      showToast(`Продано за ${Math.round(pullCard.cost / 4)} 🪙`);
    } catch (e) {
      showToast(e.message || "Не удалось продать карту");
    } finally {
      setRecentPulls((prev) => [pullCard, ...prev].slice(0, 8));
      setPullPhase(null);
      setPullCard(null);
    }
  };

  const closePull = () => { setPullPhase(null); setPullCard(null); };

  const buyPack = async (pack) => {
    if (user.coins < pack.price || pullLoading) return;
    setPullLoading(true);
    try {
      const data = await api.buyPack(pack.id);
      const character = CHARACTERS.find((c) => c.id === data.characterId) || data.character;
      setPullCard(character);
      setPullPhase("opening");
      if (typeof data.coins === "number") setUser((u) => ({ ...u, coins: data.coins }));
      setTimeout(() => setPullPhase("revealed"), 1600);
    } catch (e) {
      showToast(e.message || "Не удалось купить пакет");
    } finally {
      setPullLoading(false);
    }
  };

  const handleGameFinish = (delta, serverCoins) => {
    setUser((u) => ({ ...u, coins: typeof serverCoins === "number" ? serverCoins : Math.max(0, u.coins + delta) }));
  };

  const nav = (key) => setScreen(key);

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#020207" }}>
      <div className="w-full max-w-md relative" style={{ color: "white", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {screen === "home" && (
          <HomeScreen
            user={user} collection={collection} cooldownLeft={cooldownLeft}
            onPull={startPull} onOpenCharacter={setSelectedCharacter} onNav={nav}
            recentPulls={recentPulls} pullLoading={pullLoading}
          />
        )}
        {screen === "characters" && <CharactersScreen collection={collection} onOpenCharacter={setSelectedCharacter} />}
        {screen === "collection" && <CollectionScreen collection={collection} onOpenCharacter={setSelectedCharacter} />}
        {screen === "games" && <GamesScreen onPlay={setActiveGame} />}
        {screen === "profile" && <ProfileScreen user={user} collection={collection} onNav={nav} />}
        {screen === "achievements" && <AchievementsScreen collection={collection} onBack={() => nav("home")} />}
        {screen === "shop" && <ShopScreen coins={user.coins} onBuyPack={buyPack} onBack={() => nav("home")} />}
        {screen === "trade" && <ComingSoonScreen title="Обмен картами" onBack={() => nav("home")} />}
        {screen === "notifications" && <ComingSoonScreen title="Уведомления" onBack={() => nav("home")} note="Push-уведомления появятся вместе с серверной частью." />}
        {screen === "settings" && <SettingsScreen onBack={() => nav("profile")} sound={sound} setSound={setSound} />}
        {screen === "oracle" && <OracleScreen onBack={() => nav("home")} />}

        <BottomNav active={["achievements", "shop", "trade", "notifications", "settings"].includes(screen) ? "" : screen} onNav={nav} />

        <CharacterModal
          character={selectedCharacter}
          count={selectedCharacter ? collection[selectedCharacter.id] || 0 : 0}
          onClose={() => setSelectedCharacter(null)}
          onSell={(c) => { sellCharacter(c); setSelectedCharacter(null); }}
        />

        {activeGame && (
          <GameDetailModal game={activeGame} coins={user.coins} onClose={() => setActiveGame(null)} onFinishMatch={handleGameFinish} />
        )}

        {pullPhase && (
          <PullModal
            phase={pullPhase} card={pullCard}
            onAddToCollection={finishPullAdd}
            onSell={finishPullSell}
            onClose={closePull}
          />
        )}

        <Toast message={toast} />
      </div>
    </div>
  );
}
