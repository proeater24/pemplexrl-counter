function findUserId(value){
  if(!value||typeof value!=='object')return null;
  if(value.userId!==undefined&&value.userId!==null)return String(value.userId);
  if(Array.isArray(value)){for(const v of value){const id=findUserId(v);if(id)return id}}
  else{for(const v of Object.values(value)){const id=findUserId(v);if(id)return id}}
  return null;
}
export default async function handler(req,res){
  try{
    const headers={accept:'application/json, text/plain, */*',origin:'https://tokcount.com',referer:'https://tokcount.com/','user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36'};
    const s=await fetch('https://tiktok-api.tokcounter.com/user/search/pemplexrl',{headers,cache:'no-store'});
    const searchText=await s.text();
    let searchJson=null;try{searchJson=JSON.parse(searchText)}catch{}
    const userId=findUserId(searchJson);
    let stats=null;
    if(userId){const r=await fetch('https://tiktok-api.tokcounter.com/user/stats/'+encodeURIComponent(userId),{headers,cache:'no-store'});stats={status:r.status,text:(await r.text()).slice(0,5000)}}
    res.status(200).json({searchStatus:s.status,searchText:searchText.slice(0,5000),userId,stats});
  }catch(e){res.status(500).json({error:String(e)})}
}
