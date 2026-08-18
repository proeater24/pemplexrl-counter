const PROFILE_API = "https://pulse.walls.sh/profile";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = Array.isArray(req.query.user) ? req.query.user[0] : req.query.user;
  const username = String(raw || "pemplexrl").replace(/^@/, "").trim();

  if (!/^[A-Za-z0-9._]{2,24}$/.test(username)) {
    return res.status(400).json({ error: "Invalid TikTok username" });
  }

  try {
    const profileUrl = `https://www.tiktok.com/@${username}`;
    const upstreamUrl = `${PROFILE_API}?url=${encodeURIComponent(profileUrl)}`;

    const response = await fetch(upstreamUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "pemplexrl-live-counter/2.0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Profile provider returned ${response.status}`);
    }

    const data = await response.json();
    const followerCount = Number(data?.followers);

    if (!Number.isFinite(followerCount)) {
      throw new Error("Follower count missing from profile provider");
    }

    return res.status(200).json({
      username,
      followerCount,
      updatedAt: data?.fetchedAt || new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "Could not load the live TikTok follower count right now." });
  }
}
