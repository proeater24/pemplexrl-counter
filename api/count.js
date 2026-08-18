const USER_ID = "7453114041956172832";
const USERNAME = "pemplexrl";
const API = "https://tiktok-api.tokcounter.com/user";

const headers = {
  accept: "application/json, text/plain, */*",
  origin: "https://tokcount.com",
  referer: "https://tokcount.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36"
};

async function fetchJson(url) {
  const r = await fetch(url, { headers, cache: "no-store" });
  if (!r.ok) throw new Error(`${url} returned ${r.status}`);
  return r.json();
}

async function fetchStatsCount(nonce) {
  const data = await fetchJson(`${API}/stats/${USER_ID}?_=${nonce}`);
  if (!data?.success) throw new Error("TokCount stats endpoint returned unsuccessful response");
  const n = Number(data.followerCount);
  if (!Number.isFinite(n)) throw new Error("TokCount stats endpoint returned an invalid count");
  return n;
}

async function fetchSearchFallback(nonce) {
  const data = await fetchJson(`${API}/search/${encodeURIComponent(USERNAME)}?_=${nonce}`);
  if (!data?.success) throw new Error("TokCount search endpoint returned unsuccessful response");
  const users = Array.isArray(data.userData) ? data.userData : [];
  const exact = users.find(u => String(u?.id || "").toLowerCase() === USERNAME);
  const n = Number(exact?.stats?.followers);
  if (!Number.isFinite(n)) throw new Error("TokCount search endpoint returned an invalid count");
  return n;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const nonce = Date.now();

  try {
    // Use one authoritative source so two caches can never make the display bounce.
    const followerCount = await fetchStatsCount(nonce);
    return res.status(200).json({
      username: USERNAME,
      followerCount,
      source: "stats",
      updatedAt: new Date().toISOString()
    });
  } catch (statsError) {
    console.error("Primary stats feed failed:", statsError);

    try {
      // Search is only a fallback when the primary feed is unavailable.
      const followerCount = await fetchSearchFallback(nonce);
      return res.status(200).json({
        username: USERNAME,
        followerCount,
        source: "search-fallback",
        updatedAt: new Date().toISOString()
      });
    } catch (fallbackError) {
      console.error("Fallback search feed failed:", fallbackError);
      return res.status(502).json({ error: "Could not load the live TikTok follower count right now." });
    }
  }
}
