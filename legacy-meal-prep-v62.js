(function(root){
  'use strict';
  if(typeof vShop!=='function'||typeof weekList!=='function'||typeof inventory==='undefined')return;

  var VERSION='v62';
  var PREP_KEY='dj:preparedMealInventory1';
  var CUBE_KEY='dj:cubeInventory2';
  var LOG_KEY='dj:mealPrepCompletionV62';
  var UNKNOWN_QTY=new Set(['김']);
  var RAW=new Set(['소고기','닭고기','돼지고기','흰살생선','생선','연어','새우','두부','달걀','계란','애호박','당근','양파','감자','고구마','단호박','브로콜리','양배추','배추','시금치','청경채','비타민','팽이버섯','느타리버섯','새송이버섯','양송이버섯','무','파프리카','가지','토마토','적채','비트','근대','케일','쑥갓','셀러리','콜라비','콩나물','숙주','오이','아스파라거스','연근','우엉','김','밤','치즈','그린빈']);
  var ALIAS={'비타민':'비타민채','달걀':'계란','생선':'생선','잡곡무른죽':'잡곡무른밥'};
  var PHRASES=['달걀그린빈 스크램블에그','케일달걀오믈렛','달걀케일','단호박건포도범벅','새우애호박조림','부추달걀스크램블','달걀부추','연어양파감자볼','닭안심소시지','소고기라구소스','돼지고기수육','오징어볼','쑥갓두부무침','매생이달걀찜','밥새우주먹밥','소고기가지볶음'];
  var oldView=vShop,oldWeek=weekList;

  function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
  function read(key,fallback){try{var v=JSON.parse(localStorage.getItem(key)||'');return v==null?fallback:v}catch(e){return fallback}}
  function write(key,v){localStorage.setItem(key,JSON.stringify(v))}
  function prepared(){var v=read(PREP_KEY,[]);return Array.isArray(v)?v:[]}
  function cubes(){var v=read(CUBE_KEY,[]);return Array.isArray(v)?v:[]}
  function logs(){var v=read(LOG_KEY,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
  function norm(n){n=String(n||'').trim();return ALIAS[n]||n}
  function menuText(m){var a=[];if(m&&m.base)a.push(m.base);if(m&&m.t)a=a.concat(String(m.t).split(/\s+/).filter(Boolean));return a.join(' · ')}
  function parts(m){
    var rest=String(m&&m.t||''),out=[];
    PHRASES.forEach(function(p){if(rest.indexOf(p)>=0){out.push({name:p,recipe:true});rest=rest.replace(p,' ')}});
    rest.split(/\s+/).filter(Boolean).forEach(function(n){out.push({name:n,recipe:!RAW.has(n)})});
    return out;
  }
  function entry(on){try{return root.__PPEUNI_SCHEDULE_V58&&root.__PPEUNI_SCHEDULE_V58.entry(on)}catch(e){return null}}
  function key(on,slot){return on+'|'+slot}
  function exactPreparedCount(on,slot,title){
    return prepared().filter(function(x){return (x.menuKey===key(on,slot)||(!x.menuKey&&norm(x.name)===norm(title)))&&(Number(x.remainingCount)||0)>0}).reduce(function(a,x){return a+(Number(x.remainingCount)||0)},0)
  }
  function requirements(e,m,portions,kimG){
    var req=[];
    if(m.base)req.push({name:'밥 (조리 후)',g:100*portions,label:m.base});
    parts(m).forEach(function(x){
      if(x.recipe)req.push({name:x.name,g:0,unknown:true,recipe:true});
      else if(x.name==='김')req.push({name:'김',g:kimG>0?kimG*portions:0,unknown:!(kimG>0)});
      else req.push({name:norm(x.name),g:20*portions});
    });
    return req;
  }
  function grams(v){if(!v)return 0;if(v.unit==='g')return Math.max(0,Number(v.qty)||0);if(Number(v.gramsPerUnit)>0)return Math.max(0,(Number(v.qty)||0)*Number(v.gramsPerUnit));return 0}
  function available(name){
    name=norm(name);var total=0;
    Object.keys(inventory||{}).forEach(function(k){if(norm(typeof invName==='function'?invName(k):k)===name)total+=grams(inventory[k])});
    cubes().forEach(function(b){if(norm(b.ingredient)===name)total+=Math.max(0,Number(b.remainingCount)||0)*Math.max(0,Number(b.unitG)||0)});
    return total;
  }
  function consume(name,need){
    name=norm(name);var left=Math.max(0,Number(need)||0),cb=cubes(),changed=[];
    cb.map(function(b,i){return{b:b,i:i}}).filter(function(x){return norm(x.b.ingredient)===name}).sort(function(a,b){return String(a.b.madeDate||'').localeCompare(String(b.b.madeDate||''))}).forEach(function(x){
      if(left<=0)return;var u=Number(x.b.unitG)||0,have=Number(x.b.remainingCount)||0;if(!u||!have)return;var take=Math.min(have,Math.ceil(left/u));x.b.remainingCount=have-take;left=Math.max(0,left-take*u)
    });
    write(CUBE_KEY,cb);
    Object.keys(inventory||{}).forEach(function(k){
      if(left<=0)return;var v=inventory[k];if(norm(typeof invName==='function'?invName(k):k)!==name||grams(v)<=0)return;
      if(v.unit==='g'){var take=Math.min(Number(v.qty)||0,left);v.qty=Math.max(0,(Number(v.qty)||0)-take);left-=take;changed.push(k)}
      else if(Number(v.gramsPerUnit)>0){var u=Number(v.gramsPerUnit),takeN=Math.min(Number(v.qty)||0,Math.ceil(left/u));v.qty=Math.max(0,(Number(v.qty)||0)-takeN);left=Math.max(0,left-takeN*u);changed.push(k)}
    });
    changed.forEach(function(k){inventory[k].updatedAt=Date.now()});
    try{if(changed.length&&typeof persistInventoryLocal==='function')persistInventoryLocal()}catch(e){}
    changed.forEach(function(k){try{if(typeof pushInventoryItem==='function')pushInventoryItem(k)}catch(e){}});
    return left<=0;
  }
  function planRows(start,count){
    var rows=[];
    for(var d=0;d<count;d++){
      var on=addD(start,d),e=entry(on);if(!e)continue;
      e.meals.forEach(function(m,i){rows.push({on:on,slot:i,e:e,m:m,title:menuText(m),have:exactPreparedCount(on,i,menuText(m))})});
    }
    return rows;
  }
  function recipe(r){
    var p=parts(r.m),kim=p.some(function(x){return x.name==='김'}),known=p.filter(function(x){return !x.recipe&&x.name!=='김'}).map(function(x){return norm(x.name)+' 20g'});
    var ingredients=[r.m.base?r.m.base+' 100g':''].concat(known).filter(Boolean);
    return '<div class="hint" style="margin-top:7px"><b>1.</b> 밥과 각 재료를 충분히 익혀 준비해요. <b>2.</b> 월령에 맞는 크기로 으깨거나 다져 섞어요. <b>3.</b> 한 끼씩 소분해 식힌 뒤 냉동해요.</div>'+
      '<div class="chips" style="margin-top:7px">'+ingredients.map(function(x){return'<span class="chip sm">'+esc(x)+'</span>'}).join('')+
      (kim?'<label class="chip sm">김 1끼량 <input data-v62-kim="'+esc(key(r.on,r.slot))+'" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="g" style="width:48px;border:0;background:transparent">g</label>':'')+'</div>'+
      (p.some(function(x){return x.recipe})?'<div class="hint" style="color:#B36B00">복합메뉴는 원본 레시피의 재료량을 확인한 뒤 조리해 주세요.</div>':'');
  }
  function prepView(base){
    var target=root.__mgWeekTarget==='next'?addD(weekCur,7):weekCur;
    var wins=[{start:target,count:4,title:'1차 식단'},{start:addD(target,4),count:3,title:'2차 식단'}];
    var prefix=String(base||'').split(/<div class="sec"><h2>3단계 · 식단만들기<\/h2>/)[0];
    var html=prefix+'<div class="sec"><h2>3단계 · 식단 만들기</h2><span class="more">완성식 기준</span></div>'+
      '<div class="card"><b>만든 뒤에만 완료해 주세요</b><p class="hint">완료하면 사용한 원재료가 차감되고, 한 끼 소분이 완성식 냉동재고로 생겨요. 실제 급여 전에는 자동으로 완료되지 않습니다.</p></div>';
    wins.forEach(function(w){
      html+='<div class="sec"><h2>'+w.title+'</h2><span class="more">'+w.count+'일치</span></div>';
      planRows(w.start,w.count).forEach(function(r){var k=key(r.on,r.slot),made=logs()[k],need=Math.max(0,1-r.have);
        html+='<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px"><div><span class="hint">'+esc(r.on)+' · '+['아침','점심','저녁'][r.slot]+'</span><h3 style="margin:4px 0">'+esc(r.title)+'</h3></div><span class="chip sm '+(r.have?'ok':'')+'">완성식 '+r.have+'개</span></div>'+recipe(r)+
          '<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><label class="hint">이번에 만들 수량 <input data-v62-count="'+esc(k)+'" type="number" min="1" step="1" value="'+Math.max(1,need)+'" style="width:54px;padding:6px;border:1px solid var(--line);border-radius:8px">개</label><button class="btn pri" data-v62-complete="'+esc(k)+'" style="flex:1">'+(made?'추가 조리 완료':'조리 완료 · 냉동재고 생성')+'</button></div></div>';
      });
    });
    return html;
  }

  weekList=function(start,count){
    var t=oldWeek(start,count),kim=t['김'];
    if(kim){delete t['김'];t['김 · 레시피량 확인']={c:'e',g:0,n:Math.max(1,Number(kim.n)||Math.ceil((Number(kim.g)||0)/20))}}
    return t;
  };
  root.weekList=weekList;
  vShop=function(){var html=oldView();return root.__mgStage==='prep'?prepView(html):html};
  root.vShop=vShop;

  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-v62-complete]');if(!b)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    var k=b.getAttribute('data-v62-complete'),a=k.split('|'),on=a[0],slot=Number(a[1]),e=entry(on),m=e&&e.meals&&e.meals[slot];if(!m)return;
    var countEl=document.querySelector('[data-v62-count="'+k+'"]'),count=Math.max(1,Math.round(Number(countEl&&countEl.value)||1));
    var kimEl=document.querySelector('[data-v62-kim="'+k+'"]'),kimG=Number(kimEl&&kimEl.value)||0,req=requirements(e,m,count,kimG);
    var unknown=req.filter(function(x){return x.unknown});
    if(unknown.length){toast(unknown.some(function(x){return x.name==='김'})?'김의 1끼 실제 사용량을 먼저 입력해 주세요':'복합메뉴는 원본 레시피량 확인이 필요해요');return}
    var shortage=req.filter(function(x){return x.g>0&&available(x.name)<x.g});
    if(shortage.length){toast('재고 부족 · '+shortage.slice(0,2).map(function(x){return x.name+' '+Math.ceil(x.g-available(x.name))+'g'}).join(', '));return}
    if(!confirm(menuText(m)+' '+count+'개를 조리 완료하고 재고에 반영할까요?'))return;
    req.forEach(function(x){if(x.g>0)consume(x.name,x.g)});
    var p=prepared(),title=menuText(m),unitG=req.reduce(function(s,x){return s+(Number(x.g)||0)},0)/count,id='meal-'+on+'-'+slot+'-'+Date.now();
    p.push({id:id,name:title,menuKey:k,madeDate:new Date().toISOString().slice(0,10),unitG:Math.round(unitG*10)/10,originalCount:count,remainingCount:count,mealCode:'M-'+(p.length+1),source:'meal-prep-'+VERSION,note:on+' '+['아침','점심','저녁'][slot]+' 식단 조리'});write(PREP_KEY,p);
    var l=logs();l[k]={completedAt:Date.now(),count:count,preparedId:id};write(LOG_KEY,l);
    toast('조리 완료 · 완성식 '+count+'개를 냉동재고에 추가했어요');try{render(true)}catch(err){}
  },true);

  root.__MEAL_PREP_V62={requirements:requirements,preparedCount:exactPreparedCount,version:VERSION};
  try{render(true)}catch(e){}
})(typeof globalThis!=='undefined'?globalThis:this);
