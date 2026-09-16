const fs=require('fs');
const assert=require('assert');
const index=fs.readFileSync('index.html','utf8');
assert(index.includes('20260916-v46'));
assert(index.includes("ai.id='v46-"));
console.log('v46 loader checks passed');
