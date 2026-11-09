/*
 * Shbace Medical - native bridge (runs inside the Capacitor WebView, injected via <script src="./native-bridge.js">).
 *
 * Dependency-free on purpose: it uses the `window.Capacitor` runtime that Capacitor injects into every page,
 * so the file works whether or not `npm run build` (esbuild) was run. It does NOT touch the page's design
 * or logic; it only
 *   1. keeps the existing heart-beat haptics bridge (window.ShbaceHaptics),
 *   2. registers the @capacitor/app plugin so the page can use Capacitor.Plugins.App ('backButton', exitApp),
 *   3. releases the native splash screen after the first paint (window.ShbaceInsets.ready()),
 *   4. schedules LOCAL notifications (Smart Review due / daily study reminder) from localStorage,
 *      respecting 'shbace_notif_prefs_v1' (review, quiz, reminders, updates) - no server, no Firebase,
 *   5. opens the right page when a notification / launcher shortcut is tapped.
 */
(function () {
  'use strict';

  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  var DAY = 24 * 60 * 60 * 1000;
  var noop = function () {};

  function plug(name) {
    try { return C.registerPlugin(name); } catch (e) { return null; }
  }
  function ls(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------ 1. haptics (unchanged behaviour) */
  if (native) {
    var Haptics = plug('Haptics');
    if (Haptics) {
      window.ShbaceHaptics = {
        vibrate: function (o) {
          o = o || {};
          return Haptics.vibrate({ duration: o.duration == null ? 300 : o.duration });
        },
        impact: function (o) {
          var s = o && o.style;
          return Haptics.impact({ style: s === 'HEAVY' ? 'HEAVY' : s === 'MEDIUM' ? 'MEDIUM' : 'LIGHT' });
        }
      };
    }
  }

  if (!native) {           // plain browser: keep the page's own navigator.vibrate fallback
    window.ShbaceNative = { plan: null, sync: noop, route: noop };
    return;
  }

  /* ------------------------------------------------------------------ 2. App plugin (back button lives in the page) */
  var App = plug('App');          // makes Capacitor.Plugins.App available to the page

  /* ------------------------------------------------------------------ 3. release the native splash after first paint */
  function signalReady() {
    try {
      if (window.ShbaceInsets && typeof window.ShbaceInsets.ready === 'function') window.ShbaceInsets.ready();
    } catch (e) {}
  }
  function afterPaint(fn) {
    var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    raf(function () { raf(fn); });
  }
  if (document.readyState === 'complete') afterPaint(signalReady);
  else window.addEventListener('load', function () { afterPaint(signalReady); });

  /* ------------------------------------------------------------------ 4. local notifications */
  var LN = plug('LocalNotifications');
  var ID_REVIEW = 7101, ID_REMINDER = 7102;

  function onboarded() {
    try { return localStorage.getItem('shbace_onboarding_v3_complete') === '1'; } catch (e) { return false; }
  }
  function prefs() {
    var p = ls('shbace_notif_prefs_v1') || {};
    return { review: p.review !== false, quiz: p.quiz !== false, reminders: p.reminders !== false, updates: p.updates !== false };
  }
  function at(ms, h) {                      // local time h:00 on the day of ms (DST safe)
    var d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0, 0, 0).getTime();
  }
  function nextSlot(minMs, hours) {         // first local h:00 (from the list) that is >= minMs
    for (var day = 0; day < 3; day++) {
      for (var i = 0; i < hours.length; i++) {
        var t = at(minMs + day * DAY, hours[i]);
        if (t >= minMs) return t;
      }
    }
    return minMs;
  }
  function clampWaking(ms) {                // keep notifications inside 08:00-21:59 local time
    var h = new Date(ms).getHours();
    if (h < 8) return at(ms, 8);
    if (h >= 22) return at(ms + DAY, 8);
    return ms;
  }
  function dayKey(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }
  function lastActivity() {
    var last = 0, qb = ls('shbace_qb_v6') || {}, ans = qb.ans || {}, quiz = ls('shbace_quiz_v1') || {};
    Object.keys(ans).forEach(function (k) {
      var t = Number(ans[k] && ans[k].t);
      if (isFinite(t) && t > last) last = t;
    });
    (Array.isArray(quiz.attempts) ? quiz.attempts : []).forEach(function (a) {
      var t = Number(a && a.end);
      if (isFinite(t) && t > last) last = t;
    });
    return last;
  }

  /** Pure planner: which local notifications should exist right now. */
  function plan(now) {
    var out = [], pf = prefs();

    if (pf.review) {
      var qb = ls('shbace_qb_v6') || {}, sr = qb.sr || {}, dues = [];
      Object.keys(sr).forEach(function (id) {
        var d = Number(sr[id] && sr[id].due);
        if (isFinite(d) && d > 0) dues.push(d);
      });
      dues.sort(function (a, b) { return a - b; });
      if (dues.length) {
        var when;
        if (dues[0] <= now) when = nextSlot(now + 60 * 60 * 1000, [9, 13, 18]);   // already due: nudge at the next slot
        else when = Math.max(clampWaking(dues[0]), now + 60 * 1000);
        if (when - now <= 60 * DAY) {
          var n = dues.filter(function (d) { return d <= when; }).length;
          out.push({
            id: ID_REVIEW, channelId: 'review', title: 'Smart Review due',
            body: n + (n === 1 ? ' question is' : ' questions are') + ' ready for review.',
            at: when, extra: { route: 'review' }
          });
        }
      }
    }

    if (pf.reminders) {
      var t = at(now, 19);                               // daily 19:00
      var last = lastActivity();
      if ((last && dayKey(last) === dayKey(now)) || t <= now + 60 * 1000) t = at(now + DAY, 19);   // already studied today / too late
      out.push({
        id: ID_REMINDER, channelId: 'reminders', title: 'Time to study',
        body: 'A short Question Bank session today keeps your progress moving.',
        at: t, repeats: true, every: 'day', extra: { route: 'subjects' }
      });
    }
    return out;
  }

  function toPlugin(n) {
    var sched = { at: new Date(n.at), allowWhileIdle: false };
    if (n.repeats) { sched.repeats = true; sched.every = n.every; }
    return { id: n.id, title: n.title, body: n.body, channelId: n.channelId, schedule: sched, extra: n.extra };
  }

  var chain = Promise.resolve();
  function sync() {                          // serialised: cancel ours, then schedule the fresh plan
    chain = chain.then(function () {
      if (!LN || !onboarded()) return;
      return LN.checkPermissions().then(function (p) {
        var granted = p && p.display === 'granted';
        return LN.cancel({ notifications: [{ id: ID_REVIEW }, { id: ID_REMINDER }] }).catch(noop).then(function () {
          if (!granted) return;
          var list = plan(Date.now());
          if (!list.length) return;
          return LN.schedule({ notifications: list.map(toPlugin) });
        });
      }).catch(noop);
    });
    return chain;
  }

  var asked = false;
  function ensurePermission() {              // asks once per process, only after onboarding and the web splash
    if (asked || !LN || !onboarded()) return Promise.resolve();
    var pf = prefs();
    if (!pf.review && !pf.reminders) return Promise.resolve();
    asked = true;
    return LN.checkPermissions().then(function (p) {
      if (p && (p.display === 'prompt' || p.display === 'prompt-with-rationale')) return LN.requestPermissions();
    }).catch(noop);
  }

  if (LN) {
    var polls = 0;
    (function waitForApp() {                 // start once the web splash is gone (max ~40 s)
      if (!document.getElementById('startupSplash') && onboarded()) {
        ensurePermission().then(sync);
        return;
      }
      if (++polls < 40) setTimeout(waitForApp, 1000);
    })();

    document.addEventListener('visibilitychange', function () { sync(); });
    if (App) {
      App.addListener('appStateChange', function () { sync(); });
    }
    LN.addListener('localNotificationActionPerformed', function (ev) {
      var r = ev && ev.notification && ev.notification.extra && ev.notification.extra.route;
      route(r);
    });
  }

  /* ------------------------------------------------------------------ 5. open a page from a notification / shortcut */
  var ROUTES = ['review', 'quiz', 'questions', 'subjects'];
  function route(name) {
    if (ROUTES.indexOf(name) < 0) return;
    var tries = 0;
    (function go() {
      try {
        var ready = !document.getElementById('startupSplash') && onboarded() &&
          typeof renderAppDemo === 'function' && typeof mode !== 'undefined' && mode === 'app';
        if (ready) {
          if (appPage !== 'quizrun' && appPage !== name) { appPage = name; renderAppDemo(); }   // never abandon a running quiz
          return;
        }
      } catch (e) {}
      if (++tries < 60) setTimeout(go, 500);
    })();
  }
  function handleUrl(url) {
    var m = /^shbace:\/\/route\/([a-z]+)/.exec(String(url || ''));
    if (m) route(m[1]);
  }
  if (App) {
    App.addListener('appUrlOpen', function (ev) { handleUrl(ev && ev.url); });
    try {
      var lp = App.getLaunchUrl();
      if (lp && typeof lp.then === 'function') lp.then(function (r) { if (r && r.url) handleUrl(r.url); }).catch(noop);
    } catch (e) {}
  }

  window.ShbaceNative = { plan: plan, sync: sync, route: route };   // small debug / test surface
})();
