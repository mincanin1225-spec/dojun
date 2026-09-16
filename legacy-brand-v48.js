(function(){
  'use strict';
  const APP_NAME='도준이키우기';
  const DISPLAY_VER='v48';
  let manifestUrl='';

  function patchManifest(){
    document.title=APP_NAME;
    const h=document.querySelector('.appbar h1');if(h)h.textContent=APP_NAME;
    let a=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!a){a=document.createElement('meta');a.setAttribute('name','apple-mobile-web-app-title');document.head.appendChild(a)}
    a.setAttribute('content',APP_NAME);
    let app=document.querySelector('meta[name="application-name"]');
    if(!app){app=document.createElement('meta');app.setAttribute('name','application-name');document.head.appendChild(app)}
    app.setAttribute('content',APP_NAME);

    const old=[...document.querySelectorAll('link[rel="manifest"]')];
    if(old.some(x=>x.dataset.dojunV48==='1'))return;
    old.forEach(x=>x.remove());
    try{if(manifestUrl)URL.revokeObjectURL(manifestUrl)}catch(e){}
    const mf={name:APP_NAME,short_name:APP_NAME,start_url:'./',scope:'./',display:'standalone',background_color:'#FFF8F1',theme_color:'#FFF8F1',orientation:'portrait',lang:'ko'};
    manifestUrl=URL.createObjectURL(new Blob([JSON.stringify(mf)],{type:'application/manifest+json'}));
    const l=document.createElement('link');l.rel='manifest';l.href=manifestUrl;l.dataset.dojunV48='1';document.head.appendChild(l);
  }

  function patchVersion(){
    document.querySelectorAll('.card .hint').forEach(el=>{
      if(!/버전\s*v(?:24|39|40|41|42|43|44|45|46|47)\b/.test(el.textContent||''))return;
      el.innerHTML=el.innerHTML
        .replace(/버전\s*<b([^>]*)>v(?:24|39|40|41|42|43|44|45|46|47)<\/b>/,`버전 <b$1>${DISPLAY_VER}</b>`)
        .replace(/버전\s*v(?:24|39|40|41|42|43|44|45|46|47)\b/,`버전 ${DISPLAY_VER}`);
    });
  }

  function apply(){patchManifest();patchVersion()}
  apply();setTimeout(apply,0);setTimeout(apply,150);
  const obs=new MutationObserver(()=>{patchManifest();patchVersion()});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
