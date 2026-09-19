(function(root){
  'use strict';
  const V=root.PpeuniVerifiedV49;
  if(!V)return;
  const oldText=typeof mText==='function'?mText:null;
  const oldObj=typeof mObj==='function'?mObj:null;
  const oldWeek=typeof weekList==='function'?weekList:null;
  const oldRender=typeof render==='function'?render:null;
  const oldBatch=typeof batchPlan==='function'?batchPlan:null;
  const oldBMainSteps=typeof bMainSteps==='function'?bMainSteps:null;
  const DISPLAY_VER='v51';
  const DAY=86400000;

  function dplus(on){
    try{return Math.round((P(on).getTime()-P(V.birth).getTime())/DAY)+1}catch(e){return null}
  }
  function entry(on){const d=dplus(on);return d==null?null:V.byD[d]||null}
  function manual(on,i){
    try{
      const M=fixM(months[mk(on)]),o=M?.d?.ov?.[on];
      if(o&&o[i]!==undefined&&o[i]!==null&&String(o[i]).trim()!=='')return String(o[i]).trim();
      if(isDel(on))return '';
    }catch(e){}
    return null;
  }
  function mealText(m){
    if(!m)return'';
    const parts=[];
    if(m.base)parts.push(m.base);
    if(m.t)parts.push(...String(m.t).split(/\s+/).filter(Boolean));
    return parts.join(' · ');
  }

  if(oldText){
    mText=function(on,i){
      const x=manual(on,i);if(x!==null)return x;
      const e=entry(on);if(e&&e.meals&&e.meals[i])return mealText(e.meals[i]);
      return '';
    };
    root.mText=mText;
  }
  if(oldObj){
    mObj=function(on,i){
      const x=manual(on,i);if(x!==null)return null;
      const e=entry(on);if(e&&e.meals&&e.meals[i])return null;
      return oldObj(on,i);
    };
    root.mObj=mObj;
  }

  const STOCK_ALIAS={'비타민':'비타민채','달걀':'계란','치즈':'아기 치즈'};
  const stockName=n=>STOCK_ALIAS[String(n||'').trim()]||String(n||'').trim();
  function add(t,name,g,n=1,c='v',gMax=null){
    name=stockName(name);if(!name)return;
    const x=t[name]||(t[name]={c,g:0,n:0});
    x.g+=Number(g)||0;x.n+=Number(n)||0;
    if(Number(gMax)>0)x.gMax=(Number(x.gMax)||0)+Number(gMax);
  }
  if(oldWeek){
    weekList=function(start,count=7){
      const t={};
      for(let q=0;q<count;q++){
        const on=addD(start,q),e=entry(on);if(!e)continue;
        for(const m of e.meals||[]){
          if(e.stage==='complete'){
            add(t,mealText(m),0,1,'e');
            continue;
          }
          add(t,'밥 (조리 후)',100,1,'e');
          const toks=String(m.t||'').split(/\s+/).filter(Boolean);
          if(e.stage==='late3')toks.forEach(n=>add(t,n,20,1,'v',25));
          else toks.forEach(n=>add(t,n,20,1,'v'));
        }
      }
      return t;
    };
    root.weekList=weekList;
  }

  function verifiedBatchRows(start,count){
    const map={},rows=[];let meals=0;
    for(let q=0;q<count;q++){
      const on=addD(start,q),e=entry(on);if(!e)continue;
      for(const m of e.meals||[]){
        const name=mealText(m);if(!name)continue;meals++;
        const key=e.stage+'|'+name,r=map[key]||(map[key]={name,stage:e.stage,base:m.base||'',tokens:String(m.t||'').split(/\\s+/).filter(Boolean),n:0});r.n++;
      }
    }
    for(const r of Object.values(map)){
      const ing=[];
      if(r.stage==='complete')ing.push('세부 재료량은 원본 레시피 확인');
      else{
        if(r.base)ing.push(\`${r.base} ${100*r.n}g (100g × ${r.n}회)\`);
        for(const n of r.tokens){
          if(r.stage==='late3')ing.push(\`${n} ${20*r.n}~${25*r.n}g (20~25g × ${r.n}회)\`);
          else ing.push(\`${n} ${20*r.n}g (20g × ${r.n}회)\`);
        }
      }
      rows.push({name:r.name,n:r.n,ing,o:{__ppeuni:true,stage:r.stage}});
    }
    return{meals,rows};
  }
  if(oldBatch){
    batchPlan=function(start,count=7){
      const fallback=oldBatch(start,count),v=verifiedBatchRows(start,count);
      if(!v.meals)return fallback;
      return{...fallback,meals:(fallback.meals||0)+v.meals,mains:[...(fallback.mains||[]),...v.rows]};
    };
    root.batchPlan=batchPlan;
  }
  if(oldBMainSteps){
    bMainSteps=function(o,A,n){
      if(o&&o.__ppeuni)return['뿐이 원본 식단표의 구성과 분량을 그대로 사용합니다.','조리법은 보유한 원본 레시피 기준으로 준비합니다.'];
      return oldBMainSteps(o,A,n);
    };
    root.bMainSteps=bMainSteps;
  }

  function patchVersion(){
    try{
      document.querySelectorAll('.card .hint').forEach(el=>{
        if(!/버전\s*v\d+/.test(el.textContent||''))return;
        el.innerHTML=el.innerHTML.replace(/버전\s*<b([^>]*)>v\d+<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`).replace(/버전\s*v\d+/, `버전 ${DISPLAY_VER}`);
      });
    }catch(e){}
  }
  function badge(){
    try{
      const d=dplus(today),e=entry(today);if(!e)return;
      let el=document.getElementById('ppeuniVerifiedV50');
      if(!el){el=document.createElement('div');el.id='ppeuniVerifiedV50';el.className='hint';el.style.cssText='margin:6px 16px 0;color:var(--mint);font-weight:800';const barEl=document.querySelector('.appbar');barEl?.insertAdjacentElement('afterend',el)}
      el.textContent=`뿐이 식단 원본 적용 · D+${d}`;
    }catch(e){}
  }
  function apply(){patchVersion();badge()}
  apply();setTimeout(apply,0);setTimeout(apply,250);
  try{const mo=new MutationObserver(()=>apply());mo.observe(document.body,{childList:true,subtree:true})}catch(e){}
  if(oldRender){try{setTimeout(()=>{render();apply()},0)}catch(e){}}
  root.__ppeuniVerifiedScheduleV51={entry,dplus,source:V.source,minD:V.minD,maxD:V.maxD};
})(typeof globalThis!=='undefined'?globalThis:this);
