const TOKCOUNT_STATS = "https://tiktok-api.tokcounter.com/user/stats";
const PIMPLEXRL_USER_ID = "7453114041956172832";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch(`${TOKCOUNT_STATS}/${PIMPLEXRL_USER_ID}`, {
      headers: {
        accept: "application/json, text/plain, */*",
        origin: "https://tokcount.com",
        referer: "https://tokcount.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36"
      },
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`TokCount stats returned ${response.status}`);

    const data = await response.json();
    const followerCount = Number(data?.followerCount);

    if (!data?.success || !Number.isFinite(followerCount)) {
      throw new Error("Follower count missing from TokCount stats");
    }

    return res.status(200).json({
      username: "pemplexrl",
      followerCount,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "Could not load the live TikTok follower count right now." });
  }
}
