
/* Splash ECG v17 — same drawing, colours, glow and heart sync as v16; only the clock changed.
   - The head is driven by the real clock (not an accumulated frame counter), so a slow frame can never make it fall behind.
   - Three left->right sweeps fill exactly the approved 7 s splash hold: the last sweep ends on the far-right edge at the very end of the hold.
   - The moment the head touches the right edge it publishes window.__spEcg.done (+ 'spEcgDone'); the splash transition starts only after that,
     and a short finishing bloom (trace + head ring) plays while the splash pulls back into the portal glow.
   - Heart contraction / haptic stay locked to the R peak of every complex (same event). */
(function(){
 var cv=document.getElementById('spEcgCv'),el=document.getElementById('startupSplash');
 if(!cv||!el)return;
 var ctx=cv.getContext('2d');if(!ctx)return;
 var host=cv.parentNode,beatEl=el.querySelector('.sp-beat');
 var E=window.__spEcg={t0:null,done:false,end:0};
 var L=7000,SW=3,N=3,S=L/SW,P=S/N,PR=0.5,FL=640,W=0,H=0,dpr=1,ys=null,yb=0,AM=0,fired=0;
 var rm=false;try{rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
 function g(p,c,s,a){var z=(p-c)/s;return a*Math.exp(-z*z/2)}
 function beat(q){return g(q,0.300,0.034,0.13)+g(q,0.4775,0.0075,-0.17)+g(q,PR,0.0082,1)+g(q,0.5275,0.009,-0.32)+g(q,0.705,0.058,0.30)}
 function wave(p){var v=0,q=p*N;for(var k=0;k<N;k++)v+=beat(q-k);return v}
 function size(){
  var r=host.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);
  var w=Math.max(2,Math.round(r.width*dpr)),h=Math.max(2,Math.round(r.height*dpr));
  if(w===W&&h===H)return;
  W=cv.width=w;H=cv.height=h;yb=H*0.62;AM=H*0.53;
  ys=new Float32Array(W+1);for(var i=0;i<=W;i++)ys[i]=yb-AM*wave(i/W);
  ctx.lineJoin='round';ctx.lineCap='round';
 }
 function trace(i0,i1){ctx.beginPath();ctx.moveTo(i0,ys[i0]);for(var i=i0+1;i<=i1;i++)ctx.lineTo(i,ys[i])}
 function stroke(i0,i1,gx1,gx2){
  if(i1<=i0)return;
  var gr=ctx.createLinearGradient(gx1,0,gx2,0);
  gr.addColorStop(0,'rgba(170,236,255,1)');gr.addColorStop(1,'rgba(120,214,255,0)');
  ctx.strokeStyle=gr;trace(i0,i1);
  ctx.save();ctx.globalAlpha=0.13;ctx.lineWidth=dpr*11;ctx.stroke();ctx.restore();
  ctx.save();ctx.globalAlpha=0.6;ctx.lineWidth=dpr*5;ctx.shadowColor='rgba(40,160,255,0.95)';ctx.shadowBlur=dpr*15;ctx.stroke();ctx.restore();
  ctx.lineWidth=dpr*2.3;ctx.stroke();
 }
 function draw(et,now){
  ctx.clearRect(0,0,W,H);
  var m=Math.min(SW-1,Math.floor(et/S)),ph=(et>=L)?1:(et-m*S)/S,head=ph*W,ih=Math.min(W,Math.max(0,Math.round(head))),A=W*0.7;
  var fl=(et>=L)?Math.min(1,Math.max(0,(now-(E.t0+L))/FL)):1,f=1-fl;      /* f: 1 -> 0 during the finishing bloom */
  if(m>0&&ih<W)stroke(ih,W,head+W,head+W-A);   /* previous sweep, ahead of the head, fading out */
  stroke(0,ih,head,head-A);                      /* current sweep, formed behind the head */
  var hy=ys[ih],rr=dpr*(11+8*f),rg=ctx.createRadialGradient(ih,hy,0,ih,hy,rr);
  rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(0.28,'rgba(170,225,255,0.9)');rg.addColorStop(1,'rgba(56,170,255,0)');
  ctx.fillStyle=rg;ctx.beginPath();ctx.arc(ih,hy,rr,0,6.2832);ctx.fill();
  if(f>0){                                       /* finishing bloom: the whole trace flares once and a ring leaves the head on the right edge */
   var e=1-f*f,g2=ctx.createLinearGradient(W,0,W-A*1.15,0);
   g2.addColorStop(0,'rgba(220,250,255,1)');g2.addColorStop(1,'rgba(120,214,255,0)');
   ctx.save();ctx.globalAlpha=0.55*f;ctx.lineWidth=dpr*3.4;ctx.shadowColor='rgba(150,232,255,1)';ctx.shadowBlur=dpr*(30*f+6);ctx.strokeStyle=g2;trace(0,W);ctx.stroke();ctx.restore();
   ctx.save();ctx.globalAlpha=0.8*f;ctx.lineWidth=dpr*2;ctx.strokeStyle='rgba(170,232,255,1)';ctx.shadowColor='rgba(60,170,255,0.9)';ctx.shadowBlur=dpr*14;
   ctx.beginPath();ctx.arc(W-dpr*3,hy,dpr*11+(H*0.85)*e,0,6.2832);ctx.stroke();ctx.restore();
  }
 }
 function fire(){
  if(beatEl){beatEl.classList.remove('go');void beatEl.offsetWidth;beatEl.classList.add('go')}
  try{if(typeof window.__spR==='function')window.__spR()}catch(e){}
 }
 function begin(now){
  try{L=SPLASH_DURATION_MS||L}catch(e){}
  S=L/SW;P=S/N;
  if(beatEl)beatEl.style.setProperty('animation-duration',P.toFixed(1)+'ms','important');   /* heart cycle = ECG beat period */
  /* the 7 s hold is counted from the first painted frame of the trace, so the head and the hold always end together */
  try{if(splashDeadline&&!splashFinalized)splashDeadline=Date.now()+L-(performance.now()-now)}catch(e){}
 }
 function frame(now){
  if(!el.isConnected)return;
  if(E.t0===null){E.t0=now;begin(now)}
  var et=now-E.t0;if(et<0)et=0;
  var run=et>L?L:et;
  var n=(run/P>=PR)?Math.floor(run/P-PR)+1:0;
  if(n>fired){var age=run-(n-1+PR)*P;fired=n;if(age<140)fire()}   /* never replay a missed beat after a stalled frame */
  if(et>=L&&!E.done){E.done=true;E.end=now;try{document.dispatchEvent(new Event('spEcgDone'))}catch(e){}}
  draw(run,now);
  if(E.done&&now-E.end>=FL)return;
  requestAnimationFrame(frame);
 }
 size();window.addEventListener('resize',function(){size();if(E.done&&el.isConnected)draw(L,1e12)});
 if(rm){E.t0=performance.now();draw(L,1e12);E.done=true;return}
 draw(0,0);                                         /* first frame: head on the far-left edge, nothing else on screen */
 requestAnimationFrame(frame);
})();
