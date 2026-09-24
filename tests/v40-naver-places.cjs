const fs=require('fs');
const assert=require('assert');
const seed=fs.readFileSync('legacy-outing-v40-seed.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert(seed.includes("const DISPLAY_VER=window.__DOJUN_RELEASE?.version||'v69'"),'v40 module must use canonical release version');
assert(seed.includes("const STORAGE_KEY='dj:outingPlaces1'"),'outing storage key missing');
assert(seed.includes("status:'가고싶음'"),'seed status must be 가고싶음');
assert(seed.includes('네이버 지도 공유목록 · 도준아 꼭 가보자'),'seed source memo missing');
assert(seed.includes("if(localStorage.getItem(STORAGE_KEY)!==null){window.__outingPlaces=readRaw();return 0}"),'seed places must only be inserted on first initialization');
assert(!seed.includes('nominatim.openstreetmap.org'),'removed embedded maps must not keep background geocoding');
assert(index.includes('legacy-outing-v40-seed.js?v=20260916-v40&r=20260924-v80-makelabel1'),'v40 seed module not refreshed');

const rows=[...seed.matchAll(/^\s*\['([^']+)','([^']+)'\],?$/gm)];
assert.strictEqual(rows.length,28,'must seed exactly 28 places');
const keys=new Set(rows.map(m=>`${m[1]}|${m[2]}`));
assert.strictEqual(keys.size,28,'seed places must be unique by name/address');
assert(rows.some(m=>m[1]==='운양캠프캠핑식당'),'camp restaurant must remain');
assert(rows.some(m=>m[1]==='운양캠프'),'camp must remain separately');
console.log('PASS: v40 seeds outing defaults once and performs no obsolete background geocoding');
