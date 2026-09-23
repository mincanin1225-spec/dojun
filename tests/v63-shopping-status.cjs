const fs=require('fs'),assert=require('assert/strict');
const mg35=fs.readFileSync('legacy-management-v35.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');

new Function(mg35);
assert(mg35.includes('function shoppingState'),'shopping batch status helper missing');
assert(mg35.includes('장보기 미완료'),'incomplete shopping status label missing');
assert(mg35.includes('장보기 완료'),'complete shopping status label missing');
assert(mg35.includes('data-v60-shopcomplete'),'whole-batch completion toggle missing');
assert(mg35.includes('전체 구매완료')&&mg35.includes('완료 취소'),'whole-batch completion controls missing');
assert(mg35.includes('data-v33check'),'existing per-item purchase checkbox must remain');
assert(mg35.includes("store.set('shop2',shopChk)"),'shopping completion must persist in existing shopChk storage');
assert(index.includes('legacy-management-v78-bundle.js?r=20260923-v78-fastboot1'),'fresh consolidated management bundle cache token missing');
assert(/const CACHE='dojun-pwa-v\d+-[\w-]+'/.test(sw),'current PWA cache generation missing');
console.log('PASS: shopping completion status and batch toggle restored');
