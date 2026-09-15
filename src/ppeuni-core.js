(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PpeuniCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const iso=d=>{
    if(typeof d==='string')return d.slice(0,10);
    const x=new Date(d); if(Number.isNaN(x.getTime()))throw new Error('invalid date');
    const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),day=String(x.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const parse=s=>{const [y,m,d]=iso(s).split('-').map(Number);return new Date(y,m-1,d)};
  const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
  const ageMonths=(birth,on)=>{
    const b=parse(birth),d=parse(on); if(d<b)return null;
    let n=(d.getFullYear()-b.getFullYear())*12+d.getMonth()-b.getMonth();
    if(d.getDate()<b.getDate())n--;
    return Math.max(0,n);
  };
  const ppeuniStageForAge=m=>m===9?'late1':m===10?'late2':m===11?'late3':m>=12?'complete':m>=7?'middle':m>=5?'early':'pre';
  const mondayOf=s=>{const d=parse(s),day=d.getDay(),delta=day===0?-6:1-day;d.setDate(d.getDate()+delta);return iso(d)};
  const prepWindowsForWeek=on=>{
    const mon=mondayOf(on);
    return [
      {id:'first',prepDate:addDays(mon,-1),start:mon,end:addDays(mon,3),count:4,label:'1차 준비 · 일요일 → 월~목'},
      {id:'second',prepDate:addDays(mon,3),start:addDays(mon,4),end:addDays(mon,6),count:3,label:'2차 준비 · 목요일 → 금~일'}
    ];
  };
  const num=(v,name,min=0)=>{v=Number(v);if(!Number.isFinite(v)||v<min)throw new Error(`${name} invalid`);return v};
  const cleanBatch=b=>{
    if(!b||!String(b.ingredient||'').trim())throw new Error('ingredient required');
    const unitG=num(b.unitG,'unitG',0.1),initialCount=num(b.initialCount,'initialCount',0);
    const remainingCount=b.remainingCount===undefined?initialCount:num(b.remainingCount,'remainingCount',0);
    if(remainingCount>initialCount+1e-9)throw new Error('remainingCount exceeds initialCount');
    return {
      id:String(b.id||`${String(b.code||'').trim()}|${String(b.ingredient).trim()}|${iso(b.madeDate||new Date())}`),
      code:String(b.code||'').trim(),ingredient:String(b.ingredient).trim(),madeDate:iso(b.madeDate||new Date()),
      unitG,initialCount,remainingCount,location:String(b.location||'냉동'),thresholdCount:num(b.thresholdCount??4,'thresholdCount',0),
      note:String(b.note||''),updatedAt:Number.isFinite(Number(b.updatedAt))?Number(b.updatedAt):Date.now(),history:Array.isArray(b.history)?b.history.slice():[]
    };
  };
  const batchAvailableG=b=>{const x=cleanBatch(b);return x.remainingCount*x.unitG};
  const stockFor=(batches,ingredient)=>batches.map(cleanBatch).filter(x=>x.ingredient===ingredient).reduce((s,x)=>s+x.remainingCount*x.unitG,0);
  function consumeFIFO(batches,ingredient,grams,usageRef){
    grams=num(grams,'grams',0);if(grams===0)return{batches:batches.map(cleanBatch),used:[],shortageG:0};
    const out=batches.map(cleanBatch),idx=out.map((b,i)=>[b,i]).filter(([b])=>b.ingredient===ingredient&&b.remainingCount>0)
      .sort((a,b)=>a[0].madeDate.localeCompare(b[0].madeDate)||a[0].id.localeCompare(b[0].id));
    let left=grams;const used=[];
    for(const [b] of idx){
      if(left<=1e-9)break;
      const avail=b.remainingCount*b.unitG,take=Math.min(avail,left),units=take/b.unitG;
      b.remainingCount=Math.max(0,Math.round((b.remainingCount-units)*10000)/10000);
      b.updatedAt=Date.now();
      b.history.push({type:'use',at:new Date().toISOString(),grams:Math.round(take*1000)/1000,units:Math.round(units*10000)/10000,ref:String(usageRef||'')});
      used.push({id:b.id,grams:take,units});left-=take;
    }
    return{batches:out,used,shortageG:Math.max(0,Math.round(left*1000)/1000)};
  }
  function remakeSuggestion(batches,ingredient,upcomingNeedG=0){
    const bs=batches.map(cleanBatch).filter(x=>x.ingredient===ingredient),availableG=stockFor(bs,ingredient);
    const unitG=bs.length?bs[0].unitG:0,thresholdCount=bs.length?Math.max(...bs.map(x=>x.thresholdCount)):4;
    const thresholdG=unitG*thresholdCount,need=Math.max(0,Number(upcomingNeedG)||0),after=availableG-need;
    return{ingredient,availableG,upcomingNeedG:need,thresholdG,needsRemake:unitG>0?after<=thresholdG:need>0,
      suggestedCount:unitG>0?Math.max(20,Math.ceil((need+thresholdG)/unitG)):null};
  }
  const planMealKey=(date,slot)=>`${iso(date)}|${slot}`;
  function validateMealShape(meal){
    if(!meal||!meal.sourceRef)throw new Error('sourceRef required');
    if(!Array.isArray(meal.ingredients))throw new Error('ingredients required');
    meal.ingredients.forEach(x=>{if(!String(x.name||'').trim())throw new Error('ingredient name required');num(x.grams,'ingredient grams',0)});
    return meal;
  }
  function assertVerifiedMeal(meal){
    if(!meal||meal.source!=='ppeuni_verified')throw new Error('Only verified Ppeuni meals are allowed');
    return validateMealShape(meal);
  }
  function assertOperationalMeal(meal,opts={}){
    if(meal?.source==='ppeuni_verified')return validateMealShape(meal);
    if(opts.allowProvisional&&meal?.source==='provisional')return validateMealShape(meal);
    throw new Error('Meal source is not allowed');
  }
  function mealsInRange(plan,start,count,opts={}){
    const out=[];
    for(let i=0;i<count;i++){
      const date=addDays(start,i),day=plan?.[date]||{};
      for(const slot of ['breakfast','lunch','dinner'])if(day[slot])out.push({date,slot,meal:assertOperationalMeal(day[slot],opts)});
    }
    return out;
  }
  function buildPrepList(plan,start,count,batches=[],opts={}){
    const meals=mealsInRange(plan,start,count,opts),needs={};
    meals.forEach(({meal})=>meal.ingredients.forEach(x=>{needs[x.name]=(needs[x.name]||0)+Number(x.grams||0)}));
    return Object.entries(needs).sort((a,b)=>a[0].localeCompare(b[0],'ko')).map(([ingredient,needG])=>{
      const stockG=stockFor(batches,ingredient),missingG=Math.max(0,needG-stockG),remake=remakeSuggestion(batches,ingredient,needG);
      return{ingredient,needG,stockG,missingG,remake};
    });
  }
  function completeMealOnce(state,date,slot,meal,opts={}){
    meal=assertOperationalMeal(meal,opts);const key=planMealKey(date,slot),done={...(state.done||{})};
    if(done[key])return{...state,done,alreadyDone:true};
    let batches=(state.batches||[]).map(cleanBatch),shortages=[];
    meal.ingredients.forEach(x=>{const r=consumeFIFO(batches,x.name,x.grams,key);batches=r.batches;if(r.shortageG>0)shortages.push({ingredient:x.name,grams:r.shortageG})});
    done[key]={completedAt:new Date().toISOString(),source:meal.source,sourceRef:meal.sourceRef,shortages};
    return{...state,batches,done,alreadyDone:false,shortages};
  }
  return{iso,parse,addDays,ageMonths,ppeuniStageForAge,mondayOf,prepWindowsForWeek,cleanBatch,batchAvailableG,stockFor,consumeFIFO,remakeSuggestion,planMealKey,assertVerifiedMeal,assertOperationalMeal,mealsInRange,buildPrepList,completeMealOnce};
});