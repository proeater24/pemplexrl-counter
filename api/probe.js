export default async function handler(req,res){
  try{
    const page=await fetch('https://tokcount.com/?user=pemplexrl',{headers:{'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36'},cache:'no-store'});
    const html=await page.text();
    const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>x.includes('/_next/static/chunks/'));
    const results=await Promise.all(scripts.slice(0,14).map(async src=>{
      try{
        const url=src.startsWith('http')?src:'https://tokcount.com'+src;
        const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0'},cache:'no-store'});
        const text=await r.text();
        const urls=[...new Set(text.match(/https?:\\?\/\\?\/[^"'`\\\s)]+/g)||[])].filter(x=>/api|livecount|tokcount|tiktok/i.test(x)).slice(0,20);
        const snippets=[];
        for(const key of ['followerCount','followers','api.tokcount','livecounts','/api/','stats']){
          let i=text.toLowerCase().indexOf(key.toLowerCase());
          if(i>=0) snippets.push(text.slice(Math.max(0,i-350),Math.min(text.length,i+650)));
        }
        return {src,status:r.status,size:text.length,urls,snippets:snippets.slice(0,6)};
      }catch(e){return {src,error:String(e)}}
    }));
    res.status(200).json({results});
  }catch(e){res.status(500).json({error:String(e)})}
}
