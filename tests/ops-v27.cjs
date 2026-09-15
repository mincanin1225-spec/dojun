const assert=require('assert');
const C=require('../src/ppeuni-core.js');
const O=require('../src/ops-v27.js');
const w={id:'first',start:'2026-09-21',end:'2026-09-24',prepDate:'2026-09-20',count:4};
const meal=(title,ings)=>({source:'provisional',sourceRef:'test',title,ingredients:ings});
const plan={
'2026-09-21':{breakfast:meal('아침1',[{name:'당근',grams:20},{name:'진밥',grams:80}]),lunch:meal('점심1',[{name:'양파',grams:20}]),dinner:meal('저녁1',[{name:'당근',grams:20}])},
'2026-09-22':{breakfast:meal('아침2',[{name:'당근',grams:20}]),lunch:meal('점심2',[{name:'양파',grams:20}]),dinner:meal('저녁2',[{name:'진밥',grams:80}])},
'2026-09-23':{breakfast:meal('아침3',[{name:'당근',grams:20}]),lunch:meal('점심3',[{name:'양파',grams:20}]),dinner:meal('저녁3',[{name:'진밥',grams:80}])},
'2026-09-24':{breakfast:meal('아침4',[{name:'당근',grams:20}]),lunch:meal('점심4',[{name:'양파',grams:20}]),dinner:meal('저녁4',[{name:'진밥',grams:80}])}
};
const cubes=[{id:'A-1|당근|2026-09-01',code:'A-1',ingredient:'당근',madeDate:'2026-09-01',unitG:20,initialCount:3,remainingCount:3,thresholdCount:1,location:'냉동'}];
let raw=O.setRawStock({},'당근',20);raw=O.setRawStock(raw,'양파',100);raw=O.setRawStock(raw,'진밥',500);
const needs=O.windowNeeds(plan,w,cubes,raw,{allowProvisional:true});
const carrot=needs.find(x=>x.ingredient==='당근'),onion=needs.find(x=>x.ingredient==='양파');
assert.equal(carrot.needG,100);assert.equal(carrot.stockG,60);assert.equal(carrot.makeG,40);assert.equal(carrot.buyG,20);
assert.equal(onion.needG,80);assert.equal(onion.makeG,80);assert.equal(onion.buyG,0);
const shop=O.shoppingList(plan,w,cubes,raw,{allowProvisional:true});assert.equal(shop.length,1);assert.equal(shop[0].ingredient,'당근');
const make=O.makeList(plan,w,cubes,raw,{allowProvisional:true});assert(make.some(x=>x.ingredient==='양파'));
const days=O.scheduleDays(plan,w);assert.equal(days.length,4);assert.equal(days[0].meals.length,3);assert.equal(days[0].meals[0].meal.title,'아침1');
let used=O.consumeRawStock(raw,'양파',80);assert.equal(used.ok,true);assert.equal(O.rawStockFor(used.raw,'양파'),20);
used=O.consumeRawStock(raw,'당근',40);assert.equal(used.ok,false);assert.equal(used.shortageG,20);
console.log('v27 ops tests passed');