import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const OWNER = process.env.OWNER;
const REPO = process.env.REPO;
const BRANCH = process.env.BRANCH ?? "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
const CONTENTS_URL = OWNER && REPO ? `https://api.github.com/repos/${OWNER}/${REPO}/contents/data.json` : null;

const initialState = {
  rooms: {},
};

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeRoomKey(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(trimmedValue)) {
    return null;
  }

  return trimmedValue;
}

function normalizeDraftState(candidate) {
  if (!isPlainObject(candidate)) {
    return null;
  }

  if (typeof candidate.leagueName !== "string" || !Array.isArray(candidate.managers) || !Array.isArray(candidate.picks)) {
    return null;
  }

  const managers = candidate.managers
    .filter((manager) => isPlainObject(manager) && typeof manager.id === "string" && typeof manager.name === "string")
    .slice(0, 8);

  if (managers.length < 2) {
    return null;
  }

  const picks = candidate.picks.filter(
    (pick) =>
      isPlainObject(pick) &&
      typeof pick.id === "string" &&
      typeof pick.round === "number" &&
      typeof pick.slot === "number" &&
      typeof pick.managerId === "string" &&
      typeof pick.countryId === "string" &&
      typeof pick.createdAt === "number",
  );

  return {
    leagueName: candidate.leagueName,
    managers,
    picks,
  };
}

function normalizeRoomStore(candidate) {
  if (!isPlainObject(candidate) || !isPlainObject(candidate.rooms)) {
    return { ...initialState };
  }

  const rooms = {};

  for (const [roomKey, draft] of Object.entries(candidate.rooms)) {
    const normalizedRoomKey = normalizeRoomKey(roomKey);
    const normalizedDraft = normalizeDraftState(draft);

    if (normalizedRoomKey && normalizedDraft) {
      rooms[normalizedRoomKey] = normalizedDraft;
    }
  }

  return { rooms };
}

function githubHeaders(extraHeaders = {}) {
  if (!GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "world-cup-draft-api",
    "X-GitHub-Api-Version": "2022-11-28",
    ...extraHeaders,
  };
}

async function readRoomStore() {
  if (!CONTENTS_URL) {
    throw new Error("Missing OWNER or REPO");
  }

  const response = await fetch(CONTENTS_URL, {
    headers: githubHeaders(),
  });

  if (response.status === 404) {
    return { store: { ...initialState }, sha: null };
  }

  if (!response.ok) {
    throw new Error(`GitHub read failed: ${response.status}`);
  }

  const file = await response.json();

  if (typeof file.content !== "string" || !file.content) {
    return { store: { ...initialState }, sha: file.sha ?? null };
  }

  const decoded = Buffer.from(file.content, "base64").toString("utf-8");
  return { store: normalizeRoomStore(JSON.parse(decoded)), sha: file.sha ?? null };
}

async function writeRoomStore(store, sha) {
  if (!CONTENTS_URL) {
    throw new Error("Missing OWNER or REPO");
  }

  const response = await fetch(CONTENTS_URL, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({
      message: "Update draft room data",
      content: Buffer.from(JSON.stringify(store, null, 2)).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub write failed: ${response.status}`);
  }

  return response.json();
}

async function updateRoomStore(update) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { store, sha } = await readRoomStore();
    const nextStore = normalizeRoomStore(update(store));

    try {
      await writeRoomStore(nextStore, sha);
      return nextStore;
    } catch (error) {
      if (attempt === 0) {
        continue;
      }

      throw error;
    }
  }

  return null;
}

app.use(
  cors({
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Room-Key"],
  }),
);
app.use(express.json({ limit: "256kb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/data", async (req, res) => {
  try {
    const roomKey = normalizeRoomKey(req.query.roomKey ?? req.get("X-Room-Key"));

    if (!roomKey) {
      return res.status(400).json({ error: "Valid roomKey is required" });
    }

    const { store } = await readRoomStore();
    res.json(store.rooms[roomKey] ?? { ...initialState });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/save", async (req, res) => {
  try {
    const roomKey = normalizeRoomKey(req.body?.roomKey ?? req.get("X-Room-Key"));
    const draft = normalizeDraftState(req.body?.draft);

    if (!roomKey) {
      return res.status(400).json({ error: "Valid roomKey is required" });
    }

    if (!draft) {
      return res.status(400).json({ error: "Valid draft payload is required" });
    }

    await updateRoomStore((current) => ({
      rooms: {
        ...current.rooms,
        [roomKey]: draft,
      },
    }));

    res.json({ ok: true, roomKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
