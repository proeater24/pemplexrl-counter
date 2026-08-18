const USER_ID = "7453114041956172832";
const USERNAME = "pemplexrl";
const API = "https://tiktok-api.tokcounter.com/user";
let lastReturned = null;

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const nonce = Date.now();
    const [statsResult, searchResult] = await Promise.allSettled([
      fetchJson(`${API}/stats/${USER_ID}?_=${nonce}`),
      fetchJson(`${API}/search/${encodeURIComponent(USERNAME)}?_=${nonce}`)
    ]);

    let statsCount = null;
    let searchCount = null;

    if (statsResult.status === "fulfilled" && statsResult.value?.success) {
      const n = Number(statsResult.value.followerCount);
      if (Number.isFinite(n)) statsCount = n;
    }

    if (searchResult.status === "fulfilled" && searchResult.value?.success) {
      const users = Array.isArray(searchResult.value.userData) ? searchResult.value.userData : [];
      const exact = users.find(u => String(u?.id || "").toLowerCase() === USERNAME);
      const n = Number(exact?.stats?.followers);
      if (Number.isFinite(n)) searchCount = n;
    }

    if (statsCount === null && searchCount === null) throw new Error("Both TokCount live endpoints failed");

    let followerCount;
    if (statsCount !== null && searchCount !== null && statsCount !== searchCount && lastReturned !== null) {
      // When one TokCount endpoint is still on the old value and the other has already changed,
      // immediately use the changed one instead of waiting for both caches to catch up.
      if (statsCount === lastReturned && searchCount !== lastReturned) followerCount = searchCount;
      else if (searchCount === lastReturned && statsCount !== lastReturned) followerCount = statsCount;
      else followerCount = statsCount;
    } else {
      followerCount = statsCount ?? searchCount;
    }

    lastReturned = followerCount;

    return res.status(200).json({
      username: USERNAME,
      followerCount,
      statsCount,
      searchCount,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "Could not load the live TikTok follower count right now." });
  }
}
