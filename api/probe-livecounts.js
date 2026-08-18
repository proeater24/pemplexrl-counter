export default async function handler(req,res){
  try{
    const page='https://livecounts.io/tiktok-live-follower-counter';
    const r=await fetch(page,{headers:{'user-agent':'Mozilla/5.0 Chrome/151 Safari/537.36','accept':'text/html,application/xhtml+xml'},cache:'no-store'});
    const html=await r.text();
    const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]);
    const out=[];
    for(const src of scripts){
      const u=src.startsWith('http')?src:new URL(src,page).href;
      try{
        const sr=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 Chrome/151 Safari/537.36'},cache:'no-store'});
        const js=await sr.text();
        const needles=['CountUp','countUp','duration','easing','odometer','animated','animationDuration','useSpring','spring','react-countup','framer-motion'];
        const snippets=[];
        for(const needle of needles){
          let i=0,c=0;
          while((i=js.indexOf(needle,i))!==-1 && c<8){
            snippets.push({needle,text:js.slice(Math.max(0,i-260),Math.min(js.length,i+520))});
            i+=needle.length;c++;
          }
        }
        if(snippets.length) out.push({src,status:sr.status,size:js.length,snippets});
      }catch(e){out.push({src,error:String(e)})}
    }
    res.status(200).json({pageStatus:r.status,scripts,results:out});
  }catch(e){res.status(500).json({error:String(e)})}
}
