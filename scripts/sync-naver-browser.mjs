import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const SOURCE_URL=process.env.NAVER_SHARE_URL||'https://naver.me/xfboSqg8';
const OUT='data/naver-places.json';
const found=new Map();
const observed=[];

function safeObserved(url,status,ct){
  if(!/naver\.com|naver\.me/.test(url))return;
  if(!/(api|bookmark|favorite|shared|place|save)/i.test(url))return;
  try{
    const u=new URL(url);for(const k of [...u.searchParams.keys()])if(/token|auth|key|session|cookie/i.test(k))u.searchParams.set(k,'REDACTED');
    const line=`${status} ${String(ct||'').split(';')[0]} ${u.href}`;
    if(!observed.includes(line)&&observed.length<160)observed.push(line);
  }catch{}
}
function addPlace(x={}){
  const name=String(x.name||x.displayName||x.title||'').trim();
  const sid=String(x.sid||x.placeId||x.id||'').trim();
  const lng=Number(x.px??x.x??x.longitude??x.lng);
  const lat=Number(x.py??x.y??x.latitude??x.lat);
  const address=String(x.address||x.roadAddress||x.addressName||'').trim();
  if(!name)return;
  const hasCoord=Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;
  if(!hasCoord&&!sid&&!address)return;
  const id=String(x.bookmarkId||sid||`${name}|${address}|${hasCoord?`${lat},${lng}`:''}`);
  const prev=found.get(id)||{};
  found.set(id,{...prev,id,sid:sid||prev.sid||'',name,address:address||prev.address||'',lng:hasCoord?lng:(prev.lng??null),lat:hasCoord?lat:(prev.lat??null),category:String(x.mcidName||x.category||x.categoryName||prev.category||'').trim(),memo:String(x.memo||prev.memo||'').trim(),url:String(x.url||x.placeUrl||prev.url||'').trim(),available:x.available!==false,lastUpdateTime:Number(x.lastUpdateTime)||prev.lastUpdateTime||0,creationTime:Number(x.creationTime)||prev.creationTime||0});
}
function walk(v,depth=0){
  if(depth>14||v==null)return;
  if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return}
  if(typeof v!=='object')return;
  if(('name'in v||'displayName'in v||'title'in v)&&('sid'in v||'bookmarkId'in v||'px'in v||'py'in v||'address'in v||'roadAddress'in v||'x'in v||'y'in v))addPlace(v);
  for(const [k,x] of Object.entries(v)){
    if(['styles','options','geometry','path','polyline'].includes(k))continue;
    walk(x,depth+1);
  }
}

const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],defaultViewport:{width:1280,height:900}});
try{
  const page=await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36');
  page.on('response',async res=>{
    const url=res.url(),ct=(res.headers()['content-type']||'').toLowerCase();safeObserved(url,res.status(),ct);
    if(!/naver\.com|naver\.me/.test(url))return;
    if(!ct.includes('json')&&!/(bookmark|favorite|shared|place|save)/i.test(url))return;
    try{const text=await res.text();if(text.length>8_000_000)return;const data=JSON.parse(text);walk(data);}catch{}
  });
  const nav=await page.goto(SOURCE_URL,{waitUntil:'domcontentloaded',timeout:60000});
  if(!nav)throw new Error('공유 목록 페이지 응답이 없습니다.');
  await new Promise(r=>setTimeout(r,9000));
  const frames=page.frames();console.log('NAVER_FRAMES',frames.map(f=>{try{return new URL(f.url()).origin+new URL(f.url()).pathname}catch{return f.url()}}).slice(0,20));
  for(let i=0;i<10;i++){
    for(const f of page.frames())try{await f.evaluate(()=>window.scrollBy(0,Math.max(window.innerHeight,700)))}catch{}
    await new Promise(r=>setTimeout(r,700));
  }
  for(const f of page.frames()){
    try{
      const dom=await f.evaluate(()=>{
        const out=[];
        document.querySelectorAll('a[href]').forEach(a=>{
          const href=a.href||'',txt=(a.innerText||a.textContent||'').trim().replace(/\s+/g,' ');
          if(!txt||txt.length>200)return;
          if(/\/entry\/place\/|\/place\/\d+|placeId=/.test(href))out.push({title:txt.split('\n')[0],url:href});
        });
        return out.slice(0,1000);
      });dom.forEach(addPlace);
    }catch{}
  }
  console.log('NAVER_ENDPOINTS_BEGIN');for(const x of observed)console.log(x);console.log('NAVER_ENDPOINTS_END');
  const places=[...found.values()].filter(x=>x.name);
  if(!places.length)throw new Error(`브라우저에서 저장 장소를 찾지 못했습니다. 최종 URL: ${page.url()}`);
  places.sort((a,b)=>(b.lastUpdateTime||0)-(a.lastUpdateTime||0)||a.name.localeCompare(b.name,'ko'));
  const m=page.url().match(/\/favorite\/sharedPlace\/folder\/([A-Za-z0-9_-]+)/i);
  const out={status:'ok',sourceUrl:SOURCE_URL,landingUrl:page.url(),shareId:m?.[1]||null,syncedAt:new Date().toISOString(),count:places.length,places,message:`네이버 저장목록 ${places.length}곳 브라우저 동기화 완료`};
  await fs.mkdir('data',{recursive:true});await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
  console.log(out.message);
}finally{await browser.close();}
