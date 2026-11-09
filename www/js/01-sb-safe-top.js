
/* Status-bar safe area: publishes --sat (px) so nothing is drawn under the phone's status bar.
   1) uses env(safe-area-inset-top) when the WebView reports it;
   2) otherwise, inside an Android WebView/Capacitor shell, falls back to SB_FALLBACK_PX;
   3) override anytime with  window.SHBACE_STATUS_BAR_PX = <number>  (0 disables the fallback). */
(function(){
  var SB_FALLBACK_PX=28, d=document, r=d.documentElement;
  function envTop(){
    try{
      var p=d.createElement('div');
      p.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)';
      (d.body||r).appendChild(p);
      var v=parseFloat(getComputedStyle(p).paddingTop)||0;
      p.parentNode&&p.parentNode.removeChild(p);
      return v;
    }catch(e){return 0}
  }
  function isShell(){
    var ua=navigator.userAgent||'';
    if(!/Android/i.test(ua))return false;
    return /; wv\)/.test(ua)||!!window.Capacitor||!!window.cordova||/Version\/4\.0/.test(ua);
  }
  function apply(){
    var v=0;
    try{
      if(typeof window.SHBACE_STATUS_BAR_PX==='number')v=window.SHBACE_STATUS_BAR_PX;
      else{v=envTop();if(!v&&isShell())v=SB_FALLBACK_PX}
    }catch(e){}
    r.style.setProperty('--sat',Math.max(0,Math.round(v))+'px');
  }
  apply();
  d.addEventListener('DOMContentLoaded',apply);
  addEventListener('load',apply);
  addEventListener('resize',apply);
  addEventListener('orientationchange',function(){setTimeout(apply,250)});
})();
