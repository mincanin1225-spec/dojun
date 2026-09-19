(function(root){
  'use strict';
  const V=root.PpeuniVerifiedV49;
  if(!V)return;
  const oldText=typeof mText==='function'?mText:null;
  const oldObj=typeof mObj==='function'?mObj:null;
  const oldWeek=typeof weekList==='function'?weekList:null;
  const oldRender=typeof render==='function'?render:null;
  const DISPLAY_VER='v50';
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
    mObj=function(){return null};
    root.mObj=mObj;
  }

  function add(t,name,g,n=1,c='v'){
    name=String(name||'').trim();if(!name)return;
    const x=t[name]||(t[name]={c,g:0,n:0});
    x.g+=Number(g)||0;x.n+=Number(n)||0;
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
          if(e.stage==='late3')toks.forEach(n=>add(t,n,22.5,1,'v'));
          else toks.forEach(n=>add(t,n,20,1,'v'));
        }
      }
      return t;
    };
    root.weekList=weekList;
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
  root.__ppeuniVerifiedScheduleV50={entry,dplus,source:V.source,minD:V.minD,maxD:V.maxD};
})(typeof globalThis!=='undefined'?globalThis:this);
