(function(){
  'use strict';
  if(typeof vShop!=='function')return;
  const prevShop=vShop;
  vShop=function(){
    const html=prevShop();
    if(window.__mgStage!=='stock'||typeof html!=='string')return html;
    return html.replace(
      '<select id="mg32Loc"><option>냉장</option><option>냉동</option></select>',
      '<select id="mg32Loc"><option>냉장</option><option>냉동</option><option>실온</option></select>'
    ).replace(
      '재료 추가에서 냉장/냉동과 입력 방식을 같이 고르면 됩니다.',
      '재료 추가에서 냉장/냉동/실온과 입력 방식을 같이 고르면 됩니다.'
    );
  };
  try{render(true)}catch(e){}
})();