// Mock chat buttons wiring (no server needed)
(function(){
  const $ = s=>document.querySelector(s);
  $('#bZap').onclick = ()=> window.HM_onBurst({power:1, band:'highs'});
  $('#bMosh').onclick = ()=> window.HM_onBurst({power:.6, band:'bass'});
  $('#bPalette').onclick = ()=> window.HM_onPalette('neon');
  $('#bDrop').onclick = ()=> window.HM_onDrop();
})();