/* Digital Nav Log, built into the app. Runs in its own shadow root so its styles never touch the app. */
(function () {
'use strict';
var CSS = ":host{\n  color-scheme:dark;\n  --bg:#0b1118; --panel:#121b26; --panel2:#182534; --line:#233245; --text:#e7eef6; --muted:#8fa3b8;\n  --accent:#4cc3ff; --accent-bg:rgba(76,195,255,.12); --good:#3ddc97; --warn:#ffb454; --bad:#ff6b6b; --pass:#5d7189;\n  --mono:ui-monospace,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace;\n  --sans:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;\n}\n:host([data-theme=\"light\"]){\n  color-scheme:light;\n  --bg:#eef2f7; --panel:#ffffff; --panel2:#f4f7fb; --line:#d5dde8; --text:#0f1b2a; --muted:#5a6b80;\n  --accent:#0a74c9; --accent-bg:rgba(10,116,201,.10); --good:#13875a; --warn:#b36b00; --bad:#c62d2d; --pass:#8a98a9;\n}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\n:host{display:block;margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.35;-webkit-user-select:text;user-select:text}\ninput,textarea,select{-webkit-user-select:text;user-select:text}\n.nl{padding-bottom:env(safe-area-inset-bottom)}\nbutton,input,select,textarea{font:inherit;color:inherit}\nbutton{cursor:pointer}\n.mono{font-family:var(--mono)}\n.hide{display:none!important}\n\n/* top bar */\n#top{position:sticky;top:0;z-index:30;background:var(--panel);border-bottom:1px solid var(--line);padding:0 12px 0}\n.bar{display:flex;align-items:center;gap:10px;min-height:52px;flex-wrap:wrap;padding:6px 0}\n.brand{font-weight:700;letter-spacing:.04em;font-size:13px;color:var(--accent);text-transform:uppercase}\n.flt{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;flex:1;min-width:200px}\n.flt b{font-size:19px;font-family:var(--mono)}\n.flt .rt{font-family:var(--mono);font-size:16px}\n.flt .sub{color:var(--muted);font-size:13px}\n.zulu{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--accent);min-width:78px;text-align:right}\n.btn{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 12px;min-height:40px;font-size:14px}\n.btn:active{filter:brightness(1.2)}\n.btn.primary{background:var(--accent);border-color:var(--accent);color:#04121c;font-weight:700}\n.btn.small{min-height:32px;padding:4px 10px;font-size:13px;border-radius:8px}\n.chk-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;border-radius:999px;padding:3px 10px;border:1px solid var(--line);background:var(--panel2);cursor:pointer}\n.chk-pill.ok{color:var(--good);border-color:color-mix(in srgb,var(--good) 50%,transparent)}\n.chk-pill.bad{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 60%,transparent)}\nnav.tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 -12px;padding:0 8px}\nnav.tabs::-webkit-scrollbar{display:none}\nnav.tabs button{background:none;border:0;border-bottom:3px solid transparent;padding:10px 14px;color:var(--muted);font-weight:600;white-space:nowrap;font-size:14px}\nnav.tabs button.on{color:var(--text);border-bottom-color:var(--accent)}\n\nmain{padding:12px;max-width:1500px;margin:0 auto}\n\n/* empty state */\n#empty{max-width:640px;margin:8vh auto;text-align:center;padding:0 16px}\n#empty h1{font-size:26px;margin:0 0 6px}\n#empty p{color:var(--muted);margin:6px 0}\n.drop{border:2px dashed var(--line);border-radius:18px;padding:34px 18px;margin:20px 0;background:var(--panel);transition:.15s}\n.drop.over{border-color:var(--accent);background:var(--accent-bg)}\n.drop .ic{font-size:40px}\n.recent{text-align:left;margin-top:18px}\n.recent h3{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px}\n.recent button{display:flex;width:100%;justify-content:space-between;align-items:center;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:6px}\n.recent .t{font-family:var(--mono)}\n.recent .d{color:var(--muted);font-size:12px}\n#busy{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:100}\n#busy div{background:var(--panel);border:1px solid var(--line);padding:20px 26px;border-radius:14px;font-weight:600}\n.err{background:color-mix(in srgb,var(--bad) 14%,var(--panel));border:1px solid var(--bad);border-radius:12px;padding:12px 14px;margin:12px 0;text-align:left}\n.warnbox{background:color-mix(in srgb,var(--warn) 14%,var(--panel));border:1px solid var(--warn);border-radius:12px;padding:10px 14px;margin:0 0 12px}\n\n/* summary strip */\n.sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px}\n.sum>div{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 12px;min-height:62px}\n.sum .k{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}\n.sum .v{font-family:var(--mono);font-size:21px;font-weight:700;margin-top:2px}\n.sum .s{font-size:12px;color:var(--muted);font-family:var(--mono)}\n.sum .next{grid-column:span 2;border-color:var(--accent);background:var(--accent-bg)}\n.early{color:var(--accent)} .late{color:var(--warn)} .good{color:var(--good)} .bad{color:var(--bad)}\n.ctl{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px}\n.ctl label{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px}\n.ctl input[type=text]{width:70px}\ninput[type=text],textarea,select{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 8px;min-height:34px;width:100%;outline:none}\ninput[type=text]:focus,textarea:focus{border-color:var(--accent)}\ninput.t4{font-family:var(--mono);text-align:center;letter-spacing:.04em;padding:6px 2px}\n.tog{display:inline-flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer;user-select:none}\n.tog.on{background:var(--accent-bg);border-color:var(--accent);color:var(--accent)}\n\n/* nav log grid */\n.navwrap{background:var(--panel);border:1px solid var(--line);border-radius:14px}\n.wp,.hdr{display:grid;align-items:center;column-gap:6px;padding:6px 10px;\n  grid-template-columns:46px 54px minmax(150px,1.3fr) 66px 58px 70px 70px 52px 56px 64px 78px 84px;\n  grid-template-areas:\"chk awy name dist et eta ata fl mach gs fuel act\"}\n.hdr{position:sticky;top:var(--hdrh,96px);z-index:5;background:var(--panel2);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--line);padding-top:8px;padding-bottom:8px;border-radius:13px 13px 0 0}\n.hdr>div{line-height:1.15}\n.hdr small{display:block;text-transform:none;letter-spacing:0;opacity:.8}\n.c-chk{grid-area:chk}.c-awy{grid-area:awy}.c-name{grid-area:name}.c-crs{grid-area:crs}.c-dist{grid-area:dist}.c-et{grid-area:et}\n.c-eta{grid-area:eta}.c-ata{grid-area:ata}.c-fl{grid-area:fl}.c-mach{grid-area:mach}.c-gs{grid-area:gs}.c-wind{grid-area:wind}\n.c-fuel{grid-area:fuel}.c-act{grid-area:act}\n.wp{border-bottom:1px solid var(--line);min-height:58px;position:relative}\n.wp:last-child{border-bottom:0}\n.wp .big{font-family:var(--mono);font-size:15px;font-weight:600}\n.wp .sm{font-family:var(--mono);font-size:11.5px;color:var(--muted)}\n.wp .lab{display:none}\n.nm{font-family:var(--mono);font-size:17px;font-weight:700;letter-spacing:.02em}\n.nm .ex{font-size:12px;color:var(--muted);font-weight:500;margin-left:6px}\n.desc{font-size:12px;color:var(--muted)}\n.awy{font-family:var(--mono);font-size:12.5px;color:var(--accent);font-weight:600}\n.pos{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.01em}\n.wp.pseudo{background:var(--panel2);min-height:44px}\n.susp{font-size:11.5px;line-height:1.3;color:var(--warn);margin-top:3px}\n.wp:has(.susp){box-shadow:inset 3px 0 0 var(--warn)}\n.wp.pseudo .nm{font-size:14px;color:var(--muted)}\n.wp.passed{opacity:.5}\n.wp.passed .nm{text-decoration:line-through;text-decoration-color:var(--pass)}\n.wp.next{background:var(--accent-bg);box-shadow:inset 4px 0 0 var(--accent)}\n.passbtn{width:38px;height:38px;border-radius:50%;border:2px solid var(--line);background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:18px;color:transparent;padding:0}\n.wp.next .passbtn{border-color:var(--accent)}\n.wp.passed .passbtn{background:var(--good);border-color:var(--good);color:#04180f}\n.phase{display:inline-block;font-family:var(--mono);font-size:11px;font-weight:700;padding:1px 6px;border-radius:5px;background:var(--panel2);border:1px solid var(--line);color:var(--muted)}\n.phase.clb{color:var(--good)} .phase.dsc{color:var(--warn)}\n.flchg{color:var(--warn)}\n.eta .big{color:var(--accent)}\n.delta{font-family:var(--mono);font-size:11.5px}\n.wp input.t4{width:100%}\n.actwrap{display:flex;flex-direction:column;gap:2px}\n.notebtn{position:absolute;right:4px;top:3px;background:none;border:0;color:var(--muted);font-size:13px;padding:2px 6px;opacity:.6}\n.notebtn.has{color:var(--warn);opacity:1}\n.noterow{grid-column:1/-1;padding:2px 0 4px 50px}\n.noterow input{font-size:14px}\n\n/* events */\n.ev{display:flex;gap:10px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--line);font-size:13px;flex-wrap:wrap}\n.ev .ic{width:22px;text-align:center}\n.ev.fir{background:linear-gradient(90deg,rgba(155,120,255,.16),transparent 70%);color:var(--text)}\n.ev.fir b{font-family:var(--mono)}\n.ev.fir input{max-width:150px;margin-left:auto}\n.ev.etops{background:linear-gradient(90deg,rgba(61,220,151,.14),transparent 70%)}\n.ev.cp{background:linear-gradient(90deg,rgba(255,180,84,.16),transparent 70%)}\n.ev.check{background:var(--panel2)}\n.ev label{display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;min-height:30px}\n.ev input[type=checkbox],.cl input[type=checkbox]{width:22px;height:22px;accent-color:var(--good);flex:none}\n.ev .mono{font-size:12px}\n.ev .tag{font-size:10.5px;font-weight:700;letter-spacing:.06em;border-radius:5px;padding:2px 6px;border:1px solid currentColor;text-transform:uppercase}\n.c2{border-bottom:1px solid var(--line);background:linear-gradient(90deg,rgba(255,107,107,.13),transparent 60%);padding:8px 12px}\n.c2 h4{margin:0 0 6px;font-size:13px;letter-spacing:.05em;color:var(--bad)}\n.c2.exit h4{color:var(--warn)}\n.cl{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:2px 16px}\n.cl label{display:flex;align-items:center;gap:10px;min-height:34px;font-size:13px;cursor:pointer}\n.cl .hf{display:flex;gap:8px;align-items:center;grid-column:1/-1;font-size:13px}\n.cl .hf input{max-width:120px}\n.cl label.done span{text-decoration:line-through;color:var(--muted)}\n\n/* cards */\n.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:12px}\n.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 14px}\n.card.wide{grid-column:1/-1}\n.card h3{margin:0 0 8px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}\ntable.kv{width:100%;border-collapse:collapse;font-size:14px}\ntable.kv td,table.kv th{padding:5px 4px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}\ntable.kv tr:last-child td{border-bottom:0}\ntable.kv td.r,table.kv th.r{text-align:right;font-family:var(--mono)}\ntable.kv th{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600}\ntable.kv td.k{color:var(--muted);width:42%}\n.big2{font-family:var(--mono);font-size:22px;font-weight:700}\n.chips{display:flex;flex-wrap:wrap;gap:6px}\n.chip{font-family:var(--mono);font-size:13px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 8px}\n.chip b{color:var(--accent)}\npre.raw{white-space:pre-wrap;word-break:break-word;font-family:var(--mono);font-size:12.5px;margin:0;line-height:1.5}\n.route{font-family:var(--mono);font-size:14px;line-height:1.7;word-break:break-word;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px}\n.lines div{padding:3px 0;border-bottom:1px dashed var(--line);font-size:13.5px}\n.lines div:last-child{border-bottom:0}\n.flag{font-family:var(--mono);font-size:11px;border-radius:4px;padding:1px 5px;background:var(--panel2);border:1px solid var(--line);color:var(--warn)}\nsvg text{font-family:var(--mono)}\n.sec{margin:18px 0 8px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}\n.cps{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:12px}\n.ok-row{color:var(--good)} .bad-row{color:var(--warn)}\n.fuelbig td.r{font-size:15px}\ntr.hl td{background:var(--accent-bg)}\n.meter{height:8px;border-radius:5px;background:var(--panel2);overflow:hidden;margin-top:3px}\n.meter i{display:block;height:100%;background:var(--good)}\n\n/* ---- narrower screens ---- */\n@media (max-width:1180px){\n  .wp,.hdr{grid-template-columns:46px 50px minmax(130px,1.2fr) 62px 54px 66px 68px 50px 62px 76px 80px;\n    grid-template-areas:\"chk awy name dist et eta ata fl gs fuel act\"}\n  .c-mach{display:none}\n}\n@media (max-width:860px){\n  .hdr{display:none}\n  .wp{grid-template-columns:46px repeat(5,minmax(0,1fr));row-gap:4px;padding:8px 10px;\n    grid-template-areas:\"chk name name name dist et\" \"chk awy fl gs fuel fuel\" \"chk eta ata ata act act\"}\n  .wp.pseudo{grid-template-areas:\"chk name name name dist et\" \"chk awy fl gs fuel fuel\" \"chk eta . . . .\"}\n  .wp.pseudo .c-ata,.wp.pseudo .c-act{display:none}\n  .wp .lab{display:block;font-size:9.5px;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;font-family:var(--sans)}\n  .c-mach{display:none}\n  .noterow{padding-left:50px}\n  .cps{grid-template-columns:1fr}\n}\n@media (max-width:640px){\n  .wp{grid-template-columns:46px repeat(4,1fr);\n    grid-template-areas:\"chk name name name awy\" \"chk dist dist et eta\" \"chk fl gs fuel fuel\" \"chk ata ata act act\"}\n  .wp.pseudo{grid-template-areas:\"chk name name name awy\" \"chk dist dist et eta\" \"chk fl gs fuel fuel\"}\n  .c-awy{text-align:right}\n  .sum .next{grid-column:1/-1}\n}\n@media (max-width:520px){\n  .flt b{font-size:17px}\n  .zulu{font-size:17px}\n  .brand{display:none}\n}\n.brand,.flt b,.flt .rt{display:none}\n";
var HTML = "<div id=\"top\" class=\"hide\">\n  <div class=\"bar\">\n    <span class=\"brand\">Nav Log</span>\n    <div class=\"flt\" id=\"fltInfo\"></div>\n    <span id=\"chkPill\" class=\"chk-pill\"></span>\n    <span class=\"zulu\" id=\"zulu\">----Z</span>\n    <button class=\"btn primary\" id=\"btnOpen\">Load PDF</button>\n    <button class=\"btn\" id=\"btnView\" hidden>View PDF</button>\n    <button class=\"btn\" id=\"btnTheme\" title=\"Day / night\">&#9728;</button>\n  </div>\n  <nav class=\"tabs\" id=\"tabs\"></nav>\n</div>\n<main id=\"main\">\n  <div id=\"empty\">\n    <h1>Digital Nav Log</h1>\n    <p>Load a United flight plan PDF and it becomes an interactive nav log.</p>\n    <div class=\"drop\" id=\"drop\">\n      <div class=\"ic\">\u2708\ufe0e</div>\n      <p style=\"color:var(--text);font-weight:600;margin:6px 0\">Drop the flight plan PDF here</p>\n      <p>or</p>\n      <button class=\"btn primary\" id=\"btnChoose\">Choose PDF\u2026</button>\n      <p style=\"font-size:12px;margin-top:14px\">Reads the OPERATIONAL FLIGHTPLAN pages from the briefing package. The file never leaves this device.</p>\n    </div>\n    <div id=\"emptyErr\"></div>\n    <div class=\"recent\" id=\"recent\"></div>\n  </div>\n  <div id=\"view\" class=\"hide\"></div>\n</main>\n<input type=\"file\" id=\"file\" accept=\"application/pdf,.pdf\" class=\"hide\">\n<div id=\"busy\" class=\"hide\"><div id=\"busyMsg\">Reading\u2026</div></div>";
var api = {};
var mounted = false;
api.mount = function (host) {
  if (mounted) return; mounted = true;
  var root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>' + CSS + '</style><div class="nl">' + HTML + '</div>';
'use strict';

/* ======================= utilities ======================= */
var $ = function (s, r) { return (r || root).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var store = {
  get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var pdfdb = {
  open: function () { return new Promise(function (res, rej) { try { var r = indexedDB.open('navlog-pdf', 1); r.onupgradeneeded = function () { r.result.createObjectStore('pdf'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; } catch (e) { rej(e); } }); },
  tx: function (mode, fn) { return pdfdb.open().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('pdf', mode), st = t.objectStore('pdf'), out = fn(st); t.oncomplete = function () { db.close(); res(out && out.result); }; t.onerror = t.onabort = function () { db.close(); rej(t.error); }; }); }); },
  put: function (k, v) { return pdfdb.tx('readwrite', function (st) { return st.put(v, k); }); },
  get: function (k) { return pdfdb.tx('readonly', function (st) { return st.get(k); }); },
  del: function (k) { return pdfdb.tx('readwrite', function (st) { return st.delete(k); }); },
  clear: function () { return pdfdb.tx('readwrite', function (st) { return st.clear(); }); }
};
function pad(n, l) { return String(n).padStart(l || 2, '0'); }
function fmtZ(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; return pad(Math.floor(min / 60)) + pad(min % 60) + 'Z'; }
function fmtHM(min) { var s = min < 0 ? '-' : ''; min = Math.abs(Math.round(min)); return s + Math.floor(min / 60) + ':' + pad(min % 60); }
function parseHHMM(s) {
  var d = String(s || '').replace(/\D/g, '');
  if (d.length < 3 || d.length > 4) return null;
  d = d.padStart(4, '0');
  var h = +d.slice(0, 2), m = +d.slice(2);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}
function nowMin() { var d = new Date(); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
function nowZ() { var m = nowMin(); return pad(Math.floor(m / 60)) + pad(m % 60); }
function sgn(n) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n); }
function fmtN(n) { return n == null ? '' : String(n); }
function thou(n) { return n == null ? '' : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function satTxt(s) { if (!s || s === '---') return ''; return (s[0] === 'M' ? '−' : '+') + s.slice(1); }
function flNum(fl) { var m = /^F(\d{3})$/.exec(fl || ''); return m ? parseInt(m[1], 10) : null; }
function copyText(t, btn) {
  function done() { if (btn) { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1200); } }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = 0;
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done();
  }
}

/* ======================= state ======================= */
var F = null;            // parsed flight
var ST = null;           // user entries for this flight
var KEY = null;
var TAB = 'nav';
var W = [];              // main-log waypoints
var wpIndex = {};        // event index -> waypoint index

function newState() { return { off: '', pass: {}, note: {}, chk: {}, txt: {}, hidePseudo: false, hidePassed: false, detail: false }; }
function saveState() { if (KEY) store.set('navlog:s:' + KEY, ST); }
function flightKey(f) { var h = f.header; return [h.flightKey, h.dateLocal, h.tail, 'R' + h.release].join('|'); }

function setFlight(parsed, persist) {
  F = parsed; KEY = flightKey(F);
  ST = Object.assign(newState(), store.get('navlog:s:' + KEY) || {});
  if (!ST.off) ST.off = F.header.offZ;
  W = []; wpIndex = {};
  F.navlogs.forEach(function (log) {
    log.events.forEach(function (e, i) { e._id = log._n + ':' + i; });
  });
  updView();
  F.navlogs[0].events.forEach(function (e, i) { if (e.type === 'wp') { wpIndex[i] = W.length; e._w = W.length; W.push(e); } });
  if (persist) {
    var rec = store.get('navlog:recent') || [];
    rec = rec.filter(function (r) { return r.key !== KEY; });
    rec.unshift({ key: KEY, title: F.header.callsign + '  ' + F.header.dep.icao + '→' + F.header.arr.icao, date: F.header.dateLocal, saved: Date.now(), type: F.header.type, tail: F.header.tail });
    rec.slice(5).forEach(function (r) { store.del('navlog:f:' + r.key); store.del('navlog:s:' + r.key); pdfdb.del(r.key).catch(function () {}); });
    rec = rec.slice(0, 5);
    store.set('navlog:f:' + KEY, F); store.set('navlog:recent', rec);
    saveState();
    try {
      var okc = F.checks.filter(function (c) { return c.ok; }).length;
      window.dispatchEvent(new CustomEvent('navlogloaded', { detail: { h: F.header, fms: { weights: F.fms && F.fms.weights, cruiseFL: F.fms && F.fms.cruiseFL }, routing: { dist: F.routing && F.routing.dist, ci: F.routing && F.routing.ci, perf: F.routing && F.routing.perf }, checks: [okc, F.checks.length], etops: F.etopsAnalysis || null, ladder: F.ladder || [], lastFuel: W.length ? W[W.length - 1].fuel : null, redispatch: !!F.redispatch } }));
    } catch (e) {}
  }
  computeSuspects();
  showApp();
}

/* ======================= timing maths ======================= */
function offMin() { var m = parseHHMM(ST.off); return m == null ? parseHHMM(F.header.offZ) : m; }
function planAbs(i) { return offMin() + W[i].etMin; }
function ataAbs(i) {
  var p = ST.pass[i]; if (!p || !p.ata) return null;
  var m = parseHHMM(p.ata); if (m == null) return null;
  var plan = planAbs(i), best = m, bd = 1e9;
  for (var k = -1; k <= 2; k++) { var c = m + 1440 * k, d = Math.abs(c - plan); if (d < bd) { bd = d; best = c; } }
  return best;
}
function lastTimed() { for (var i = W.length - 1; i >= 0; i--) if (ataAbs(i) != null) return i; return -1; }
function lastFueled() { for (var i = W.length - 1; i >= 0; i--) { var p = ST.pass[i]; if (p && p.fuel !== '' && p.fuel != null && !isNaN(+p.fuel)) return i; } return -1; }
function estAbs(i) {
  var p = lastTimed();
  if (p < 0 || i <= p) return planAbs(i);
  return ataAbs(p) + (W[i].etMin - W[p].etMin);
}
function nextIdx() { for (var i = 0; i < W.length; i++) if (!ST.pass[i] && !W[i].pseudo) return i; return -1; }
function firstOpenIdx() { for (var i = 0; i < W.length; i++) if (!ST.pass[i]) return i; return -1; }

/* ======================= rendering: shell ======================= */
var TABS = [];
function buildTabs() {
  TABS = [['nav', 'Nav Log'], ['brief', 'Brief'], ['fuel', 'Fuel'], ['route', 'Route']];
  if (F.etopsAnalysis || F.navlogs[0].events.some(function (e) { return e.type === 'etops' || e.type === 'cp'; })) TABS.push(['etops', 'ETOPS']);
  if (F.navlogs.length > 1) TABS.push(['alt', 'Alternate']);
  TABS.push(['notes', 'Remarks & Raw']);
}
function renderTop() {
  var h = F.header;
  $('#fltInfo').innerHTML =
    '<b>' + esc(h.callsign) + '</b><span class="rt">' + esc(h.dep.icao) + ' → ' + esc(h.arr.icao) + '</span>' +
    '<span class="sub">' + esc(h.type) + ' · ' + esc(h.tail) + ' · ' + esc(h.dateLocal) + ' · REL ' + esc(h.release) + '</span>';
  var okc = F.checks.filter(function (c) { return c.ok; }).length;
  var pill = $('#chkPill');
  pill.className = 'chk-pill ' + (okc === F.checks.length ? 'ok' : 'bad');
  pill.textContent = (okc === F.checks.length ? '✓ ' : '⚠ ') + 'Parse ' + okc + '/' + F.checks.length;
  pill.title = 'Tap for details';
  buildTabs();
  $('#tabs').innerHTML = TABS.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (t[0] === TAB ? 'on' : '') + '">' + t[1] + '</button>'; }).join('');
  requestAnimationFrame(function () { host.style.setProperty('--hdrh', $('#top').offsetHeight + 'px'); });
}
function showApp() {
  $('#empty').classList.add('hide'); $('#view').classList.remove('hide'); $('#top').classList.remove('hide');
  if (!TABS.length || !TABS.some(function (t) { return t[0] === TAB; })) TAB = 'nav';
  renderTop(); renderTab(); host.scrollTo(0, 0);
}
function showEmpty(err) {
  try { var vb = $('#btnView'); if (vb) vb.hidden = true; } catch (e0) {}
  $('#top').classList.add('hide'); $('#view').classList.add('hide'); $('#empty').classList.remove('hide');
  $('#emptyErr').innerHTML = err ? '<div class="err"><b>Couldn’t read that file.</b><br>' + esc(err) + '</div>' : '';
  var rec = store.get('navlog:recent') || [];
  $('#recent').innerHTML = rec.length ? '<h3>Recent flights on this device</h3>' + rec.map(function (r) {
    return '<button data-recent="' + esc(r.key) + '"><span><span class="t">' + esc(r.title) + '</span> <span class="d">' + esc(r.type) + ' ' + esc(r.tail) + '</span></span><span class="d">' + esc(r.date) + '</span></button>';
  }).join('') : '';
}
function renderTab() {
  var v = $('#view');
  var fn = { nav: renderNav, brief: renderBrief, fuel: renderFuel, route: renderRoute, etops: renderEtops, alt: renderAlt, notes: renderNotes }[TAB];
  v.innerHTML = '';
  fn(v);
  $$('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === TAB); });
  if (TAB === 'nav') refreshDynamic();
}

/* ======================= NAV LOG ======================= */
function hdrRow() {
  return '<div class="hdr"><div class="c-chk"></div><div class="c-awy">AWY</div><div class="c-name">Waypoint<small>coordinates · name</small></div>' +
    '<div class="c-dist">Dist<small>remain</small></div><div class="c-et">ET<small>zone min</small></div>' +
    '<div class="c-eta">Est Z<small>(plan)</small></div><div class="c-ata">ATA Z</div><div class="c-fl">FL<small>MOR</small></div><div class="c-mach">Mach</div>' +
    '<div class="c-gs">GS<small>TAS</small></div><div class="c-fuel">Fuel plan<small>zone burn</small></div><div class="c-act">Fuel act<small>Δ plan</small></div></div>';
}
var SUSP = {};
function computeSuspects() {
  SUSP = {};
  var bad = {};
  (F.checks || []).forEach(function (c) { if (!c.ok) bad[c.name] = true; });
  if (!bad['Every waypoint has position / ET / fuel'] && !bad['Leg distances add up'] && !bad['Fuel burn is continuous']) return;
  function add(i, t) { (SUSP[i] = SUSP[i] || []).push(t); }
  for (var i = 0; i < W.length; i++) {
    var w = W[i], p = i ? W[i - 1] : null;
    if (bad['Every waypoint has position / ET / fuel'] && (w.fuel == null || w.etMin == null || w.lat == null)) add(i, 'Some values for this fix could not be read. Check it against the PDF.');
    if (!p) continue;
    if (bad['Leg distances add up'] && w.zoneDist != null && p.remDist != null && w.remDist != null && Math.abs(w.zoneDist - (p.remDist - w.remDist)) > 2)
      add(i, 'Leg distance does not tie: printed ' + w.zoneDist + ' NM, but remaining distance drops ' + (p.remDist - w.remDist) + ' NM.');
    if (bad['Fuel burn is continuous'] && w.fuel != null && p.fuel != null && w.zbo != null && Math.abs(p.fuel - w.zbo - w.fuel) > 2)
      add(i, 'Fuel does not tie: previous fix ' + fmtN(p.fuel) + ' minus burn ' + fmtN(w.zbo) + ' is ' + fmtN(p.fuel - w.zbo) + ', printed ' + fmtN(w.fuel) + '. The error may be here or at the previous fix.');
  }
}
function wpRow(w, ro) {
  var i = w._w;
  function dd(x) { return x === '---' ? '' : x; }
  var flv = flNum(w.fl);
  var phase = w.fl === 'CLB' ? '<span class="phase clb">CLB</span>' : w.fl === 'DSC' ? '<span class="phase dsc">DSC</span>' : (flv != null ? '<span class="big">' + flv + '</span>' : '<span class="sm">–</span>');
  var nameTxt = w.pseudo ? esc(w.ident) : esc(w.ident);
  var desc = (w.desc && w.desc !== w.ident) ? w.desc : '';
  var sat = satTxt(w.sat);
  var gsTas = w.gs != null ? '<div class="big">' + w.gs + '</div><div class="sm">' + w.tas + '</div>' : '<div class="sm">–</div>';
  var mach = w.mach != null ? '.' + pad(Math.round(w.mach * 1000), 3) : '';
  var wind = w.wind && w.wind !== '---/---' ? w.wind : '';
  var h = '<div class="wp' + (w.pseudo ? ' pseudo' : '') + '" id="w' + i + '" data-w="' + i + '">' +
    '<div class="c-chk">' + (ro ? '' : '<button class="passbtn" data-pass="' + i + '" aria-label="Mark passed">✓</button>') + '</div>' +
    '<div class="c-awy awy">' + esc(w.airway) + '</div>' +
    '<div class="c-name"><div class="nm">' + nameTxt + (w.extra ? '<span class="ex">' + esc(w.extra) + '</span>' : '') + '</div>' +
      (SUSP[i] ? '<div class="susp">⚠ ' + SUSP[i].map(esc).join(' ⚠ ') + '</div>' : '') +
      '<div class="pos">' + esc(w.latStr.replace(/^([NS])(\d{2})/, '$1$2°')) + ' ' + esc(w.lonStr.replace(/^([EW])(\d{3})/, '$1$2°')) + (desc ? ' · ' + esc(desc) : '') + '</div></div>' +
    '<div class="c-dist"><span class="lab">Dist / Rem</span><div class="big">' + fmtN(w.zoneDist) + '</div><div class="sm">' + fmtN(w.remDist) + '</div></div>' +
    '<div class="c-et"><span class="lab">ET</span><div class="big">' + esc(w.et) + '</div><div class="sm">' + (w.zoneMin ? fmtN(w.zoneMin) + 'm' : '') + '</div></div>' +
    '<div class="c-eta eta">' + (ro ? '' : '<span class="lab">Est Z</span><div class="big" data-eta></div><div class="sm" data-plan></div>') + '</div>' +
    '<div class="c-ata">' + (ro ? '' : '<span class="lab">ATA Z</span><input type="text" class="t4" inputmode="numeric" maxlength="5" placeholder="----" data-ata="' + i + '"><div class="delta" data-dt></div>') + '</div>' +
    '<div class="c-fl"><span class="lab">FL</span>' + phase + '<div class="sm">' + esc(dd(w.mor)) + '</div></div>' +
    '<div class="c-mach"><div class="big">' + mach + '</div></div>' +
    '<div class="c-gs"><span class="lab">GS / TAS</span>' + gsTas + '</div>' +
    '<div class="c-fuel"><span class="lab">Fuel / Burn</span><div class="big">' + fmtN(w.fuel) + '</div><div class="sm">' + (w.zbo ? '−' + fmtN(w.zbo) : '') + '</div></div>' +
    '<div class="c-act">' + (ro ? '' : '<span class="lab">Fuel actual</span><div class="actwrap"><input type="text" class="t4" inputmode="numeric" maxlength="6" placeholder="lbs" data-fuel="' + i + '"><div class="delta" data-df></div></div>') + '</div>' +
    (ro ? '' : '<button class="notebtn" data-note="' + i + '" title="Note">✎</button>') +
    '</div>';
  return h;
}
function evRow(e, ro) {
  var id = e._id;
  if (e.type === 'fir') {
    return '<div class="ev fir"><span class="ic">◇</span><span>ENTERING FIR <b>' + esc(e.icao) + '</b> ' + esc(e.name) + ' <span style="color:var(--muted)">(' + esc(e.region) + ')</span></span>' +
      (ro ? '' : '<input type="text" placeholder="freq / note" data-txt="' + id + '" value="' + esc((ST.txt || {})[id] || '') + '">') + '</div>';
  }
  if (e.type === 'etops') {
    return '<div class="ev etops"><span class="ic">▲</span><span class="tag" style="color:var(--good)">ETOPS ' + esc(e.kind) + '</span><b class="mono">' + esc(e.apt) + '</b>' +
      '<span class="mono">ET ' + esc(e.et) + ' · ' + e.distRem + ' NM to go · ' + esc(e.latStr) + ' ' + esc(e.lonStr) + ' · fuel ' + e.fuel + '</span></div>';
  }
  if (e.type === 'cp') {
    var alts = e.alts.map(function (a) { return esc(a.apt) + ' ' + a.dist + ' NM'; }).join(' / ');
    return '<div class="ev cp"><span class="ic">◆</span><span class="tag" style="color:var(--warn)">CP-' + e.n + '</span><b class="mono">' + alts + '</b>' +
      '<span class="mono">ET ' + esc(e.et) + ' · ' + esc(e.latStr) + ' ' + esc(e.lonStr) + ' · fuel rem ' + e.fuelRem + ' / req ' + e.fuelReq + ' <span class="' + (e.fuelRem >= e.fuelReq ? 'good' : 'bad') + '">(' + sgn(e.fuelRem - e.fuelReq) + ')</span></span></div>';
  }
  if (e.type === 'check') {
    return '<div class="ev check"><label><input type="checkbox" data-chk="' + id + '"' + (ST.chk[id] ? ' checked' : '') + (ro ? ' disabled' : '') + '><span>' + esc(e.text) + '</span></label></div>';
  }
  if (e.type === 'class2') {
    var items = e.items.map(function (it, k) {
      var cid = id + '.' + k;
      var hf = /^HF FREQ PRI_*\s+SEC_*$/.test(it);
      if (hf) return '<div class="hf"><span>HF FREQ</span><span>PRI</span><input type="text" data-txt="' + cid + 'p" value="' + esc((ST.txt || {})[cid + 'p'] || '') + '"><span>SEC</span><input type="text" data-txt="' + cid + 's" value="' + esc((ST.txt || {})[cid + 's'] || '') + '"></div>';
      return '<label class="' + (ST.chk[cid] ? 'done' : '') + '"><input type="checkbox" data-chk="' + cid + '"' + (ST.chk[cid] ? ' checked' : '') + '><span>' + esc(it) + '</span></label>';
    }).join('');
    return '<div class="c2 ' + e.kind + '"><h4>' + esc(e.title) + '</h4><div class="cl">' + items + '</div></div>';
  }
  return '<div class="ev check"><span class="ic">•</span><span>' + esc(e.text) + '</span></div>';
}
function renderLog(log, ro) {
  var h = '<div class="navwrap">' + hdrRow();
  log.events.forEach(function (e) {
    if (e.type === 'wp') h += wpRow(e, ro);
    else h += evRow(e, ro);
  });
  return h + '</div>';
}
function renderNav(v) {
  var h = F.header;
  var html = '';
  if (F.checks.some(function (c) { return !c.ok; })) {
    html += '<div class="warnbox"><b>Check this nav log against the PDF.</b> Some self-checks failed (tap “Parse” at the top for detail). Raw text is under “Remarks &amp; Raw”.</div>';
  }
  html += '<div class="sum" id="sum"></div>';
  html += '<div class="ctl"><label>Takeoff <input type="text" class="t4" id="offIn" inputmode="numeric" maxlength="5" value="' + esc(ST.off) + '"> Z</label>' +
    '<button class="btn small" id="offNow">Now</button><button class="btn small" id="offPlan" title="Reset to the release time">Plan ' + esc(h.offZ) + 'Z</button>' +
    '<span class="tog' + (ST.hidePseudo ? ' on' : '') + '" data-opt="hidePseudo">Hide T/C · T/D</span>' +
    '<span class="tog' + (ST.hidePassed ? ' on' : '') + '" data-opt="hidePassed">Hide passed</span>' +
    '<button class="btn small" id="jumpNext">↓ Next waypoint</button></div>';
  html += renderLog(F.navlogs[0], false);
  v.innerHTML = html;
  applyFilters();
}
function applyFilters() {
  var v = $('#view');
  v.classList.toggle('hp', !!ST.hidePseudo);
  $$('.wp', v).forEach(function (r) {
    var i = +r.dataset.w;
    var hide = (ST.hidePseudo && W[i].pseudo) || (ST.hidePassed && ST.pass[i] && i !== lastPassedAny());
    r.classList.toggle('hide', !!hide);
  });
}
function lastPassedAny() { for (var i = W.length - 1; i >= 0; i--) if (ST.pass[i]) return i; return -1; }

function refreshDynamic() {
  if (TAB !== 'nav') return;
  var nx = nextIdx();
  var lt = lastTimed(), lf = lastFueled();
  $$('.wp[data-w]', $('#view')).forEach(function (r) {
    var i = +r.dataset.w, p = ST.pass[i];
    r.classList.toggle('passed', !!p);
    r.classList.toggle('next', i === nx);
    var eta = $('[data-eta]', r), pl = $('[data-plan]', r);
    var planT = planAbs(i), est = estAbs(i);
    if (p && p.ata) { eta.textContent = ''; pl.textContent = fmtZ(planT).replace('Z', ''); }
    else { eta.textContent = fmtZ(est).replace('Z', ''); pl.textContent = Math.abs(est - planT) >= 1 ? '(' + fmtZ(planT).replace('Z', '') + ')' : ''; }
    var inp = $('[data-ata]', r);
    if (inp && root.activeElement !== inp) inp.value = p ? (p.ata || '') : '';
    var dt = $('[data-dt]', r);
    if (dt) {
      var a = ataAbs(i);
      if (a != null) { var d = Math.round(a - planT); dt.textContent = (d === 0 ? 'on time' : sgn(d) + ' min'); dt.className = 'delta ' + (d > 1 ? 'late' : d < -1 ? 'early' : 'good'); }
      else { dt.textContent = ''; dt.className = 'delta'; }
    }
    var fi = $('[data-fuel]', r);
    if (fi && root.activeElement !== fi) fi.value = p && p.fuel != null ? p.fuel : '';
    var df = $('[data-df]', r);
    if (df) {
      if (p && p.fuel !== '' && p.fuel != null && !isNaN(+p.fuel)) {
        var d2 = Math.round(+p.fuel - W[i].fuel);
        df.textContent = sgn(d2); df.className = 'delta ' + (d2 < -500 ? 'bad' : d2 < 0 ? 'late' : 'good');
      } else { df.textContent = ''; df.className = 'delta'; }
    }
    var nb = $('.notebtn', r);
    if (nb) nb.classList.toggle('has', !!(ST.note && ST.note[i]));
  });
  // summary
  var sum = $('#sum'); if (!sum) return;
  var h = F.header, S = '';
  var dst = W.length - 1;
  if (nx === 0) {
    S += '<div class="next"><div class="k">Departure</div><div class="v">' + esc(W[0].ident) + ' <span style="font-size:14px;color:var(--muted)">RWY ' + esc((F.fms.tow && F.fms.tow.rwy) || '') + '</span></div>' +
      '<div class="s">Tap \u2713 when airborne to start the clock \u00b7 plan OFF ' + esc(h.offZ) + 'Z</div></div>';
  } else if (nx > 0) {
    var w = W[nx];
    var fl = flNum(w.fl);
    S += '<div class="next"><div class="k">Next waypoint</div><div class="v">' + esc(w.ident) + ' <span style="font-size:14px;color:var(--muted)">' + esc(w.airway) + '</span></div>' +
      '<div class="s">' + fmtZ(estAbs(nx)) + ' · ' + (w.zoneDist != null ? w.zoneDist + ' NM leg · ' : '') + 'MC ' + esc(w.mc) + ' · ' + (fl != null ? 'FL' + fl : esc(w.fl)) + '</div></div>';
  } else {
    S += '<div class="next"><div class="k">Status</div><div class="v good">Arrived</div><div class="s">All waypoints passed</div></div>';
  }
  var etaD = estAbs(dst);
  S += '<div><div class="k">ETA ' + esc(h.arr.icao) + '</div><div class="v">' + fmtZ(etaD) + '</div><div class="s">plan ' + fmtZ(planAbs(dst)) + (h.onZ ? ' · sched ' + esc(h.onZ) + 'Z' : '') + '</div></div>';
  if (lt >= 0) {
    var d = Math.round(ataAbs(lt) - planAbs(lt));
    S += '<div><div class="k">Time vs plan</div><div class="v ' + (d > 1 ? 'late' : d < -1 ? 'early' : 'good') + '">' + (d === 0 ? 'On time' : sgn(d) + ' min') + '</div><div class="s">at ' + esc(W[lt].ident) + '</div></div>';
  } else {
    S += '<div><div class="k">Time vs plan</div><div class="v" style="color:var(--muted)">–</div><div class="s">enter an ATA</div></div>';
  }
  if (lf >= 0) {
    var d3 = Math.round(+ST.pass[lf].fuel - W[lf].fuel);
    var remf = F.fuel.remf ? F.fuel.remf.fuel : W[dst].fuel;
    S += '<div><div class="k">Fuel vs plan</div><div class="v ' + (d3 < -500 ? 'bad' : d3 < 0 ? 'late' : 'good') + '">' + sgn(d3) + '</div><div class="s">at ' + esc(W[lf].ident) + ' · proj. dest ' + thou(remf + d3) + '</div></div>';
  } else {
    S += '<div><div class="k">Fuel vs plan</div><div class="v" style="color:var(--muted)">–</div><div class="s">enter fuel at a fix</div></div>';
  }
  var done = Object.keys(ST.pass).length;
  S += '<div><div class="k">Progress</div><div class="v">' + done + '<span style="font-size:14px;color:var(--muted)"> / ' + W.length + '</span></div><div class="meter"><i style="width:' + Math.round(100 * done / W.length) + '%"></i></div></div>';
  sum.innerHTML = S;
}

function togglePass(i) {
  if (ST.pass[i]) { for (var k = i; k < W.length; k++) delete ST.pass[k]; }
  else {
    for (var k2 = 0; k2 < i; k2++) if (!ST.pass[k2]) ST.pass[k2] = { ata: '', fuel: '', auto: true };
    ST.pass[i] = { ata: nowZ(), fuel: '', auto: false };
    if (i === 0) ST.off = ST.pass[0].ata;   // airborne: start the clock
  }
  saveState(); applyFilters(); refreshDynamic();
  var oi = $('#offIn'); if (oi) oi.value = ST.off;
}
function normHHMM(s) { var m = parseHHMM(s); return m == null ? '' : pad(Math.floor(m / 60)) + pad(m % 60); }

/* ======================= BRIEF ======================= */
function tr(k, v, cls) { return '<tr><td class="k">' + k + '</td><td class="' + (cls || '') + '">' + v + '</td></tr>'; }
var LIMIT = { A: 'Airport operating restriction', E: 'Max enroute terrain weight', F: 'Max fuel tank capacity', L: 'Max allowable landing weight', M: 'MEL restriction', P: 'FPM takeoff performance module', S: 'Structural limit', U: 'Dispatcher override', T: 'Takeoff limit weight' };
function perfRows(p) {
  if (!p || !p.rwy) return '<tr><td>–</td></tr>';
  return tr('Runway', 'RWY ' + esc(p.rwy) + (p.rwyLen ? ' · ' + esc(p.rwyLen) + ' ft' : ''), 'mono') +
    tr('OAT / QNH', esc(p.temp) + '°C · A' + esc(p.altim), 'mono') +
    tr('Wind', esc(p.wdir) + '/' + esc(p.wspd) + ' · ' + esc(p.comp || '') + ' · XW' + esc(p.xw || '0'), 'mono') +
    tr('Flaps / surface', 'F' + esc(p.flaps) + ' · ' + esc(p.surface || ''), 'mono') +
    tr('Anti-ice / bleeds', esc(p.antiIce || '') + ' · AC ' + esc(p.bleed || '') + (p.enrtIce ? ' · ENRT ICE' : ''), 'mono');
}
function renderBrief(v) {
  var h = F.header, rt = F.routing, fm = F.fms, wt = fm.weights;
  var out = '<div class="grid">';
  // flight
  out += '<div class="card"><h3>Flight</h3><div class="big2">' + esc(h.callsign) + ' <span style="font-size:15px;color:var(--muted)">' + esc(h.dateLocal) + '</span></div>' +
    '<table class="kv"><tr><th></th><th class="r">Zulu</th><th class="r">Local</th></tr>' +
    '<tr><td class="k">OUT ' + esc(h.dep.icao) + '/' + esc(h.dep.iata) + '</td><td class="r">' + esc(h.outZ) + '</td><td class="r">' + esc(h.outL) + '</td></tr>' +
    '<tr><td class="k">OFF</td><td class="r">' + esc(h.offZ) + '</td><td class="r">' + esc(h.offL) + '</td></tr>' +
    '<tr><td class="k">ON ' + esc(h.arr.icao) + '/' + esc(h.arr.iata) + '</td><td class="r">' + esc(h.onZ) + '</td><td class="r">' + esc(h.onL) + '</td></tr>' +
    '<tr><td class="k">IN</td><td class="r">' + esc(h.inZ) + '</td><td class="r">' + esc(h.inL) + '</td></tr></table>' +
    '<table class="kv" style="margin-top:6px">' +
    tr('Aircraft', esc(h.type) + ' · ' + esc(h.tail) + ' · nose ' + esc(h.nose), 'mono') +
    tr('Time en route', esc(h.ete) + ' · ' + esc(h.onTimeDelta) + (h.onTimeFlag === 'E' ? ' early' : ' late') + ' vs sched', 'mono') +
    tr('Variant / route / release', esc(h.variant) + ' · ' + esc(h.routing) + ' · ' + esc(h.release), 'mono') +
    tr('Upper-air prog valid', esc(h.windFrom) + ' – ' + esc(h.windTo) + ' (DDHHMM)', 'mono') + '</table></div>';
  // dispatch
  out += '<div class="card"><h3>Dispatch</h3><table class="kv">' +
    tr('Released', esc(h.releasedRules || '') + ' to ' + esc(h.releasedTo || ''), 'mono') +
    tr('Dispatcher', esc(h.dispatcher || '') + ' · ' + esc(h.dispatchSector || '')) +
    tr('Phone', h.dispatcherPhone ? '<a style="color:var(--accent)" href="tel:' + esc(h.dispatcherPhone) + '">' + esc(h.dispatcherPhone) + '</a>' : '', 'mono') + '</table>' +
    '<h3 style="margin-top:12px">Release basis</h3><div class="lines">' + (h.basis.length ? h.basis.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') : '<div style="color:var(--muted)">–</div>') + '</div>' +
    '<h3 style="margin-top:12px">MEL / placard info</h3><div class="lines">' + (h.mel.length ? h.mel.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') : '<div style="color:var(--muted)">–</div>') + '</div></div>';
  // route
  var vp = '<span class="chip">Init <b>' + esc((rt.initialLevel || '').replace('F', 'FL')) + '</b></span>' + (rt.vertical || []).map(function (s) { return '<span class="chip">' + esc(s.fix) + ' → <b>' + esc(s.level.replace('F', 'FL')) + '</b></span>'; }).join('');
  out += '<div class="card"><h3>Routing &amp; profile</h3><table class="kv">' +
    tr('Distance', esc(rt.dist) + ' NM', 'mono') +
    tr('Avg wind comp', (rt.windCompLabel ? (rt.windCompLabel[0] === 'H' ? 'Headwind ' : 'Tailwind ') + esc(rt.windCompLabel.slice(1)) + ' kt' : ''), 'mono') +
    tr('Cost index', esc(rt.ci) + ' · ' + esc(rt.ciMode), 'mono') +
    tr('Perf factor (' + esc(rt.perfLabel || '') + ')', esc(rt.perf || ''), 'mono') +
    tr('FECO', esc(rt.feco || ''), 'mono') +
    tr('Cruise \u00b7 SAT \u00b7 ISA dev \u00b7 TROP', (fm.cruiseFL ? 'FL' + fm.cruiseFL : '') + ' · ' + esc(satTxt(fm.sat || '')) + '°C · ' + esc(fm.isaDev || '') + ' · FL' + (fm.trop || ''), 'mono') +
    tr('Top of climb', esc(fm.toc || ''), 'mono') +
    tr('Ref point', esc(fm.refPoint || ''), 'mono') + '</table>' +
    '<h3 style="margin-top:12px">Vertical profile</h3><div class="chips">' + vp + '</div></div>';
  // weights
  function wrow(k, o) {
    if (!o) return '';
    var margin = o.max - o.planned;
    return '<tr><td class="k">' + k + '</td><td class="r">' + thou(o.planned) + '</td><td class="r">' + thou(o.max) + ' <span class="flag" title="' + esc(LIMIT[o.limit] || '') + '">' + esc(o.limit) + '</span></td><td class="r ' + (margin < 2000 ? 'late' : '') + '">' + thou(margin) + '</td></tr>';
  }
  out += '<div class="card"><h3>Weights (lb)</h3><table class="kv"><tr><th></th><th class="r">Planned</th><th class="r">Max / limit</th><th class="r">Margin</th></tr>' +
    wrow('ZFW', wt.ZFW) + wrow('TOW', wt.TOW) + wrow('LW', wt.LW) + '</table>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:8px">' + Object.keys(LIMIT).filter(function (k) { return [wt.ZFW, wt.TOW, wt.LW].some(function (o) { return o && o.limit === k; }); }).map(function (k) { return '<b>' + k + '</b> = ' + LIMIT[k]; }).join(' · ') + '</div>' +
    (h.sys && h.sys.ptog ? '<div class="mono" style="font-size:12.5px;margin-top:8px">' + esc(h.sys.terrain || '') + '<br>' + esc(h.sys.ptog) + '</div>' : '') + '</div>';
  out += '<div class="card"><h3>Takeoff performance basis – ' + esc(h.dep.icao) + '</h3><table class="kv">' + perfRows(fm.tow) + '</table></div>';
  out += '<div class="card"><h3>Landing performance basis – ' + esc(h.arr.icao) + '</h3><table class="kv">' + perfRows(fm.lw) + '</table></div>';
  // system + remarks
  out += '<div class="card"><h3>System info</h3><div class="lines">' + h.systemInfo.map(function (x) { return '<div class="mono" style="font-size:12.5px">' + esc(x) + '</div>'; }).join('') + '</div></div>';
  out += '<div class="card"><h3>Dispatcher remarks</h3><div class="lines">' + h.remarks.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') +
    (F.remarksContinued && F.remarksContinued.length ? F.remarksContinued.map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('') : '') + '</div></div>';
  out += '</div>';
  v.innerHTML = out;
}

/* ======================= FUEL ======================= */
function renderFuel(v) {
  var h = F.header, L = F.ladder;
  var key = { 'MIN T/O': 1, 'PLAN T/O': 1, 'PLAN GATE': 1, 'REMF': 1 };
  var rows = L.slice(0, L.length).filter(function (r, i) { return !/^CI (120|0)$|^PER 1K$/.test(r.label) && (i === 0 || key[r.label] || r.fuel !== 0); }).map(function (r, i) {
    var label = r.label;
    if (i === 0) label = '<b>' + esc(label) + '</b> <span style="color:var(--muted)">trip to destination</span>';
    else if (/^[A-Z0-9]{4}\/[A-Z0-9]{3}$/.test(r.label)) label = esc(label) + ' <span style="color:var(--muted)">alternate</span>';
    else label = esc(label);
    var zero = r.fuel === 0 && /^(N\/A|ADD|CF|UNSBL|00 PCT|CAPT)/.test(r.label);
    return '<tr class="' + (key[r.label] ? 'hl' : '') + '" style="' + (zero ? 'opacity:.4' : '') + '"><td>' + label + '</td><td class="r">' + esc(r.time) + '</td><td class="r">' + thou(r.fuel) + '</td></tr>';
  }).join('');
  var ci = L.filter(function (r) { return /^CI (120|0)$/.test(r.label); });
  var per = L.filter(function (r) { return r.label === 'PER 1K'; })[0];
  var o = '<div class="grid"><div class="card"><h3>Fuel ladder (lb) – ' + esc(h.dep.icao) + ' → ' + esc(h.arr.icao) + '</h3>' +
    '<table class="kv fuelbig"><tr><th>Item</th><th class="r">Time</th><th class="r">Fuel</th></tr>' + rows + '</table></div>';
  if (F.redispatch && F.ladderIntermediate && F.ladderIntermediate.length) {
    var rd = F.redispatch;
    o += '<div class="card"><h3>Redispatch – ' + esc(rd.intermediate) + ' (intermediate destination)</h3>' +
      '<table class="kv"><tr><td class="k">Point of redispatch</td><td class="r mono">' + esc(rd.point) + '</td></tr>' +
      '<tr><td class="k">MINF at redispatch</td><td class="r mono">' + thou(rd.minf) + '</td></tr>' +
      '<tr><td class="k">PLNF at redispatch</td><td class="r mono">' + thou(rd.plnf) + '</td></tr></table>' +
      '<table class="kv fuelbig" style="margin-top:8px"><tr><th>Item</th><th class="r">Time</th><th class="r">Fuel</th></tr>' +
      F.ladderIntermediate.filter(function (r) { return !(r.fuel === 0 && /^(N\/A|ADD|CF|UNSBL|CAPT)/.test(r.label)); }).map(function (r) {
        return '<tr class="' + (/^(MIN T\/O|PLAN T\/O|PLAN GATE|REMF)$/.test(r.label) ? 'hl' : '') + '"><td>' + esc(r.label) + '</td><td class="r">' + esc(r.time) + '</td><td class="r">' + thou(r.fuel) + '</td></tr>';
      }).join('') + '</table></div>';
  }
  o += '<div>';
  o += '<div class="card"><h3>Cost index sensitivity</h3><table class="kv"><tr><th>Option</th><th class="r">Time</th><th class="r">Fuel</th></tr>' +
    ci.map(function (r) { return '<tr><td>Fly CI ' + esc(r.label.replace('CI ', '')) + ' instead of ' + esc(F.routing.ci) + '</td><td class="r">' + esc(r.time) + '</td><td class="r">' + (r.fuel > 0 ? '+' : '') + thou(r.fuel) + '</td></tr>'; }).join('') +
    (per ? '<tr><td>Fuel burned per 1,000 lb extra TOGW</td><td class="r"></td><td class="r">' + thou(per.fuel) + '</td></tr>' : '') + '</table>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:6px">Time: + = minutes gained, − = lost. Fuel: + = extra burn.</div></div>';
  o += '<div class="card" style="margin-top:12px"><h3>Local airports (situational awareness)</h3><table class="kv"><tr><th>Apt</th><th class="r">Dist</th><th class="r">Time</th><th class="r">Fuel</th></tr>' +
    F.lclApt.map(function (a) { return '<tr><td class="mono">' + esc(a.apt) + '</td><td class="r">' + a.dist + '</td><td class="r">' + esc(a.time) + '</td><td class="r">' + thou(a.fuel) + '</td></tr>'; }).join('') + '</table></div>';
  if (F.takeoffAlternate) o += '<div class="card" style="margin-top:12px"><h3>Takeoff alternate</h3><div class="mono">' + esc(F.takeoffAlternate.apt) + ' · ' + F.takeoffAlternate.dist + ' NM · ' + esc(F.takeoffAlternate.time) + ' · ' + thou(F.takeoffAlternate.fuel) + ' lb</div></div>';
  o += '<div class="card" style="margin-top:12px"><h3>Captain block</h3><table class="kv">' + tr('Captain', esc(F.captain.name) || '<span style="color:var(--muted)">–</span>') + tr('Domicile', esc(F.captain.dom) || '<span style="color:var(--muted)">–</span>') + tr('Minimums', esc(F.captain.min) || '<span style="color:var(--muted)">–</span>') + '</table></div>';
  o += '</div></div>';
  // gate fuel check
  var pg = F.fuel.planGate;
  if (pg) {
    o += '<div class="sec">Gate fuel check</div><div class="card"><div class="ctl" style="margin:0"><label>Fuel on board at gate (lb) <input type="text" class="t4" style="width:100px" id="gateFuel" inputmode="numeric" value="' + esc(ST.gateFuel || '') + '"></label><span id="gateRes" class="mono"></span></div></div>';
  }
  v.innerHTML = o;
  var gf = $('#gateFuel');
  function upd() {
    var r = $('#gateRes'); if (!r || !gf) return;
    var n = parseFloat(gf.value);
    if (isNaN(n)) { r.textContent = 'Plan gate ' + thou(pg.fuel) + '  ·  min T/O + taxi ' + thou((F.fuel.minTO ? F.fuel.minTO.fuel : 0) + (F.fuel.taxi ? F.fuel.taxi.fuel : 0)); r.className = 'mono'; return; }
    var d = Math.round(n - pg.fuel), minGate = (F.fuel.minTO ? F.fuel.minTO.fuel : 0) + (F.fuel.taxi ? F.fuel.taxi.fuel : 0);
    r.innerHTML = 'Plan ' + thou(pg.fuel) + ' · <b class="' + (d < 0 ? 'bad' : 'good') + '">' + sgn(d) + '</b> · vs min T/O + taxi ' + thou(minGate) + ': <b class="' + (n < minGate ? 'bad' : 'good') + '">' + sgn(Math.round(n - minGate)) + '</b>';
  }
  if (gf) { gf.addEventListener('input', function () { ST.gateFuel = gf.value; saveState(); upd(); }); upd(); }
}

/* ======================= ROUTE ======================= */
function renderRoute(v) {
  var a = F.atc, h = F.header, o = '';
  o += '<div class="grid">';
  if (a) {
    o += '<div class="card wide"><h3>ATC filing (ICAO flight plan) <button class="btn small" style="float:right;margin-top:-6px" data-copy="route">Copy route</button></h3><div class="route" id="routeTxt">' + esc(a.route) + '</div></div>';
    o += '<div class="card"><h3>Filed flight plan</h3><table class="kv">' +
      tr('Callsign', esc(a.callsign || ''), 'mono') + tr('Aircraft / wake', esc(a.acType || '') + '/' + esc(a.wake || ''), 'mono') + tr('Departure', esc(a.dep || '') + ' ' + esc(a.etd || '') + 'Z', 'mono') +
      tr('Destination', esc(a.dest || '') + ' · EET ' + esc(a.eet || ''), 'mono') + tr('Alternate(s)', esc((a.alternates || []).join(', ')) || '–', 'mono') + '</table>' +
      '<h3 style="margin-top:12px">Equipment</h3><div class="mono" style="word-break:break-all;font-size:13px">' + esc(a.equip || '') + '</div></div>';
    o += '<div class="card"><h3>Field 18 / other info <button class="btn small" style="float:right;margin-top:-6px" data-copy="f18">Copy</button></h3><div class="mono" style="font-size:13px;word-break:break-word;line-height:1.6" id="f18Txt">' + esc(a.field18 || '') + '</div></div>';
  } else {
    o += '<div class="card wide"><h3>ATC filing</h3><div style="color:var(--muted)">No ICAO flight plan block was found.</div></div>';
  }
  o += '<div class="card wide"><h3>Ground track</h3>' + trackSvg() + '</div>';
  o += '<div class="card wide"><h3>Vertical profile (planned)</h3>' + profileSvg() + '</div>';
  o += '</div>';
  v.innerHTML = o;
}
function trackSvg() {
  var pts = W.map(function (w, i) { return { lat: w.lat, lon: w.lon, w: w, i: i }; });
  if (pts.length < 2) return '';
  var base = pts[0].lon;
  pts.forEach(function (p) { var d = p.lon - base; while (d > 180) d -= 360; while (d < -180) d += 360; p.x = d; });
  var minX = Math.min.apply(null, pts.map(function (p) { return p.x; })), maxX = Math.max.apply(null, pts.map(function (p) { return p.x; }));
  var minY = Math.min.apply(null, pts.map(function (p) { return p.lat; })), maxY = Math.max.apply(null, pts.map(function (p) { return p.lat; }));
  var midLat = (minY + maxY) / 2, k = Math.cos(midLat * Math.PI / 180);
  var spanX = Math.max((maxX - minX) * k, 0.5), spanY = Math.max(maxY - minY, 0.5);
  var Wd = 1000, Ht = Math.max(180, Math.min(420, Wd * spanY / spanX)), m = 40;
  var s = Math.min((Wd - 2 * m) / spanX, (Ht - 2 * m) / spanY);
  var ox = (Wd - spanX * s) / 2, oy = (Ht - spanY * s) / 2;
  function X(p) { return ox + (p.x - minX) * k * s; }
  function Y(p) { return Ht - oy - (p.lat - minY) * s; }
  var line = pts.map(function (p) { return X(p).toFixed(1) + ',' + Y(p).toFixed(1); }).join(' ');
  var done = lastPassedAny();
  var doneLine = done > 0 ? pts.slice(0, done + 1).map(function (p) { return X(p).toFixed(1) + ',' + Y(p).toFixed(1); }).join(' ') : '';
  var dots = '';
  pts.forEach(function (p, i) {
    var w = p.w;
    if (w.pseudo) { dots += '<rect x="' + (X(p) - 3) + '" y="' + (Y(p) - 3) + '" width="6" height="6" fill="var(--warn)" transform="rotate(45 ' + X(p) + ' ' + Y(p) + ')"/>'; return; }
    var big = i === 0 || i === pts.length - 1;
    dots += '<circle cx="' + X(p).toFixed(1) + '" cy="' + Y(p).toFixed(1) + '" r="' + (big ? 6 : 3.2) + '" fill="' + (ST.pass[i] ? 'var(--good)' : 'var(--accent)') + '"/>';
    if (big || (i % Math.max(1, Math.round(pts.length / 9)) === 0)) dots += '<text x="' + (X(p) + 8).toFixed(1) + '" y="' + (Y(p) - 8).toFixed(1) + '" font-size="13" fill="var(--text)">' + esc(w.ident.replace(/ .*/, '')) + '</text>';
  });
  F.navlogs[0].events.forEach(function (e) {
    if ((e.type === 'etops' || e.type === 'cp') && e.lat != null) {
      var p = { x: ((e.lon - base + 540) % 360) - 180, lat: e.lat };
      var col = e.type === 'cp' ? 'var(--warn)' : 'var(--good)';
      dots += '<path d="M' + X(p) + ' ' + (Y(p) - 8) + ' l7 12 h-14z" fill="' + col + '" opacity=".95"/>';
      dots += '<text x="' + (X(p) + 10) + '" y="' + (Y(p) + 16) + '" font-size="11" fill="' + col + '">' + (e.type === 'cp' ? 'CP-' + e.n : 'ETOPS ' + e.kind) + '</text>';
    }
  });
  return '<svg viewBox="0 0 ' + Wd + ' ' + Ht + '" width="100%" style="max-height:440px;background:var(--panel2);border-radius:10px"><polyline points="' + line + '" fill="none" stroke="var(--line)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<polyline points="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>' +
    (doneLine ? '<polyline points="' + doneLine + '" fill="none" stroke="var(--good)" stroke-width="3.2"/>' : '') + dots + '</svg>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:6px">Schematic only (no map). ◆ T/C, T/D · ▲ ETOPS / critical points · green = passed.</div>';
}
function profileSvg() {
  var first = W[0];
  var pts = [{ d: 0, fl: 0 }];
  W.forEach(function (w) {
    var f = flNum(w.fl);
    if (f != null) pts.push({ d: first.remDist - w.remDist, fl: f, name: w.pseudo ? w.ident : w.ident });
  });
  var last = W[W.length - 1];
  pts.push({ d: first.remDist, fl: 0 });
  var Wd = 1000, Ht = 260, ml = 46, mr = 14, mt = 14, mb = 28;
  var maxD = first.remDist, maxF = Math.max(100, Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.fl; })) / 100) * 100);
  function X(d) { return ml + (Wd - ml - mr) * d / maxD; }
  function Y(f) { return mt + (Ht - mt - mb) * (1 - f / maxF); }
  var g = '';
  for (var f = 0; f <= maxF; f += 100) g += '<line x1="' + ml + '" x2="' + (Wd - mr) + '" y1="' + Y(f) + '" y2="' + Y(f) + '" stroke="var(--line)"/><text x="' + (ml - 6) + '" y="' + (Y(f) + 4) + '" font-size="11" fill="var(--muted)" text-anchor="end">' + (f ? 'FL' + f : '0') + '</text>';
  var line = pts.map(function (p) { return X(p.d).toFixed(1) + ',' + Y(p.fl).toFixed(1); }).join(' ');
  var mk = '';
  var di = lastPassedAny();
  if (di >= 0) { var dd = first.remDist - W[di].remDist; mk = '<line x1="' + X(dd) + '" x2="' + X(dd) + '" y1="' + mt + '" y2="' + (Ht - mb) + '" stroke="var(--good)" stroke-dasharray="4 3"/>'; }
  var xt = ''; for (var q = 0; q <= 4; q++) { var dv = Math.round(maxD * q / 4); xt += '<text x="' + X(dv) + '" y="' + (Ht - 8) + '" font-size="11" fill="var(--muted)" text-anchor="middle">' + dv + ' NM</text>'; }
  return '<svg viewBox="0 0 ' + Wd + ' ' + Ht + '" width="100%" style="background:var(--panel2);border-radius:10px">' + g + '<polyline points="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>' + mk + xt + '</svg>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:6px">Drawn through the planned levels at T/C, step points and T/D; climb and descent are straight-line approximations.</div>';
}

/* ======================= ETOPS ======================= */
function renderEtops(v) {
  var E = F.etopsAnalysis, h = F.header, o = '<div class="grid">';
  o += '<div class="card"><h3>ETOPS</h3><table class="kv">' +
    tr('Rule', h.sys && h.sys.etopsMinutes ? h.sys.etopsMinutes + ' minute' : '–', 'mono') +
    tr('Alternates', esc(h.sys && h.sys.etopsChain ? h.sys.etopsChain : '–'), 'mono') +
    (E ? tr('Entry airport', esc(E.entryAirport), 'mono') + tr('Exit airport', esc(E.exitAirport), 'mono') : '') + '</table>';
  var evs = F.navlogs[0].events.filter(function (e) { return e.type === 'etops'; });
  if (evs.length) o += '<h3 style="margin-top:12px">Entry / exit points</h3><table class="kv"><tr><th></th><th>Apt</th><th class="r">ET</th><th class="r">NM to go</th><th class="r">Fuel</th></tr>' +
    evs.map(function (e) { return '<tr><td>' + esc(e.kind) + '</td><td class="mono">' + esc(e.apt) + '</td><td class="r">' + esc(e.et) + '</td><td class="r">' + e.distRem + '</td><td class="r">' + e.fuel + '</td></tr>'; }).join('') + '</table>';
  o += '</div>';
  if (E && E.windows.length) {
    o += '<div class="card"><h3>Earliest / latest arrival at ETOPS alternates</h3><table class="kv"><tr><th>Airport</th><th>Status</th><th class="r">Earliest</th><th class="r">Latest</th></tr>' +
      E.windows.map(function (w) { return '<tr><td class="mono">' + esc(w.apt) + '</td><td>' + esc(w.status) + '</td><td class="r">' + esc(w.from) + 'Z</td><td class="r">' + esc(w.to) + 'Z</td></tr>'; }).join('') + '</table></div>';
  }
  o += '</div>';
  if (E && E.cps.length) {
    o += '<div class="sec">Critical points</div><div class="cps">';
    E.cps.forEach(function (c) {
      var ev = F.navlogs[0].events.filter(function (e) { return e.type === 'cp' && e.n === c.n; })[0];
      var heads = '<tr><th></th>' + c.alts.map(function (a) { return '<th class="r" colspan="2">' + esc(a) + '</th>'; }).join('') + '</tr>';
      var fh = c.rows.filter(function (r) { return r.header; })[0];
      var body = c.rows.map(function (r) {
        if (r.header) return '<tr><th>FUEL (lb)</th>' + r.header.map(function (x) { return '<th class="r">' + esc(x) + '</th>'; }).join('') + '</tr>';
        var cells;
        if (r.values.length === c.alts.length * 2) cells = r.values.map(function (x) { return '<td class="r">' + esc(x.replace(/^0+(?=\d)/, '')) + '</td>'; }).join('');
        else cells = r.values.map(function (x) { return '<td class="r" colspan="2">' + esc(/^\d+$/.test(x) ? x.replace(/^0+(?=\d)/, '') : x) + '</td>'; }).join('');
        var strong = /TOTAL/.test(r.label);
        return '<tr' + (strong ? ' class="hl"' : '') + '><td>' + esc(r.label) + '</td>' + cells + '</tr>';
      }).join('');
      o += '<div class="card"><h3>CP-' + c.n + (ev ? ' · ET ' + esc(ev.et) : '') + ' · ' + esc(c.latStr) + ' ' + esc(c.lonStr) + '</h3>' +
        '<div class="mono" style="margin-bottom:6px">Fuel remaining <b>' + thou(c.fuelRem) + '</b> · required <b>' + thou(c.fuelReq) + '</b> · <span class="' + (c.fuelRem >= c.fuelReq ? 'good' : 'bad') + '">margin ' + sgn(c.fuelRem - c.fuelReq) + '</span></div>' +
        '<div class="lines">' + c.times.map(function (t) { return '<div class="mono" style="font-size:12px">' + esc(t) + '</div>'; }).join('') + '</div>' +
        '<table class="kv" style="margin-top:8px">' + heads + body + '</table></div>';
    });
    o += '</div>';
  }
  v.innerHTML = o;
}

/* ======================= ALTERNATE ======================= */
function renderAlt(v) {
  var o = '';
  F.navlogs.slice(1).forEach(function (log) {
    o += '<div class="sec">' + esc(log.label) + ' (from destination – reference)</div>' + renderLog(log, true);
  });
  v.innerHTML = o;
  // read-only alternate rows need the dynamic cells blanked
  $$('.wp', v).forEach(function (r) { var e = $('[data-eta]', r); });
}

/* ======================= NOTES / RAW ======================= */
function renderNotes(v) {
  var o = '<div class="grid">';
  o += '<div class="card"><h3>Parse check</h3><table class="kv">' + F.checks.map(function (c) {
    return '<tr class="' + (c.ok ? 'ok-row' : 'bad-row') + '"><td>' + (c.ok ? '✓' : '⚠') + ' ' + esc(c.name) + '</td><td class="r">' + esc(c.detail) + '</td></tr>';
  }).join('') + '</table><p style="color:var(--muted);font-size:12.5px;margin:8px 0 0">These tie the parsed nav log back to totals printed elsewhere on the plan (fuel ladder, distance, time). If one fails, compare against the PDF before relying on this view.</p></div>';
  if (F.terrain && F.terrain.length) o += '<div class="card"><h3>Critical terrain scenario</h3><div class="lines">' + F.terrain.map(function (x) { return '<div class="mono" style="font-size:12.5px">' + esc(x) + '</div>'; }).join('') + '</div></div>';
  if (F.releaseRemarks && F.releaseRemarks.length) o += '<div class="card wide"><h3>Additional dispatcher release remarks</h3><pre class="raw">' + esc(F.releaseRemarks.join('\n')) + '</pre></div>';
  o += '<div class="card wide"><h3>Entries on this device</h3><div class="ctl" style="margin:0"><button class="btn" id="clearEntries">Clear all ATA / fuel / notes for this flight</button><button class="btn" id="delFlight">Remove this flight from the device</button></div></div>';
  o += '<div class="card wide"><h3>Extracted OFP text (for cross-checking)</h3><pre class="raw">' + esc((F.raw || []).join('\n')) + '</pre></div>';
  o += '</div>';
  v.innerHTML = o;
}

/* ======================= PDF loading ======================= */
function busy(msg) { if (msg == null) { $('#busy').classList.add('hide'); return; } $('#busy').classList.remove('hide'); $('#busyMsg').textContent = msg; }
var libsP = null;
function loadScript(u) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + u + '. Open the app once while online.')); }; document.head.appendChild(s); }); }
function ensureLibs() {
  if (!libsP) libsP = loadScript('vendor/pdf.min.js').then(function () { return loadScript('navlog-parser.js'); }).then(function () {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  }).catch(function (e) { libsP = null; throw e; });
  return libsP;
}
async function loadPdf(file) {
  try {
    busy('Opening ' + file.name + '…');
    await ensureLibs();
    var raw = await file.arrayBuffer(); var rawCopy = raw.slice(0); var buf = new Uint8Array(raw);
    var doc = await window.pdfjsLib.getDocument({ data: buf }).promise;
    var pages = [], sawOFP = false;
    for (var i = 1; i <= doc.numPages; i++) {
      busy('Reading page ' + i + ' of ' + doc.numPages + '…');
      var pg = await doc.getPage(i);
      var tc = await pg.getTextContent();
      pages.push(tc.items);
      var txt = tc.items.map(function (x) { return x.str; }).join(' ');
      if (/OPERATIONAL FLIGHTPLAN PG/.test(txt)) sawOFP = true;
      if (sawOFP && /END - OFP/.test(txt)) break;
    }
    busy('Building nav log…');
    var parsed = window.NavLogParser.parsePages(pages);
    if (!parsed.ok) throw new Error(parsed.error || 'Could not parse this flight plan.');
    parsed.navlogs.forEach(function (l, n) { l._n = n; });
    busy(null);
    var key0 = flightKey(parsed), sv = store.get('navlog:s:' + key0);
    var nPass = sv ? Object.keys(sv.pass || {}).filter(function (k) { return sv.pass[k]; }).length : 0;
    var hasE = sv && (nPass || Object.keys(sv.note || {}).length || Object.keys(sv.chk || {}).length || Object.keys(sv.txt || {}).length || sv.gateFuel);
    if (hasE) {
      var keep = await askKeep(parsed.header.callsign + ' ' + parsed.header.dep.icao + '\u2192' + parsed.header.arr.icao, nPass);
      if (!keep) { store.del('navlog:s:' + key0); }
    }
    TAB = 'nav';
    try { await pdfdb.put(flightKey(parsed), { buf: rawCopy, name: file.name, saved: Date.now() }); } catch (e3) {}
    setFlight(parsed, true);
  } catch (err) {
    busy(null);
    var msg = err && err.message ? err.message : String(err);
    if (/password/i.test(msg)) msg = 'This PDF is password-protected.';
    try { window.dispatchEvent(new CustomEvent('navlogerror', { detail: msg })); } catch (e2) {}
    if (F) { alert('Couldn’t read that file: ' + msg); } else showEmpty(msg);
  }
}
function openRecent(key) {
  var f = store.get('navlog:f:' + key);
  if (!f) { showEmpty('That flight is no longer stored on this device.'); return; }
  f.navlogs.forEach(function (l, n) { l._n = n; });
  TAB = 'nav'; setFlight(f, false);
}

/* ======================= events ======================= */
root.addEventListener('click', function (e) {
  var t = e.target.closest('[data-pass],[data-tab],[data-opt],[data-note],[data-recent],[data-copy],#btnOpen,#btnChoose,#btnView,#btnTheme,#chkPill,#offNow,#offPlan,#jumpNext,#clearEntries,#delFlight');
  if (!t) return;
  if (t.dataset.pass != null) { togglePass(+t.dataset.pass); return; }
  if (t.dataset.tab) { TAB = t.dataset.tab; renderTab(); host.scrollTo(0, 0); return; }
  if (t.dataset.opt) { ST[t.dataset.opt] = !ST[t.dataset.opt]; saveState(); t.classList.toggle('on', ST[t.dataset.opt]); applyFilters(); return; }
  if (t.dataset.note != null) {
    var i = +t.dataset.note, row = $('#w' + i), ex = $('.noterow', row);
    if (ex) { ex.remove(); return; }
    var d = document.createElement('div'); d.className = 'noterow';
    d.innerHTML = '<input type="text" placeholder="Note for ' + esc(W[i].ident) + '" value="' + esc((ST.note || {})[i] || '') + '">';
    row.appendChild(d); var inp = $('input', d); inp.focus();
    inp.addEventListener('input', function () { ST.note[i] = inp.value; saveState(); refreshDynamic(); });
    return;
  }
  if (t.dataset.recent) { openRecent(t.dataset.recent); return; }
  if (t.dataset.copy) { copyText(t.dataset.copy === 'route' ? F.atc.route : F.atc.field18, t); return; }
  switch (t.id) {
    case 'btnView': viewPdf(); break;
    case 'btnOpen': case 'btnChoose': $('#file').value = ''; $('#file').click(); break;
    case 'btnTheme': var th = host.dataset.theme === 'light' ? 'dark' : 'light'; host.dataset.theme = th; t.innerHTML = th === 'light' ? '&#9790;' : '&#9728;'; store.set('navlog:theme', th); break;
    case 'chkPill': TAB = 'notes'; renderTab(); host.scrollTo(0, 0); break;
    case 'offNow': ST.off = nowZ(); saveState(); $('#offIn').value = ST.off; refreshDynamic(); break;
    case 'offPlan': ST.off = F.header.offZ; saveState(); $('#offIn').value = ST.off; refreshDynamic(); break;
    case 'jumpNext': var nx = firstOpenIdx(); if (nx >= 0) { var r = $('#w' + nx); if (r) { var off = $('#top').offsetHeight + 60; host.scrollTo({ top: r.getBoundingClientRect().top - host.getBoundingClientRect().top + host.scrollTop - off - 60, behavior: 'smooth' }); } } break;
    case 'clearEntries': if (confirm('Clear all ATA, fuel, checklist ticks and notes for this flight?')) { var off2 = ST.off; ST = newState(); ST.off = off2; saveState(); renderTab(); } break;
    case 'delFlight': if (confirm('Remove this flight from this device?')) { pdfdb.del(KEY).catch(function () {}); store.del('navlog:f:' + KEY); store.del('navlog:s:' + KEY); store.set('navlog:recent', (store.get('navlog:recent') || []).filter(function (r) { return r.key !== KEY; })); F = null; ST = null; showEmpty(); } break;
  }
});
root.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id === 'file') { if (t.files && t.files[0]) loadPdf(t.files[0]); return; }
  if (t.id === 'offIn') { var n = normHHMM(t.value); if (n) { ST.off = n; t.value = n; saveState(); refreshDynamic(); } else t.value = ST.off; return; }
  if (t.dataset.ata != null) {
    var i = +t.dataset.ata, v = t.value.trim();
    if (!v) { for (var k = i; k < W.length; k++) delete ST.pass[k]; }
    else {
      var nv = normHHMM(v); if (!nv) { t.value = ST.pass[i] ? ST.pass[i].ata : ''; return; }
      if (!ST.pass[i]) for (var k2 = 0; k2 < i; k2++) if (!ST.pass[k2]) ST.pass[k2] = { ata: '', fuel: '', auto: true };
      ST.pass[i] = Object.assign({ fuel: '' }, ST.pass[i] || {}, { ata: nv, auto: false });
      if (i === 0) { ST.off = nv; var oi2 = $('#offIn'); if (oi2) oi2.value = nv; }
    }
    saveState(); applyFilters(); refreshDynamic(); return;
  }
  if (t.dataset.fuel != null) {
    var j = +t.dataset.fuel, fv = t.value.replace(/[^\d]/g, '');
    if (fv === '') { if (ST.pass[j]) ST.pass[j].fuel = ''; }
    else {
      if (!ST.pass[j]) { for (var k3 = 0; k3 < j; k3++) if (!ST.pass[k3]) ST.pass[k3] = { ata: '', fuel: '', auto: true }; ST.pass[j] = { ata: nowZ(), fuel: '', auto: false }; }
      ST.pass[j].fuel = fv;
    }
    saveState(); applyFilters(); refreshDynamic(); return;
  }
  if (t.dataset.chk != null) { ST.chk[t.dataset.chk] = t.checked; saveState(); var lb = t.closest('label'); if (lb && lb.closest('.cl')) lb.classList.toggle('done', t.checked); return; }
});
root.addEventListener('input', function (e) {
  var t = e.target;
  if (t.dataset && t.dataset.txt != null) { ST.txt[t.dataset.txt] = t.value; saveState(); }
});
root.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); });

var drop = $('#drop');
['dragenter', 'dragover'].forEach(function (n) { root.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
['dragleave', 'drop'].forEach(function (n) { root.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
root.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadPdf(f); });

setInterval(function () { var d = new Date(); $('#zulu').textContent = pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + 'Z'; }, 1000);
(function () { var d = new Date(); $('#zulu').textContent = pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + 'Z'; })();
window.addEventListener('resize', function () { host.style.setProperty('--hdrh', ($('#top').offsetHeight || 96) + 'px'); });

var th0 = store.get('navlog:theme'); if (th0) { host.dataset.theme = th0; }
// test / integration hook: window.NavLogApp.load(parsedJson)


/* ======================= keep / fresh dialog ======================= */
var kstyle = document.createElement('style');
kstyle.textContent = '#kd{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px}#kd[hidden]{display:none}#kd .kb{max-width:440px;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;color:var(--text);font:15px -apple-system,Helvetica,Arial,sans-serif}#kd h3{margin:0 0 8px;font-size:18px}#kd p{margin:0 0 16px;color:var(--muted);line-height:1.4}#kd .kr{display:flex;gap:10px;flex-wrap:wrap}#kd .kr .btn{flex:1;min-height:48px}';
root.appendChild(kstyle);
var kd = document.createElement('div'); kd.id = 'kd'; kd.hidden = true;
kd.innerHTML = '<div class="kb"><h3>This flight is already saved</h3><p id="kdt"></p><div class="kr"><button class="btn primary" id="kdk">Keep my entries</button><button class="btn" id="kdf">Start fresh</button></div></div>';
root.appendChild(kd);
function askKeep(title, nPass) {
  return new Promise(function (res) {
    $('#kdt').textContent = title + ' has entries on this device' + (nPass ? ' (' + nPass + ' waypoints marked passed)' : '') + '. Keep them, or clear them and start this plan fresh?';
    try { window.dispatchEvent(new CustomEvent('navlogask')); } catch (e) {}
    kd.hidden = false;
    function done(v) { kd.hidden = true; kd.removeEventListener('click', h); res(v); }
    function h(e) { var id = e.target && e.target.id; if (id === 'kdk') done(true); else if (id === 'kdf') done(false); }
    kd.addEventListener('click', h);
  });
}

/* ======================= stored PDF viewer ======================= */
var vstyle = document.createElement('style');
vstyle.textContent = '#pv{position:fixed;inset:0;z-index:9999;background:#05090e;display:flex;flex-direction:column}#pv[hidden]{display:none}#pv .pvh{flex:none;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#0d1928;border-bottom:2px solid #004b87;color:#e7eef6;font:700 14px -apple-system,Helvetica,Arial,sans-serif}#pv .pvh span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#pv .pvb{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:10px;text-align:center}#pv canvas{max-width:none;background:#fff;margin:0 auto 12px;display:block}#pv .pvm{color:#8fa3b8;padding:30px;font:14px -apple-system,Helvetica,Arial,sans-serif}';
root.appendChild(vstyle);
var pv = document.createElement('div'); pv.id = 'pv'; pv.hidden = true;
pv.innerHTML = '<div class="pvh"><span id="pvt">PDF</span><button class="btn" id="pvz">Fit width</button><button class="btn primary" id="pvc">Close</button></div><div class="pvb" id="pvb"></div>';
root.appendChild(pv);
var pvDoc = null, pvZoom = 1, pvToken = 0;
var pvIO = null;
async function pvRender() {
  var tok = ++pvToken, body = $('#pvb'); body.innerHTML = '';
  if (pvIO) { pvIO.disconnect(); pvIO = null; }
  var w = Math.floor((body.clientWidth - 20) * pvZoom), dpr = Math.min(window.devicePixelRatio || 1, 2);
  var p1 = await pvDoc.getPage(1), v1 = p1.getViewport({ scale: 1 }), ph = Math.floor(w * v1.height / v1.width);
  var slots = [];
  for (var i = 1; i <= pvDoc.numPages; i++) {
    var d = document.createElement('div'); d.dataset.pg = i; d.style.cssText = 'width:' + w + 'px;height:' + ph + 'px;margin:0 auto 12px;background:#fff;position:relative';
    body.appendChild(d); slots.push(d);
  }
  var busyPg = {};
  async function draw(d) {
    var n = +d.dataset.pg; if (busyPg[n] || d.firstChild) return; busyPg[n] = 1;
    try {
      var pg = await pvDoc.getPage(n), vp0 = pg.getViewport({ scale: 1 }), sc = w / vp0.width, vp = pg.getViewport({ scale: sc * dpr });
      if (tok !== pvToken) return;
      var cv = document.createElement('canvas'); cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
      cv.style.cssText = 'width:' + w + 'px;height:' + Math.floor(vp.height / dpr) + 'px;display:block';
      d.style.height = Math.floor(vp.height / dpr) + 'px'; d.appendChild(cv);
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    } catch (e) {  } finally { busyPg[n] = 0; }
  }
  pvIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) draw(en.target);
      else if (en.target.firstChild && !busyPg[+en.target.dataset.pg]) { var c = en.target.firstChild; c.width = c.height = 1; en.target.removeChild(c); }
    });
  }, { root: body, rootMargin: '600px 0px' });
  slots.forEach(function (d) { pvIO.observe(d); });
}
async function viewPdf() {
  var rec = null;
  try { rec = KEY ? await pdfdb.get(KEY) : null; } catch (e) {}
  pv.hidden = false; var body = $('#pvb');
  if (!rec) { $('#pvt').textContent = 'PDF'; body.innerHTML = '<div class="pvm">The saved PDF is no longer on this device. Load it again with Load PDF.</div>'; return; }
  $('#pvt').textContent = rec.name || 'Flight plan';
  body.innerHTML = '<div class="pvm">Opening…</div>';
  try {
    await ensureLibs(); pvZoom = 1;
    pvDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(rec.buf.slice(0)) }).promise;
    await pvRender();
  } catch (e) { body.innerHTML = '<div class="pvm">Could not open the saved PDF: ' + esc(e && e.message || e) + '</div>'; }
}
pv.addEventListener('click', function (e) {
  var id = e.target && e.target.id;
  if (id === 'pvc') { pv.hidden = true; pvToken++; if (pvIO) { pvIO.disconnect(); pvIO = null; } pvDoc = null; $('#pvb').innerHTML = ''; }
  else if (id === 'pvz') { if (!pvDoc) return; pvZoom = pvZoom >= 2 ? 1 : pvZoom + 0.5; e.target.textContent = pvZoom === 1 ? 'Fit width' : Math.round(pvZoom * 100) + '%'; pvRender(); }
});
function updView() {
  var b = $('#btnView'); if (!b) return;
  if (!KEY) { b.hidden = true; return; }
  var k = KEY; pdfdb.get(k).then(function (r) { if (k === KEY) b.hidden = !r; }).catch(function () { b.hidden = true; });
}
api.viewPdf = viewPdf;
api.hasPdf = function () { return KEY ? pdfdb.get(KEY).then(function (r) { return !!r; }).catch(function () { return false; }) : Promise.resolve(false); };
api.reset = function () {
  pdfdb.clear().catch(function () {});
  if (KEY) { store.del('navlog:f:' + KEY); store.del('navlog:s:' + KEY); store.set('navlog:recent', (store.get('navlog:recent') || []).filter(function (r) { return r.key !== KEY; })); }
  F = null; ST = null; KEY = null; showEmpty();
};
api.load = function (p) { p.navlogs.forEach(function (l, n) { l._n = n; }); TAB = 'nav'; setFlight(p, false); };
api.loadFile = loadPdf;
showEmpty();
};
window.NavLog = api;
})();
