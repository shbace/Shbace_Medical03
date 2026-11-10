#!/usr/bin/env python3
"""Assemble a separate iPhone-ready Shbace Medical PWA v2 release."""
from pathlib import Path
import argparse
import json
import shutil
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--source", default="www")
parser.add_argument("--icon", default="splash_icon.png")
parser.add_argument("--output", default="dist/site")
args = parser.parse_args()

source = Path(args.source).resolve()
icon_path = Path(args.icon).resolve()
output = Path(args.output).resolve()
if not (source / "index.html").is_file():
    raise SystemExit("Missing source application: www/index.html")
if not (source / "service-worker.js").is_file():
    raise SystemExit("Missing source service worker")
if not icon_path.is_file():
    raise SystemExit("Missing official Shbace Medical icon")

if output.exists():
    shutil.rmtree(output)
output.mkdir(parents=True)

# Keep the current published PWA untouched at the site root.
shutil.copytree(source, output, dirs_exist_ok=True)
shutil.copy2(icon_path, output / "splash_icon.png")

# Publish a physically separate v2 app tree so its manifest, scope and caches
# cannot be confused with the legacy installation.
v2 = output / "v2"
shutil.copytree(source, v2)
shutil.copy2(icon_path, v2 / "splash_icon.png")

icons = v2 / "icons"
icons.mkdir(parents=True, exist_ok=True)
with Image.open(icon_path) as original:
    image = original.convert("RGBA")
    side = min(image.width, image.height)
    x, y = (image.width-side)//2, (image.height-side)//2
    image = image.crop((x, y, x+side, y+side))
    for name, size in (("icon-192.png",192),("icon-512.png",512),("apple-touch-icon.png",180)):
        image.resize((size,size), Image.Resampling.LANCZOS).save(icons / name, "PNG", optimize=True)

manifest = {
    "id": "./",
    "name": "Shbace Medical",
    "short_name": "Shbace",
    "description": "Shbace Medical — medical learning and question bank",
    "start_url": "./pwa-boot.html?launch=1",
    "scope": "./",
    "display": "standalone",
    "display_override": ["standalone", "minimal-ui"],
    "orientation": "portrait-primary",
    "background_color": "#041329",
    "theme_color": "#071b38",
    "categories": ["education", "medical"],
    "icons": [
        {"src":"./icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
        {"src":"./icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
        {"src":"./icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
    ]
}
(v2 / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")

boot = r'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#071b38">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Shbace Medical">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
<title>Shbace Medical</title>
<style>
:root{color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#041329;color:#f4f9ff}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px 18px calc(24px + env(safe-area-inset-bottom));background:radial-gradient(ellipse at 50% 0%,#124b85 0%,#09264b 35%,#041329 76%);overflow-x:hidden}
main{width:min(100%,440px);text-align:center;padding:30px 24px 25px;border:1px solid #4dbdff55;border-radius:30px;background:linear-gradient(155deg,#102d50ee,#06172ded);box-shadow:0 24px 80px #0009,0 0 36px #078bff22;position:relative;overflow:hidden}
main:before{content:"";position:absolute;inset:0 12% auto;height:2px;background:linear-gradient(90deg,transparent,#20d8ff,transparent);box-shadow:0 0 18px #20cfff}
.logo{width:116px;height:116px;object-fit:contain;border-radius:25px;filter:drop-shadow(0 8px 20px #008cff66);margin:0 auto 18px}
h1{font-size:30px;line-height:1.15;letter-spacing:-.7px;margin:0;font-weight:850;direction:ltr}
h1 span{color:#20d8ff}
.tag{color:#a9c9e8;font-size:13px;letter-spacing:2.5px;margin:9px 0 20px;direction:ltr}
.desc{font-size:15px;line-height:1.9;color:#d6e8f8;margin:0 auto 22px;max-width:330px}
.open{display:flex;justify-content:center;align-items:center;min-height:54px;border-radius:16px;text-decoration:none;font-size:16px;font-weight:800;color:#04162c;background:linear-gradient(110deg,#63e4ff,#2798f5);box-shadow:0 9px 28px #087fe655}
.steps{margin:20px 0 0;padding:16px 15px;border:1px solid #5ab8ef30;border-radius:17px;background:#071c35;color:#bcd5eb;text-align:right;font-size:13px;line-height:2}
.steps b{color:#f3f9ff}
#status{font-size:12px;color:#70dfff;min-height:20px;margin:15px 0 0}
.version{font-size:10px;color:#7896b6;letter-spacing:1.6px;margin:13px 0 0;direction:ltr}
</style>
</head>
<body>
<main>
<img class="logo" src="./icons/icon-192.png" alt="Shbace Medical">
<h1>Shbace <span>Medical</span></h1>
<p class="tag">LEARN · PRACTICE · EXCEL</p>
<p class="desc">منصة التعلّم الطبي — نسختك الجديدة، جاهزة للإضافة إلى الشاشة الرئيسية.</p>
<a class="open" id="open" href="./index.html">افتح Shbace Medical</a>
<section class="steps">
<b>تثبيت التطبيق على iPhone</b><br>
1. افتح هذه الصفحة باستخدام Safari.<br>
2. اضغط زر المشاركة <b>Share</b>.<br>
3. اختر <b>Add to Home Screen</b>.<br>
4. فعّل <b>Open as Web App</b> ثم اضغط Add.
</section>
<p id="status" role="status" aria-live="polite">جارٍ تجهيز التطبيق للعمل دون اتصال…</p>
<p class="version">SHBACE MEDICAL · PWA V2</p>
</main>
<script>
(function(){
'use strict';
var status=document.getElementById('status');
var standalone=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone===true;
var launch=new URLSearchParams(location.search).get('launch')==='1'||standalone;
(async function(){
 try{
  if('serviceWorker' in navigator&&location.protocol==='https:'){
   await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
   await navigator.serviceWorker.ready;
   status.textContent='تم تجهيز دعم العمل دون اتصال.';
  }else{status.textContent='افتح الرابط عبر HTTPS لتفعيل وضع التطبيق.';}
 }catch(e){status.textContent='يمكن فتح التطبيق، لكن تعذّر تجهيز التخزين دون اتصال.';}
 if(launch) location.replace('./index.html');
})();
})();
</script>
</body>
</html>
'''
(v2 / "pwa-boot.html").write_text(boot, encoding="utf-8")

worker = r'''/* Shbace Medical PWA v2 — isolated cache namespace and app scope. */
'use strict';
const CACHE_PREFIX='shbace-medical-pwa-v2-';
const CACHE_NAME=CACHE_PREFIX+'2026-11-10-1';
const SCOPE=self.registration.scope;
const SHELL=['./pwa-boot.html','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'].map(path=>new URL(path,SCOPE).href);
function cacheable(response,url){
 if(!response||!response.ok||response.type!=='basic'||url.origin!==self.location.origin)return false;
 const n=Number(response.headers.get('content-length')||0);
 return !n||n<=30*1024*1024;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 await Promise.all(SHELL.map(async href=>{try{const response=await fetch(new Request(href,{cache:'reload'}));if(cacheable(response,new URL(href)))await cache.put(href,response.clone());}catch(_){}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.href.startsWith(SCOPE))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(request);if(cacheable(response,url)){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;}
   catch(_){const cache=await caches.open(CACHE_NAME);return await cache.match(request,{ignoreSearch:true})||await cache.match(new URL('./index.html',SCOPE).href)||await cache.match(new URL('./pwa-boot.html',SCOPE).href)||new Response('Shbace Medical is unavailable offline. Connect once to load the app.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
  })());return;
 }
 if(['script','style','image','font','worker'].includes(request.destination)||/\.(?:js|css|png|jpe?g|webp|svg|woff2?|ttf|json)$/i.test(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME),cached=await cache.match(request);
   const refresh=fetch(request).then(async response=>{if(cacheable(response,url))await cache.put(request,response.clone());return response;});
   if(cached){event.waitUntil(refresh.catch(()=>undefined));return cached;}
   try{return await refresh;}catch(_){return new Response('',{status:504,statusText:'Offline asset unavailable'});}
  })());
 }
});
'''
(v2 / "service-worker.js").write_text(worker, encoding="utf-8")
(output / ".nojekyll").write_text("", encoding="utf-8")
print(f"Prepared legacy PWA and isolated v2 release at {output}")
print(f"New iPhone URL path: /v2/pwa-boot.html")
