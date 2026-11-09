
/* v47: the small heart sprite used to decode/paint long before the 1290x2796 poster, so for a few frames it floated alone on the dark
   blurred backdrop (and the poster then faded in with a scale while the sprite did not). Everything inside the splash now stays hidden
   until BOTH images are decoded, then the whole splash fades in as ONE layer. Safety timeout: never blocks the splash. */
(function(){var el=document.getElementById('startupSplash');if(!el)return;var done=false;
 function go(){if(done)return;done=true;requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('sp-ready')})})}
 var imgs=[].slice.call(el.querySelectorAll('img.splash-poster,img.sp-beat'));
 try{Promise.all(imgs.map(function(i){return(i.decode?i.decode():Promise.resolve()).catch(function(){})})).then(go,go)}catch(e){go()}
 setTimeout(go,1600);
 /* v47 ROOT CAUSE of the splash glitch: .sp-frame (heart sprite + ECG) was sized from 100vw/100dvh formulas while the poster is drawn inside the
    container's REAL box with object-fit. When the visible height differs from dvh (browser bar, WebView insets, odd aspect ratios) the sprite
    drifted off the poster: the erased-heart patch edges and a stray ECG column showed. The frame now copies the poster's exact rendered box. */
 var fr=el.querySelector('.sp-frame'),po=el.querySelector('img.splash-poster');
 function fit(){if(!fr||!po)return;var W=el.clientWidth,H=el.clientHeight;if(!W||!H)return;
  var cover=getComputedStyle(po).objectFit==='cover',k=cover?Math.max(W/1290,H/2796):Math.min(W/1290,H/2796);
  fr.style.width=(1290*k)+'px';fr.style.height=(2796*k)+'px';fr.style.left='50%';fr.style.top='50%'}
 fit();
 try{new ResizeObserver(fit).observe(el)}catch(e){}
 addEventListener('resize',fit);addEventListener('orientationchange',fit);
 if(window.visualViewport)visualViewport.addEventListener('resize',fit);
})();
