import { type CSSProperties, useEffect, useMemo, useState } from "react";
import "./styles.css";

type Manager = {
  id: string;
  name: string;
};

type Country = {
  id: string;
  name: string;
  group: string;
  confederation: "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";
  fifaRank?: number;
  flag: string;
  host?: boolean;
  debut?: boolean;
};

type Pick = {
  id: string;
  round: number;
  slot: number;
  managerId: string;
  countryId: string;
  createdAt: number;
};

type DraftState = {
  leagueName: string;
  managers: Manager[];
  picks: Pick[];
};

type ShareStatus = "idle" | "copied" | "error";

const STORAGE_KEY = "world-cup-draft-state-v1";
const ROOM_HASH_KEY = "room";

const DEFAULT_MANAGERS: Manager[] = [
  { id: "m1", name: "Devon" },
  { id: "m2", name: "Kai" },
  { id: "m3", name: "Alex" },
  { id: "m4", name: "Spencer" },
  { id: "m5", name: "Josh" },
  { id: "m6", name: "Jeremy" },
  { id: "m7", name: "Matt" },
  { id: "m8", name: "Dan" },
];

const COUNTRIES: Country[] = [
  { id: "mex", name: "Mexico", group: "A", confederation: "CONCACAF", fifaRank: 15, flag: "🇲🇽", host: true },
  { id: "rsa", name: "South Africa", group: "A", confederation: "CAF", fifaRank: 61, flag: "🇿🇦" },
  { id: "kor", name: "South Korea", group: "A", confederation: "AFC", fifaRank: 22, flag: "🇰🇷" },
  { id: "cze", name: "Czech Republic", group: "A", confederation: "UEFA", fifaRank: 44, flag: "🇨🇿" },
  { id: "can", name: "Canada", group: "B", confederation: "CONCACAF", fifaRank: 27, flag: "🇨🇦", host: true },
  { id: "bih", name: "Bosnia and Herzegovina", group: "B", confederation: "UEFA", fifaRank: 71, flag: "🇧🇦" },
  { id: "qat", name: "Qatar", group: "B", confederation: "AFC", fifaRank: 51, flag: "🇶🇦" },
  { id: "sui", name: "Switzerland", group: "B", confederation: "UEFA", fifaRank: 17, flag: "🇨🇭" },
  { id: "bra", name: "Brazil", group: "C", confederation: "CONMEBOL", fifaRank: 5, flag: "🇧🇷" },
  { id: "mar", name: "Morocco", group: "C", confederation: "CAF", fifaRank: 11, flag: "🇲🇦" },
  { id: "hai", name: "Haiti", group: "C", confederation: "CONCACAF", fifaRank: 84, flag: "🇭🇹" },
  { id: "sco", name: "Scotland", group: "C", confederation: "UEFA", fifaRank: 36, flag: "🏴" },
  { id: "usa", name: "United States", group: "D", confederation: "CONCACAF", fifaRank: 14, flag: "🇺🇸", host: true },
  { id: "par", name: "Paraguay", group: "D", confederation: "CONMEBOL", fifaRank: 39, flag: "🇵🇾" },
  { id: "aus", name: "Australia", group: "D", confederation: "AFC", fifaRank: 26, flag: "🇦🇺" },
  { id: "tur", name: "Turkey", group: "D", confederation: "UEFA", fifaRank: 25, flag: "🇹🇷" },
  { id: "ger", name: "Germany", group: "E", confederation: "UEFA", fifaRank: 9, flag: "🇩🇪" },
  { id: "cuw", name: "Curacao", group: "E", confederation: "CONCACAF", fifaRank: 82, flag: "🇨🇼", debut: true },
  { id: "civ", name: "Ivory Coast", group: "E", confederation: "CAF", fifaRank: 42, flag: "🇨🇮" },
  { id: "ecu", name: "Ecuador", group: "E", confederation: "CONMEBOL", fifaRank: 23, flag: "🇪🇨" },
  { id: "ned", name: "Netherlands", group: "F", confederation: "UEFA", fifaRank: 7, flag: "🇳🇱" },
  { id: "jpn", name: "Japan", group: "F", confederation: "AFC", fifaRank: 18, flag: "🇯🇵" },
  { id: "swe", name: "Sweden", group: "F", confederation: "UEFA", flag: "🇸🇪" },
  { id: "tun", name: "Tunisia", group: "F", confederation: "CAF", fifaRank: 40, flag: "🇹🇳" },
  { id: "bel", name: "Belgium", group: "G", confederation: "UEFA", fifaRank: 8, flag: "🇧🇪" },
  { id: "egy", name: "Egypt", group: "G", confederation: "CAF", fifaRank: 34, flag: "🇪🇬" },
  { id: "irn", name: "Iran", group: "G", confederation: "AFC", fifaRank: 20, flag: "🇮🇷" },
  { id: "nzl", name: "New Zealand", group: "G", confederation: "OFC", fifaRank: 86, flag: "🇳🇿" },
  { id: "esp", name: "Spain", group: "H", confederation: "UEFA", fifaRank: 1, flag: "🇪🇸" },
  { id: "cpv", name: "Cape Verde", group: "H", confederation: "CAF", fifaRank: 68, flag: "🇨🇻", debut: true },
  { id: "ksa", name: "Saudi Arabia", group: "H", confederation: "AFC", fifaRank: 60, flag: "🇸🇦" },
  { id: "uru", name: "Uruguay", group: "H", confederation: "CONMEBOL", fifaRank: 16, flag: "🇺🇾" },
  { id: "fra", name: "France", group: "I", confederation: "UEFA", fifaRank: 3, flag: "🇫🇷" },
  { id: "sen", name: "Senegal", group: "I", confederation: "CAF", fifaRank: 19, flag: "🇸🇳" },
  { id: "irq", name: "Iraq", group: "I", confederation: "AFC", flag: "🇮🇶" },
  { id: "nor", name: "Norway", group: "I", confederation: "UEFA", fifaRank: 29, flag: "🇳🇴" },
  { id: "arg", name: "Argentina", group: "J", confederation: "CONMEBOL", fifaRank: 2, flag: "🇦🇷" },
  { id: "alg", name: "Algeria", group: "J", confederation: "CAF", fifaRank: 35, flag: "🇩🇿" },
  { id: "aut", name: "Austria", group: "J", confederation: "UEFA", fifaRank: 24, flag: "🇦🇹" },
  { id: "jor", name: "Jordan", group: "J", confederation: "AFC", fifaRank: 66, flag: "🇯🇴", debut: true },
  { id: "por", name: "Portugal", group: "K", confederation: "UEFA", fifaRank: 6, flag: "🇵🇹" },
  { id: "cod", name: "DR Congo", group: "K", confederation: "CAF", flag: "🇨🇩" },
  { id: "uzb", name: "Uzbekistan", group: "K", confederation: "AFC", fifaRank: 50, flag: "🇺🇿", debut: true },
  { id: "col", name: "Colombia", group: "K", confederation: "CONMEBOL", fifaRank: 13, flag: "🇨🇴" },
  { id: "eng", name: "England", group: "L", confederation: "UEFA", fifaRank: 4, flag: "🏴" },
  { id: "cro", name: "Croatia", group: "L", confederation: "UEFA", fifaRank: 10, flag: "🇭🇷" },
  { id: "gha", name: "Ghana", group: "L", confederation: "CAF", fifaRank: 72, flag: "🇬🇭" },
  { id: "pan", name: "Panama", group: "L", confederation: "CONCACAF", fifaRank: 30, flag: "🇵🇦" },
];

const GROUPS = Array.from(new Set(COUNTRIES.map((country) => country.group)));
const CONFEDERATIONS = Array.from(new Set(COUNTRIES.map((country) => country.confederation)));

const initialState: DraftState = {
  leagueName: "Basement World Cup League",
  managers: DEFAULT_MANAGERS,
  picks: [],
};

function isValidPick(candidate: unknown): candidate is Pick {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const pick = candidate as Pick;
  return (
    typeof pick.id === "string" &&
    typeof pick.round === "number" &&
    typeof pick.slot === "number" &&
    typeof pick.managerId === "string" &&
    typeof pick.countryId === "string" &&
    typeof pick.createdAt === "number"
  );
}

function normalizeDraftState(candidate: unknown): DraftState | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const draft = candidate as Partial<DraftState>;

  if (typeof draft.leagueName !== "string" || !Array.isArray(draft.managers) || !Array.isArray(draft.picks)) {
    return null;
  }

  const managers = draft.managers
    .filter((manager): manager is Manager => {
      return Boolean(manager && typeof manager === "object" && typeof manager.id === "string" && typeof manager.name === "string");
    })
    .slice(0, 8);

  const picks = draft.picks.filter(isValidPick);

  if (managers.length < 2) {
    return null;
  }

  return {
    leagueName: draft.leagueName,
    managers,
    picks,
  };
}

function encodeRoomState(draft: DraftState) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decodeRoomState(token: string) {
  try {
    const paddedToken = token.replaceAll("-", "+").replaceAll("_", "/");
    const padding = "=".repeat((4 - (paddedToken.length % 4)) % 4);
    const binary = atob(paddedToken + padding);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return normalizeDraftState(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

function getRoomTokenFromHash() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  return params.get(ROOM_HASH_KEY);
}

function buildRoomLink(token: string) {
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${ROOM_HASH_KEY}=${token}`;
}

function extractRoomToken(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    try {
      const url = new URL(trimmedValue);
      const token = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash).get(ROOM_HASH_KEY);
      return token ?? null;
    } catch {
      return null;
    }
  }

  if (trimmedValue.includes("=")) {
    const params = new URLSearchParams(trimmedValue.startsWith("#") ? trimmedValue.slice(1) : trimmedValue);
    return params.get(ROOM_HASH_KEY);
  }

  return trimmedValue;
}

function loadState(): DraftState {
  const roomToken = getRoomTokenFromHash();

  if (roomToken) {
    const roomState = decodeRoomState(roomToken);
    if (roomState) {
      return roomState;
    }
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return initialState;
  }

  try {
    return normalizeDraftState(JSON.parse(stored)) ?? initialState;
  } catch {
    return initialState;
  }
}

function saveLocalDraft(draft: DraftState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function getManagerForPick(managers: Manager[], pickIndex: number) {
  const roundIndex = Math.floor(pickIndex / managers.length);
  const slotIndex = pickIndex % managers.length;
  const snakeIndex = roundIndex % 2 === 0 ? slotIndex : managers.length - 1 - slotIndex;

  return {
    manager: managers[snakeIndex],
    round: roundIndex + 1,
    slot: slotIndex + 1,
  };
}

function App() {
  const [draft, setDraft] = useState<DraftState>(loadState);
  const [managerDraft, setManagerDraft] = useState(draft.managers.map((manager) => manager.name).join(", "));
  const [query, setQuery] = useState("");
  const [poolView, setPoolView] = useState<"group" | "confederation" | "rank">("group");
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [roomInput, setRoomInput] = useState("");

  useEffect(() => {
    saveLocalDraft(draft);
  }, [draft]);

  useEffect(() => {
    setManagerDraft(draft.managers.map((manager) => manager.name).join(", "));
  }, [draft.managers]);

  const roomToken = useMemo(() => encodeRoomState(draft), [draft]);
  const roomLink = useMemo(() => buildRoomLink(roomToken), [roomToken]);

  useEffect(() => {
    const nextUrl = `${window.location.pathname}${window.location.search}#${ROOM_HASH_KEY}=${roomToken}`;
    window.history.replaceState(null, "", nextUrl);
  }, [roomToken]);

  useEffect(() => {
    if (shareStatus !== "copied") {
      return;
    }

    const timerId = window.setTimeout(() => setShareStatus("idle"), 2000);
    return () => window.clearTimeout(timerId);
  }, [shareStatus]);

  const commitDraft = (updater: (current: DraftState) => DraftState) => {
    setDraft((current) => {
      const nextDraft = updater(current);
      saveLocalDraft(nextDraft);
      return nextDraft;
    });
  };

  const draftedIds = useMemo(() => new Set(draft.picks.map((pick) => pick.countryId)), [draft.picks]);
  const nextPick = getManagerForPick(draft.managers, draft.picks.length);
  const totalRounds = Math.ceil(COUNTRIES.length / draft.managers.length);

  const availableCountries = useMemo(() => {
    return COUNTRIES.filter((country) => {
      const normalizedQuery = query.toLowerCase();
      const matchesQuery =
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.group.toLowerCase().includes(normalizedQuery) ||
        country.confederation.toLowerCase().includes(normalizedQuery);
      return !draftedIds.has(country.id) && matchesQuery;
    }).sort((first, second) => {
      if (poolView === "rank") {
        return (first.fifaRank ?? 999) - (second.fifaRank ?? 999);
      }

      if (poolView === "confederation") {
        return first.confederation.localeCompare(second.confederation) || first.group.localeCompare(second.group);
      }

      return first.group.localeCompare(second.group) || (first.fifaRank ?? 999) - (second.fifaRank ?? 999);
    });
  }, [draftedIds, poolView, query]);

  const groupedCountries = useMemo(() => {
    const getHeading = (country: Country) => {
      if (poolView === "confederation") {
        return country.confederation;
      }

      if (poolView === "rank") {
        if (!country.fifaRank) {
          return "Unranked playoff qualifiers";
        }
        return country.fifaRank <= 12 ? "Top seeds" : country.fifaRank <= 30 ? "Contenders" : "Chasers";
      }

      return `Group ${country.group}`;
    };

    return availableCountries.reduce<Record<string, Country[]>>((sections, country) => {
      const heading = getHeading(country);
      return { ...sections, [heading]: [...(sections[heading] ?? []), country] };
    }, {});
  }, [availableCountries, poolView]);

  const picksByManager = useMemo(() => {
    return draft.managers.map((manager) => ({
      manager,
      picks: draft.picks
        .filter((pick) => pick.managerId === manager.id)
        .map((pick) => COUNTRIES.find((country) => country.id === pick.countryId))
        .filter(Boolean) as Country[],
    }));
  }, [draft.managers, draft.picks]);

  const draftCountry = (country: Country) => {
    if (draftedIds.has(country.id) || !nextPick.manager) {
      return;
    }

    const makePick = (currentDraft: DraftState): Pick | null => {
      const remoteNextPick = getManagerForPick(currentDraft.managers, currentDraft.picks.length);
      if (!remoteNextPick.manager) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        round: remoteNextPick.round,
        slot: remoteNextPick.slot,
        managerId: remoteNextPick.manager.id,
        countryId: country.id,
        createdAt: Date.now(),
      };
    };

    commitDraft((current) => {
      const pick = makePick(current);
      return pick ? { ...current, picks: [...current.picks, pick] } : current;
    });
  };

  const updateManagers = () => {
    const names = managerDraft
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (names.length < 2) {
      return;
    }

    commitDraft((current) => ({
      ...current,
      managers: names.map((name, index) => ({ id: `m${index + 1}`, name })),
      picks: [],
    }));
  };

  const undoPick = () => {
    commitDraft((current) => ({ ...current, picks: current.picks.slice(0, -1) }));
  };

  const resetDraft = () => {
    commitDraft((current) => ({ ...current, picks: [] }));
  };

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  };

  const loadRoomFromInput = () => {
    const token = extractRoomToken(roomInput);

    if (!token) {
      return;
    }

    const roomState = decodeRoomState(token);

    if (!roomState) {
      setShareStatus("error");
      return;
    }

    setDraft(roomState);
    saveLocalDraft(roomState);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${ROOM_HASH_KEY}=${token}`);
    setShareStatus("idle");
  };

  const startFreshRoom = () => {
    setDraft(initialState);
    saveLocalDraft(initialState);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setRoomInput("");
    setShareStatus("idle");
  };

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">World Cup 2026</p>
          <h1>{draft.leagueName}</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={undoPick} disabled={!draft.picks.length}>
            Undo
          </button>
          <button className="danger-button" onClick={resetDraft} disabled={!draft.picks.length}>
            Reset
          </button>
        </div>
      </section>

      <section className="status-grid" aria-label="Draft status">
        <div className="status-panel current-pick">
          <span>On the clock</span>
          <strong>{nextPick.manager?.name ?? "Draft complete"}</strong>
          <small>
            Round {Math.min(nextPick.round, totalRounds)} of {totalRounds} / Pick {draft.picks.length + 1}
          </small>
        </div>
        <div className="status-panel">
          <span>Countries left</span>
          <strong>{COUNTRIES.length - draft.picks.length}</strong>
          <small>{draft.picks.length} drafted</small>
        </div>
        <div className="status-panel">
          <span>Draft format</span>
          <strong>Snake</strong>
          <small>{draft.managers.length} managers</small>
        </div>
        <div className={shareStatus === "copied" ? "status-panel sync-panel live" : "status-panel sync-panel"}>
          <span>Room link</span>
          <strong>{shareStatus === "copied" ? "Copied" : "Share snapshot"}</strong>
          <small>
            {shareStatus === "error"
              ? "Clipboard blocked. Copy the URL from the address bar."
              : "Open this link on another device to load the same draft."}
          </small>
          <input
            className="room-link-input"
            readOnly
            value={roomLink}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="Shareable room link"
          />
          <button className="ghost-button" onClick={copyRoomLink}>
            Copy link
          </button>
          <label className="room-join-field">
            Join room
            <input
              value={roomInput}
              onChange={(event) => setRoomInput(event.target.value)}
              placeholder="Paste a shared link or room token"
              aria-label="Join shared room"
            />
          </label>
          <div className="room-actions">
            <button className="ghost-button" onClick={loadRoomFromInput} disabled={!roomInput.trim()}>
              Open room
            </button>
            <button className="ghost-button" onClick={startFreshRoom}>
              New room
            </button>
          </div>
        </div>
      </section>

      <section className="workspace">
        <aside className="league-panel">
          <div className="panel-heading">
            <h2>League</h2>
            <span>Local room</span>
          </div>

          <label>
            League name
            <input
              value={draft.leagueName}
              onChange={(event) => commitDraft((current) => ({ ...current, leagueName: event.target.value }))}
            />
          </label>

          <label>
            Managers
            <textarea value={managerDraft} onChange={(event) => setManagerDraft(event.target.value)} />
          </label>

          <button className="primary-button" onClick={updateManagers}>
            Apply draft order
          </button>

          <div className="order-list">
            {draft.managers.map((manager, index) => (
              <div className={manager.id === nextPick.manager?.id ? "order-row active" : "order-row"} key={manager.id}>
                <span>{index + 1}</span>
                <strong>{manager.name}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="board-panel">
          <div className="panel-heading">
            <h2>Draft Board</h2>
            <span>{totalRounds} rounds</span>
          </div>

          <div className="board-grid" style={{ "--manager-count": draft.managers.length } as CSSProperties}>
            {Array.from({ length: totalRounds }).map((_, roundIndex) =>
              draft.managers.map((manager, managerIndex) => {
                const snakeManager = roundIndex % 2 === 0 ? manager : draft.managers[draft.managers.length - 1 - managerIndex];
                const pick = draft.picks.find((item) => item.round === roundIndex + 1 && item.managerId === snakeManager.id);
                const country = COUNTRIES.find((item) => item.id === pick?.countryId);

                return (
                  <article className={country ? "board-cell filled" : "board-cell"} key={`${roundIndex}-${manager.id}`}>
                    <span>
                      R{roundIndex + 1}.{managerIndex + 1}
                    </span>
                    <strong>{country?.name ?? snakeManager.name}</strong>
                    <small>
                      {country
                        ? `Group ${country.group} / ${country.confederation}${country.fifaRank ? ` / Rank ${country.fifaRank}` : ""}`
                        : "Waiting"}
                    </small>
                  </article>
                );
              }),
            )}
          </div>
        </section>
      </section>

      <section className="country-section">
        <div className="panel-heading">
          <h2>Country Pool</h2>
          <input
            className="search-input"
            placeholder="Search teams, groups, confederations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="pool-controls" role="group" aria-label="Country pool organization">
          <button className={poolView === "group" ? "active" : ""} onClick={() => setPoolView("group")}>
            Groups
          </button>
          <button className={poolView === "confederation" ? "active" : ""} onClick={() => setPoolView("confederation")}>
            Confederations
          </button>
          <button className={poolView === "rank" ? "active" : ""} onClick={() => setPoolView("rank")}>
            FIFA rank
          </button>
        </div>

        <div className="country-sections">
          {Object.entries(groupedCountries).map(([heading, countries]) => (
            <section className="country-group" key={heading}>
              <div className="country-group-heading">
                <h3>{heading}</h3>
                <span>{countries.length} available</span>
              </div>
              <div className="country-grid">
                {countries.map((country) => (
                  <button className="country-card" key={country.id} onClick={() => draftCountry(country)}>
                    <span className="flag" aria-hidden="true">
                      {country.flag}
                    </span>
                    <span className="country-code">Group {country.group}</span>
                    <strong>{country.name}</strong>
                    <small>{country.confederation}</small>
                    <span className="meta-row">
                      <span>{country.fifaRank ? `Rank ${country.fifaRank}` : "Rank TBD"}</span>
                      {country.host ? <span>Host</span> : null}
                      {country.debut ? <span>Debut</span> : null}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="roster-section">
        <div className="panel-heading">
          <h2>Rosters</h2>
          <span>Auto-saved in this browser</span>
        </div>
        <div className="roster-grid">
          {picksByManager.map(({ manager, picks }) => (
            <article className="roster-card" key={manager.id}>
              <h3>{manager.name}</h3>
              {picks.length ? (
                <ol>
                  {picks.map((country) => (
                    <li key={country.id}>
                      <span>{country.name}</span>
                      <small>{country.fifaRank ? `#${country.fifaRank}` : country.group}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No picks yet.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
