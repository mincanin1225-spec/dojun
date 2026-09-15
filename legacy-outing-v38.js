(function(){
  'use strict';
  if(typeof render!=='function')return;

  const NAVER_SHORT='https://naver.me/xfboSqg8';
  const NAVER_LIVE='https://pages.map.naver.com/save-pages/web/detail-list/91225107a51946ed8cdb44cf9ce422ec?at=a';
  const baseRender=render;

  function injectCss(){
    if(document.getElementById('outing-v38-css'))return;
    const s=document.createElement('style');s.id='outing-v38-css';s.textContent=`
      .naver-live-card{margin:10px 0 14px;background:#fff;border:1px solid #dce8dc;border-radius:20px;padding:14px;box-shadow:var(--sh);overflow:hidden}
      .naver-live-head{display:flex;gap:10px;align-items:flex-start}.naver-live-logo{width:36px;height:36px;border-radius:11px;background:#03c75a;color:#fff;display:grid;place-items:center;font-size:19px;font-weight:900;flex:none}
      .naver-live-copy{min-width:0;flex:1}.naver-live-copy b{display:block;font-size:14px;line-height:1.35}.naver-live-copy span{display:block;margin-top:3px;font-size:11px;line-height:1.5;color:var(--muted);word-break:keep-all}
      .naver-live-badge{white-space:nowrap;border-radius:99px;padding:5px 8px;font-size:10px;font-weight:900;background:#effcf4;color:#167844}
      .naver-live-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.naver-live-tools button{min-height:39px;border-radius:12px;border:1px solid #cfe8d7;background:#fff;color:#167844;font-weight:800;font-size:11.5px;padding:8px 10px;word-break:keep-all}.naver-live-tools button:first-child{background:#03c75a;color:#fff;border-color:#03c75a}
      .naver-live-frame-wrap{position:relative;margin-top:11px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#f7faf8;min-height:410px}
      .naver-live-frame{display:block;width:100%;height:520px;border:0;background:#fff}
      .naver-live-note{font-size:10.5px;line-height:1.5;color:var(--muted);margin-top:8px;word-break:keep-all}
      @media(max-width:390px){.naver-live-tools{grid-template-columns:1fr}.naver-live-frame{height:480px}.naver-live-frame-wrap{min-height:380px}}
    `;document.head.appendChild(s);
  }

  function html(){
    return `<section id="naverLiveSection" class="naver-live-card"><div class="naver-live-head"><div class="naver-live-logo">N</div><div class="naver-live-copy"><b>네이버 저장목록</b><span>복사본을 따로 만들지 않고 네이버 원본 목록을 그대로 불러와 보여줘요. 네이버에서 추가·삭제하면 이 화면도 원본 기준으로 바뀝니다.</span></div><span class="naver-live-badge">실시간</span></div><div class="naver-live-tools"><button type="button" data-v38="reload">목록 다시 불러오기</button><button type="button" data-v38="open">네이버에서 크게 보기</button></div><div class="naver-live-frame-wrap"><iframe id="naverLiveFrame" class="naver-live-frame" src="${NAVER_LIVE}" title="도준이 네이버 저장목록" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="naver-live-note">네이버 보안정책 때문에 기기에서 내부 표시를 막는 경우에는 ‘네이버에서 크게 보기’를 누르면 같은 원본 목록이 바로 열려요.</div></section>`;
  }

  function mount(){
    if(typeof tab!=='undefined'&&tab!=='outing')return;injectCss();
    const main=document.querySelector('main');if(!main)return;
    if(document.getElementById('naverLiveSection'))return;
    const host=document.createElement('div');host.innerHTML=html();const node=host.firstElementChild;
    const hero=document.querySelector('.outing-hero');
    if(hero&&hero.nextSibling)main.insertBefore(node,hero.nextSibling);else main.prepend(node);
  }

  render=function(keep){const r=baseRender(keep);if(typeof tab!=='undefined'&&tab==='outing'){setTimeout(mount,0);setTimeout(mount,120)}return r};

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-v38]');if(!b)return;
    if(b.dataset.v38==='reload'){
      const f=document.getElementById('naverLiveFrame');if(f)f.src=`${NAVER_LIVE}&t=${Date.now()}`;return;
    }
    if(b.dataset.v38==='open')return window.open(NAVER_SHORT,'_blank','noopener');
  },true);

  injectCss();if(typeof tab!=='undefined'&&tab==='outing')setTimeout(mount,0);
})();
