(function(root,factory){
  const core=(typeof module==='object'&&module.exports)?require('./ppeuni-core.js'):root.PpeuniCore;
  const api=factory(core);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DojunOpsV27=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
  'use strict';
  if(!C)throw new Error('PpeuniCore required');
  const n=(v,min=0)=>{v=Number(v);return Number.isFinite(v)&&v>=min?v:min};
  function cleanRawInventory(raw){
    const out={}; if(!raw||typeof raw!=='object')return out;
    for(const [name,v] of Object.entries(raw)){
      const nm=String(name||'').trim(); if(!nm)continue;
      if(typeof v==='number')out[nm]={grams:n(v),updatedAt:0,note:''};
      else out[nm]={grams:n(v?.grams),updatedAt:n(v?.updatedAt),note:String(v?.note||'')};
    }
    return out;
  }
  const rawStockFor=(raw,name)=>cleanRawInventory(raw)[String(name||'').trim()]?.grams||0;
  function setRawStock(raw,name,grams){
    const out=cleanRawInventory(raw),nm=String(name||'').trim(); if(!nm)throw new Error('ingredient required');
    out[nm]={...(out[nm]||{}),grams:n(grams),updatedAt:Date.now()}; return out;
  }
  const addRawStock=(raw,name,grams)=>setRawStock(raw,name,rawStockFor(raw,name)+n(grams));
  function consumeRawStock(raw,name,grams){
    const have=rawStockFor(raw,name),need=n(grams);
    if(have+1e-9<need)return{raw:cleanRawInventory(raw),ok:false,shortageG:Math.max(0,need-have)};
    return{raw:setRawStock(raw,name,Math.max(0,have-need)),ok:true,shortageG:0};
  }
  function windowNeeds(plan,w,batches,raw,opts={allowProvisional:true}){
    const list=C.buildPrepList(plan,w.start,w.count,batches,opts);
    return list.map(x=>{
      const makeG=Math.max(0,Number(x.missingG)||0),rawG=rawStockFor(raw,x.ingredient),buyG=Math.max(0,makeG-rawG);
      return{...x,makeG,rawG,buyG,canMake:makeG===0||rawG+1e-9>=makeG};
    });
  }
  const shoppingList=(plan,w,batches,raw,opts={allowProvisional:true})=>windowNeeds(plan,w,batches,raw,opts).filter(x=>x.buyG>1e-9);
  const makeList=(plan,w,batches,raw,opts={allowProvisional:true})=>windowNeeds(plan,w,batches,raw,opts).filter(x=>x.makeG>1e-9);
  function scheduleDays(plan,w){
    const slots=['breakfast','lunch','dinner'],out=[];
    for(let i=0;i<w.count;i++){
      const date=C.addDays(w.start,i),day=plan?.[date]||{};
      out.push({date,meals:slots.map(slot=>({slot,meal:day[slot]||null}))});
    }
    return out;
  }
  return{cleanRawInventory,rawStockFor,setRawStock,addRawStock,consumeRawStock,windowNeeds,shoppingList,makeList,scheduleDays};
});