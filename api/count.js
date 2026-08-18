let cached = {
  username: null,
  userId: null,
  expiresAt: 0
};

const SEARCH_BASE = "https://tiktok.livecounts.io/user/search";
const STATS_BASE = "https://tiktok.livecounts.io/user/stats";

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0 (compatible; pemplexrl-live-counter/1.0)"
    },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
  return response.json();
}

async function resolveUser(username) {
  const now = Date.now();
  if (cached.username === username.toLowerCase() && cached.userId && cached.expiresAt > now) return cached.userId;

  const search = await getJson(`${SEARCH_BASE}/${encodeURIComponent(username)}`);
  const users = Array.isArray(search?.userData) ? search.userData : [];
  if (!users.length) throw new Error("TikTok user not found");

  const exact = users.find((u) => String(u?.id || "").toLowerCase() === username.toLowerCase());
  const selected = exact || users[0];
  const userId = String(selected?.userId || "");
  if (!userId) throw new Error("No TikTok user ID returned");

  cached = { username: username.toLowerCase(), userId, expiresAt: now + 6 * 60 * 60 * 1000 };
  return userId;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = Array.isArray(req.query.user) ? req.query.user[0] : req.query.user;
  const username = String(raw || "pemplexrl").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9._]{2,24}$/.test(username)) return res.status(400).json({ error: "Invalid TikTok username" });

  try {
    const userId = await resolveUser(username);
    const stats = await getJson(`${STATS_BASE}/${encodeURIComponent(userId)}`);
    const followerCount = Number(stats?.followerCount);
    if (!Number.isFinite(followerCount)) throw new Error("Follower count missing from upstream response");

    res.status(200).json({ username, userId, followerCount, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not load the live TikTok follower count right now." });
  }
}
