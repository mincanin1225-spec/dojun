import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL=process.env.NAVER_SHARE_URL||'https://naver.me/xfboSqg8';
const OUT=path.resolve('data/naver-places.json');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36';

function shareIdFrom(text=''){
  const decoded=String(text).replace(/\\u002F/g,'/').replace(/&amp;/g,'&');
  const patterns=[
    /\/favorite\/sharedPlace\/folder\/([A-Za-z0-9_-]{4,})/i,
    /[?&](?:shareId|shareID)=([^&#"']+)/i,
    /\/(?:shares|share)\/([A-Za-z0-9_-]{4,})/i,
    /["'](?:shareId|shareID)["']\s*[:=]\s*["']([^"']+)["']/i,
    /(?:shareId|shareID)\s*[:=]\s*([A-Za-z0-9_-]{4,})/i
  ];
  for(const re of patterns){const m=decoded.match(re);if(m?.[1])return decodeURIComponent(m[1]);}
  return null;
}

async function fetchText(url){
  const r=await fetch(url,{redirect:'follow',headers:{'user-agent':UA,'accept-language':'ko-KR,ko;q=0.9,en;q=0.8'}});
  if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);
  return {url:r.url,text:await r.text(),headers:r.headers};
}

async function main(){
  let previous=null;
  try{previous=JSON.parse(await fs.readFile(OUT,'utf8'));}catch{}
  let shareId=null,landingUrl='',landingText='';
  try{
    const landing=await fetchText(SOURCE_URL);
    landingUrl=landing.url;landingText=landing.text;
    shareId=shareIdFrom(landingUrl)||shareIdFrom(landingText);
    if(!shareId)throw new Error(`공유 ID를 찾지 못했습니다. 최종 URL: ${landingUrl}`);
    const api=`https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${encodeURIComponent(shareId)}/bookmarks?start=0&limit=5000&sort=lastUseTime`;
    const r=await fetch(api,{headers:{'user-agent':UA,'accept':'application/json, text/plain, */*','referer':landingUrl||SOURCE_URL}});
    if(!r.ok)throw new Error(`Naver bookmark API HTTP ${r.status}`);
    const data=await r.json();
    const list=Array.isArray(data?.bookmarkList)?data.bookmarkList:Array.isArray(data?.bookmarks)?data.bookmarks:[];
    const places=list.filter(x=>x&&x.type!=='route').map(x=>({
      id:String(x.bookmarkId??x.sid??`${x.name}-${x.px}-${x.py}`),
      sid:x.sid?String(x.sid):'',
      name:String(x.name||x.displayName||'').trim(),
      address:String(x.address||'').trim(),
      lng:Number.isFinite(Number(x.px))?Number(x.px):null,
      lat:Number.isFinite(Number(x.py))?Number(x.py):null,
      category:String(x.mcidName||x.mcid||'').trim(),
      memo:String(x.memo||'').trim(),
      url:String(x.url||'').trim(),
      available:x.available!==false,
      lastUpdateTime:Number(x.lastUpdateTime)||0,
      creationTime:Number(x.creationTime)||0
    })).filter(x=>x.name);
    const out={status:'ok',sourceUrl:SOURCE_URL,landingUrl,shareId,syncedAt:new Date().toISOString(),count:places.length,places,message:`네이버 저장목록 ${places.length}곳 동기화 완료`};
    await fs.mkdir(path.dirname(OUT),{recursive:true});await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
    console.log(out.message, shareId);
  }catch(err){
    const out={...(previous&&typeof previous==='object'?previous:{}),status:'error',sourceUrl:SOURCE_URL,landingUrl,shareId:shareId||previous?.shareId||null,syncedAt:new Date().toISOString(),message:String(err?.message||err)};
    if(!Array.isArray(out.places))out.places=[];out.count=out.places.length;
    await fs.mkdir(path.dirname(OUT),{recursive:true});await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
    console.error('NAVER_SYNC_ERROR',out.message);
    process.exitCode=2;
  }
}

await main();
