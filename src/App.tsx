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
  region: string;
  rating: number;
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

const STORAGE_KEY = "world-cup-draft-state-v1";

const DEFAULT_MANAGERS: Manager[] = [
  { id: "m1", name: "Alex" },
  { id: "m2", name: "Casey" },
  { id: "m3", name: "Jordan" },
  { id: "m4", name: "Taylor" },
];

const COUNTRIES: Country[] = [
  { id: "arg", name: "Argentina", group: "Pot A", region: "CONMEBOL", rating: 96 },
  { id: "fra", name: "France", group: "Pot A", region: "UEFA", rating: 95 },
  { id: "bra", name: "Brazil", group: "Pot A", region: "CONMEBOL", rating: 94 },
  { id: "eng", name: "England", group: "Pot A", region: "UEFA", rating: 93 },
  { id: "esp", name: "Spain", group: "Pot A", region: "UEFA", rating: 92 },
  { id: "por", name: "Portugal", group: "Pot A", region: "UEFA", rating: 91 },
  { id: "ned", name: "Netherlands", group: "Pot A", region: "UEFA", rating: 90 },
  { id: "ger", name: "Germany", group: "Pot A", region: "UEFA", rating: 89 },
  { id: "bel", name: "Belgium", group: "Pot B", region: "UEFA", rating: 88 },
  { id: "uru", name: "Uruguay", group: "Pot B", region: "CONMEBOL", rating: 87 },
  { id: "cro", name: "Croatia", group: "Pot B", region: "UEFA", rating: 86 },
  { id: "ita", name: "Italy", group: "Pot B", region: "UEFA", rating: 85 },
  { id: "col", name: "Colombia", group: "Pot B", region: "CONMEBOL", rating: 84 },
  { id: "usa", name: "United States", group: "Pot B", region: "CONCACAF", rating: 83 },
  { id: "mex", name: "Mexico", group: "Pot B", region: "CONCACAF", rating: 82 },
  { id: "sui", name: "Switzerland", group: "Pot B", region: "UEFA", rating: 81 },
  { id: "mar", name: "Morocco", group: "Pot C", region: "CAF", rating: 80 },
  { id: "jpn", name: "Japan", group: "Pot C", region: "AFC", rating: 79 },
  { id: "den", name: "Denmark", group: "Pot C", region: "UEFA", rating: 78 },
  { id: "sen", name: "Senegal", group: "Pot C", region: "CAF", rating: 77 },
  { id: "kor", name: "South Korea", group: "Pot C", region: "AFC", rating: 76 },
  { id: "ecu", name: "Ecuador", group: "Pot C", region: "CONMEBOL", rating: 75 },
  { id: "aut", name: "Austria", group: "Pot C", region: "UEFA", rating: 74 },
  { id: "aus", name: "Australia", group: "Pot C", region: "AFC", rating: 73 },
  { id: "can", name: "Canada", group: "Pot D", region: "CONCACAF", rating: 72 },
  { id: "nga", name: "Nigeria", group: "Pot D", region: "CAF", rating: 71 },
  { id: "tur", name: "Turkey", group: "Pot D", region: "UEFA", rating: 70 },
  { id: "pol", name: "Poland", group: "Pot D", region: "UEFA", rating: 69 },
  { id: "ukr", name: "Ukraine", group: "Pot D", region: "UEFA", rating: 68 },
  { id: "egy", name: "Egypt", group: "Pot D", region: "CAF", rating: 67 },
  { id: "par", name: "Paraguay", group: "Pot D", region: "CONMEBOL", rating: 66 },
  { id: "chi", name: "Chile", group: "Pot D", region: "CONMEBOL", rating: 65 },
];

const initialState: DraftState = {
  leagueName: "Basement World Cup League",
  managers: DEFAULT_MANAGERS,
  picks: [],
};

function loadState(): DraftState {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return initialState;
  }

  try {
    const parsed = JSON.parse(stored) as DraftState;
    if (!parsed.managers?.length || !Array.isArray(parsed.picks)) {
      return initialState;
    }
    return parsed;
  } catch {
    return initialState;
  }
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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const draftedIds = useMemo(() => new Set(draft.picks.map((pick) => pick.countryId)), [draft.picks]);
  const nextPick = getManagerForPick(draft.managers, draft.picks.length);
  const totalRounds = Math.ceil(COUNTRIES.length / draft.managers.length);

  const availableCountries = useMemo(() => {
    return COUNTRIES.filter((country) => {
      const matchesQuery = country.name.toLowerCase().includes(query.toLowerCase());
      return !draftedIds.has(country.id) && matchesQuery;
    });
  }, [draftedIds, query]);

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

    const pick: Pick = {
      id: crypto.randomUUID(),
      round: nextPick.round,
      slot: nextPick.slot,
      managerId: nextPick.manager.id,
      countryId: country.id,
      createdAt: Date.now(),
    };

    setDraft((current) => ({ ...current, picks: [...current.picks, pick] }));
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

    setDraft((current) => ({
      ...current,
      managers: names.map((name, index) => ({ id: `m${index + 1}`, name })),
      picks: [],
    }));
  };

  const undoPick = () => {
    setDraft((current) => ({ ...current, picks: current.picks.slice(0, -1) }));
  };

  const resetDraft = () => {
    setDraft((current) => ({ ...current, picks: [] }));
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
              onChange={(event) => setDraft((current) => ({ ...current, leagueName: event.target.value }))}
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
                    <small>{country ? `${country.group} / ${country.region}` : "Waiting"}</small>
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
            placeholder="Search countries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="country-grid">
          {availableCountries.map((country) => (
            <button className="country-card" key={country.id} onClick={() => draftCountry(country)}>
              <span className="country-code">{country.id.toUpperCase()}</span>
              <strong>{country.name}</strong>
              <small>{country.region}</small>
              <meter min="0" max="100" value={country.rating} />
            </button>
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
                      <small>{country.rating}</small>
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
