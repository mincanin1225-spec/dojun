(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const round=x=>Math.round(x*1000000)/1000000;
  const positive=x=>Number.isFinite(Number(x))&&Number(x)>0;
  const aliases={'잡곡무른죽':'잡곡무른밥','비타민':'비타민채','달걀':'계란','치즈':'아기 치즈','닭':'닭고기'};
  const norm=s=>String(s||'').trim().split(/\s*·\s*/).map(x=>{x=String(x||'').trim().replace(/\s+(큐브|조각)$/,'');return aliases[x]||x}).join(' · ');
  function amount(lot){return positive(lot.unitG)&&positive(lot.remainingCount)?round(lot.unitG*lot.remainingCount):0}
  function id(lot,i){return lot.id||lot.stockCode||lot.code||'legacy-'+i}
  function isWholeMealLot(lot){
    const key=String(lot?.mealKey||''),name=norm(lot?.name||'');
    if(lot?.legacyWholeMeal)return true;
    if(name.includes(' · '))return true;
    return /^\d{4}-\d{2}-\d{2}\|\d+$/.test(key);
  }
  function pool(state,raw=true){
    const rows=[];
    for(const kind of ['prepared','cubes']) (state[kind]||[]).forEach((lot,i)=>{
      if(kind==='prepared'&&isWholeMealLot(lot))return;
      const lotId=id(lot,i),code=kind==='prepared'?(lot.mealCode||lot.stockCode||lot.code||lotId):(lot.stockCode||lot.code||lotId);
      if(amount(lot))rows.push({kind,i,id:lotId,code,name:norm(lot.name||lot.ingredient),g:amount(lot),date:lot.madeDate||'',unitG:Number(lot.unitG),location:lot.location||'냉동'});
    });
    if(raw)for(const [k,v]of Object.entries(state.raw||{})){
      const g=v.unit==='g'?Number(v.qty):Number(v.qty)*Number(v.gramsPerUnit),code=v.stockCode||v.code||k;
      if(positive(g))rows.push({kind:'raw',i:k,id:k,code,name:norm(v.displayName||k),g,date:v.madeDate||'',unitG:v.unit==='g'?1:Number(v.gramsPerUnit)||1,location:v.location||''});
    }
    return rows.sort((a,b)=>(a.kind==='raw')-(b.kind==='raw')||a.date.localeCompare(b.date));
  }
  function take(rows,name,g,kinds){
    let left=g;const used=[];
    for(const r of rows){if(left<=0)break;if(r.name!==norm(name)||(kinds&&!kinds.includes(r.kind)))continue;
      const n=Math.min(r.g,left);if(n<=0)continue;r.g=round(r.g-n);left=round(left-n);used.push({...r,g:n});
    }
    return {left,used};
  }
  function mealNeed(meal,rows){
    let remaining=meal.g,used=[];
    if(positive(remaining)){const t=take(rows,meal.name,remaining,['prepared']);remaining=t.left;used=t.used;if(!remaining)return {used,needs:[]};}
    const ratio=positive(meal.g)?remaining/meal.g:1;
    return {used,needs:(meal.ingredients||[]).map(x=>({...x,g:positive(x.g)?round(x.g*ratio):null}))};
  }
  function plan(meals,state){
    const rows=pool(state),out=[];
    function allocate(x,used,trail=[]){
      if(!positive(x.g))return [{...x,buyG:null}];
      const t=take(rows,x.name,x.g);used.push(...t.used);
      const recipe=state.recipes&&state.recipes[norm(x.name)];
      if(t.left>0&&recipe&&positive(recipe.yieldG)&&recipe.ingredients?.length&&!trail.includes(norm(x.name))){
        return recipe.ingredients.flatMap(v=>allocate({...v,g:positive(v.g)?v.g*t.left/recipe.yieldG:null},used,[...trail,norm(x.name)]));
      }
      return [{...x,buyG:t.left}];
    }
    for(const m of meals){
      if(state.feeds&&state.feeds[m.key]){out.push({meal:m,fed:true,needs:[],used:[]});continue;}
      const r=mealNeed(m,rows),needs=[];
      for(const x of r.needs)needs.push(...allocate(x,r.used));
      out.push({meal:m,needs,used:r.used});
    }
    return out;
  }
  function mutate(state,used){
    const s=copy(state);
    for(const u of used){
      if(u.kind==='raw'){
        const v=s.raw[u.i],factor=v.unit==='g'?1:Number(v.gramsPerUnit);v.qty=round(Number(v.qty)-u.g/factor);continue;
      }
      const lot=s[u.kind][u.i];lot.remainingCount=round(amount(lot)-u.g)/Number(lot.unitG);
      // Fractional cubes are made explicit as a separate residual lot before saving.
    }
    return s;
  }
  function splitResiduals(s){
    for(const kind of ['prepared','cubes']){
      const extra=[];
      s[kind].forEach((lot,i)=>{
        const count=Number(lot.remainingCount)||0,whole=Math.floor(count+1e-7),rem=round((count-whole)*lot.unitG);
        if(rem<=0)return;lot.remainingCount=whole;
        const suffix='-잔량-'+Date.now()+'-'+i;
        extra.push({...copy(lot),id:id(lot,i)+suffix,stockCode:(lot.stockCode||lot.code||id(lot,i))+suffix,code:(lot.code||lot.stockCode||id(lot,i))+suffix,mealCode:(lot.mealCode||'M')+suffix,unitG:rem,remainingCount:1,originalCount:1,note:'부분 사용 후 남은 양 · '+(lot.note||'')});
      });s[kind].push(...extra);
    }
    return s;
  }
  function cook(state,meal,form){
    if(state.ops&&state.ops[form.token])return {state,already:true};
    if(isWholeMealLot({name:meal.name,mealKey:meal.key,source:'meal-prep-v63'}))throw Error('한 끼 전체 메뉴는 재고로 저장하지 않아요');
    if(!form.token||!Number.isInteger(form.count)||form.count<1||!positive(form.unitG)||!positive(meal.g))throw Error('소분 중량·개수를 확인해 주세요');
    const required=meal.ingredients||[];
    if(!required.length||required.some(x=>!positive(x.g)))throw Error('확인되지 않은 재료량이 있어요. 먼저 실제 사용량을 저장해 주세요');
    const rows=pool(state),used=[],factor=form.count*form.unitG/meal.g;
    // 만들려는 음식과 같은 이름의 재료는 원재료에서만 가져온다.
    // (그러지 않으면 이미 만들어둔 준비식을 소비해서 같은 양을 다시 만드는 꼴이 되어 재고가 제자리에 머문다)
    for(const x of required){
      const self=norm(x.name)===norm(meal.name),t=take(rows,x.name,x.g*factor,self?['raw']:null);
      if(t.left>1e-6)throw Error(x.name+(self?' 원재료':'')+' 재고 부족 '+round(t.left)+'g');
      used.push(...t.used);
    }
    let next=mutate(state,used);next.ops=next.ops||{};
    const codes=new Set(next.prepared.map(x=>x.mealCode));let n=1;while(codes.has('M-'+n))n++;
    const lot={id:form.token,name:meal.name,mealKey:meal.key||'',plannedG:positive(meal.plannedG)?Number(meal.plannedG):Number(meal.g),unitG:form.unitG,remainingCount:form.count,originalCount:form.count,madeDate:form.date,mealCode:'M-'+n,source:'meal-prep-v63'};
    next.prepared.push(lot);next.ops[form.token]={type:'cook',used,lot:copy(lot)};
    return {state:splitResiduals(next)};
  }
  function undoCook(state,token){
    const receipt=state.ops&&state.ops[token];
    if(!receipt||receipt.type!=='cook')return {state,already:true};
    const next=copy(state),made=receipt.lot||{},idx=next.prepared.findIndex((x,i)=>id(x,i)===id(made,i));
    if(idx<0)throw Error('완료한 조리식 재고를 찾을 수 없어 자동 취소할 수 없어요');
    const cur=next.prepared[idx],expected=amount(made),current=amount(cur);
    if(Math.abs(current-expected)>1e-6||Number(cur.unitG)!==Number(made.unitG))throw Error('완료한 조리식 재고가 이미 사용·수정되어 자동 취소할 수 없어요');
    next.prepared.splice(idx,1);
    for(const u of receipt.used||[]){
      if(u.kind==='raw'){
        const v=next.raw&&next.raw[u.i];if(!v)throw Error('사용한 원재료 재고가 없어 자동 복구할 수 없어요');
        const factor=v.unit==='g'?1:Number(v.gramsPerUnit);if(!positive(factor)||Math.abs(factor-Number(u.unitG||factor))>1e-6)throw Error('사용한 원재료 단위가 변경되어 자동 복구할 수 없어요');
        v.qty=round(Number(v.qty)+Number(u.g)/factor);continue;
      }
      const arr=next[u.kind]||[],lot=arr.find((x,i)=>id(x,i)===u.id);
      if(!lot)throw Error('사용한 재고가 삭제되어 자동 복구할 수 없어요');
      if(Number(lot.unitG)!==Number(u.unitG))throw Error('사용한 재고 단위가 변경되어 자동 복구할 수 없어요');
      lot.remainingCount=round((amount(lot)+Number(u.g))/Number(lot.unitG));
    }
    delete next.ops[token];
    return {state:splitResiduals(next)};
  }
  function feed(state,meal,totalG){
    if(state.feeds&&state.feeds[meal.key])return {state,already:true};
    const serveG=positive(totalG)?Number(totalG):Number(meal.g);
    if(!positive(serveG))throw Error('제공량 확인이 필요해요');
    const baseG=positive(meal.g)?Number(meal.g):serveG,ratio=serveG/baseG,
      served={...meal,g:serveG,ingredients:(meal.ingredients||[]).map(x=>({...x,g:positive(x.g)?round(Number(x.g)*ratio):x.g}))},
      rows=pool(state,false),r=mealNeed(served,rows);
    for(const x of r.needs){if(!positive(x.g))throw Error('급여량 확인이 필요해요');const t=take(rows,x.name,x.g,['prepared','cubes']);if(t.left>1e-6)throw Error(x.name+' 조리식 재고 부족');r.used.push(...t.used);}
    if(!r.used.length)throw Error('차감할 조리식 재고가 없어요');
    const next=mutate(state,r.used);next.feeds=next.feeds||{};next.feeds[meal.key]={name:meal.name,servedG:serveG,used:r.used,at:Date.now()};
    return {state:splitResiduals(next)};
  }
  function undoFeed(state,key){
    const receipt=state.feeds&&state.feeds[key];if(!receipt)return {state,already:true};
    const next=copy(state);
    for(const u of receipt.used){const lot=next[u.kind][u.i];if(!lot||id(lot,u.i)!==u.id)throw Error('사용한 재고가 수정·삭제되어 자동 복구할 수 없어요');lot.remainingCount=round(amount(lot)+u.g)/Number(lot.unitG);}
    delete next.feeds[key];return {state:splitResiduals(next)};
  }
  const api={norm,amount,pool,plan,cook,undoCook,feed,undoFeed,isWholeMealLot};
  if(typeof module==='object'&&module.exports)module.exports=api;root.MealStockV63=api;
})(typeof globalThis!=='undefined'?globalThis:this);
