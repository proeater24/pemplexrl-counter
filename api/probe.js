export default async function handler(req, res) {
  try {
    const r = await fetch('https://tokcount.com/?user=pemplexrl', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml'
      },
      cache: 'no-store'
    });
    const html = await r.text();
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
    const apiRefs = [...new Set((html.match(/https?:\/\/[^"'<>\s]+|\/api\/[^"'<>\s]+/g) || []).filter(x => /api|tokcount|stats|follower/i.test(x)))].slice(0,50);
    res.status(200).json({status:r.status, scripts, apiRefs, htmlStart:html.slice(0,2000)});
  } catch (e) {
    res.status(500).json({error:String(e)});
  }
}
