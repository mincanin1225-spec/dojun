import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const SOURCE_URL=process.env.NAVER_SHARE_URL||'https://naver.me/xfboSqg8';
const OUT='data/naver-places.json';
const found=new Map();

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
  if(depth>12||v==null)return;
  if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return}
  if(typeof v!=='object')return;
  if(('name'in v||'displayName'in v||'title'in v)&&('sid'in v||'bookmarkId'in v||'px'in v||'py'in v||'address'in v||'roadAddress'in v))addPlace(v);
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
    const url=res.url();if(!/naver\.com|naver\.me/.test(url))return;
    const ct=(res.headers()['content-type']||'').toLowerCase();
    if(!ct.includes('json')&&!/bookmark|favorite|shared|place/i.test(url))return;
    try{const text=await res.text();if(text.length>8_000_000)return;const data=JSON.parse(text);walk(data);}catch{}
  });
  const nav=await page.goto(SOURCE_URL,{waitUntil:'domcontentloaded',timeout:60000});
  if(!nav)throw new Error('공유 목록 페이지 응답이 없습니다.');
  await new Promise(r=>setTimeout(r,7000));
  for(let i=0;i<8;i++){
    await page.evaluate(()=>window.scrollBy(0,Math.max(window.innerHeight,700)));
    await new Promise(r=>setTimeout(r,650));
  }
  const dom=await page.evaluate(()=>{
    const out=[];
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.href||'';const txt=(a.innerText||a.textContent||'').trim().replace(/\s+/g,' ');
      if(!txt||txt.length>200)return;
      if(/\/entry\/place\/|\/place\/\d+|placeId=/.test(href))out.push({title:txt.split('\n')[0],url:href});
    });
    return out.slice(0,1000);
  });
  dom.forEach(addPlace);
  const places=[...found.values()].filter(x=>x.name);
  if(!places.length)throw new Error(`브라우저에서 저장 장소를 찾지 못했습니다. 최종 URL: ${page.url()}`);
  places.sort((a,b)=>(b.lastUpdateTime||0)-(a.lastUpdateTime||0)||a.name.localeCompare(b.name,'ko'));
  const m=page.url().match(/\/favorite\/sharedPlace\/folder\/([A-Za-z0-9_-]+)/i);
  const out={status:'ok',sourceUrl:SOURCE_URL,landingUrl:page.url(),shareId:m?.[1]||null,syncedAt:new Date().toISOString(),count:places.length,places,message:`네이버 저장목록 ${places.length}곳 브라우저 동기화 완료`};
  await fs.mkdir('data',{recursive:true});await fs.writeFile(OUT,JSON.stringify(out,null,2)+'\n');
  console.log(out.message);
}finally{await browser.close();}
