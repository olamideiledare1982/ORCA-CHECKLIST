/* Flight Plan app, part: core. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP = {};

  // ═══════════════════════════ FM DATA BLOCK ═══════════════════════════
  // Every FM-derived number lives here. The ETOPS card (including its source line,
  // labels and notes) is generated from this block only.
  // RE-CHECK THESE VALUES AGAINST EACH FM REVISION.
  // Condition: one engine inoperative (windmilling), max continuous thrust on the
  // remaining engine. Distances in nm. d60 is the 60 minute ring (always d60Speed).
  // m290 / m310 hold the values for ruleTimes[1..] in order (75, 90, 120, 138, 180).
  var FM = {
    source: "UAL FM 4.10.1, ETOPS AOA Diversion Time/Distance",
    date: "23 OCT 26",
    ruleTimes: [60, 75, 90, 120, 138, 180],
    defaultRule: 138,
    staleHours: 12,
    d60Speed: ".80/310",
    speeds: {
      m290: { label: ".80M / 290 KIAS", tag: ".80/290" },
      m310: { label: ".80M / 310 KIAS", tag: ".80/310" }
    },
    speedOrder: ["m290", "m310"],
    defaultSpeed: "m290",
    defaultAirplane: "752",
    airplanes: [
      { id: "752", name: "757-200", d60: 430, m290: [519, 620, 822, 943, 1225], m310: [534, 638, 845, 969, 1260] },
      { id: "753", name: "757-300", d60: 416, m290: [500, 597, 790, 906, 1177], m310: [516, 615, 814, 933, 1212] },
      { id: "763", name: "767-300", d60: 431, m290: [516, 617, 819, 940, 1223], m310: [536, 641, 851, 977, 1270] },
      { id: "764", name: "767-400", d60: 424, m290: [505, 603, 800, 918, 1193], m310: [526, 629, 834, 958, 1245] }
    ]
  };

  var LADDER_KEY = "orca_ladder", BINGO_KEY = "orca_bingo", NAV_KEY = "orca_nav", AOA_KEY = "orca_aoa", FUEL_KEY = "etops_fuel", EO_KEY = "eo_data", HF_KEY = "orca_hf";
  var MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  // ───────── helpers ─────────
  function $(id){ return document.getElementById(id); }
  function el(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    return e;
  }
  function pad2(n){ return (n < 10 ? "0" : "") + n; }
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
  function lsJSON(k){ try{ var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; }catch(e){ return null; } }

  function fmtZ(ms){
    var d = new Date(ms);
    return pad2(d.getUTCDate()) + MONTHS[d.getUTCMonth()] + " " + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + "Z";
  }
  function setEdited(node, t){ node.textContent = t ? "Last edited " + fmtZ(t) : "Not saved yet"; }

  // Stale-entry warnings (older than FM.staleHours).
  var stales = [];
  function addStale(warnEl, getT, what){
    stales.push({ w: warnEl, t: getT, what: what });
  }
  function refreshStale(){
    stales.forEach(function(s){
      var t = s.t(), hrs = t ? (Date.now() - t) / 36e5 : 0;
      if(t && hrs > FM.staleHours){
        s.w.textContent = "These " + s.what + " were saved " + Math.floor(hrs) + " h ago and may be from a previous flight. Verify them or clear.";
        s.w.hidden = false;
      }else{
        s.w.hidden = true;
      }
    });
  }

  var resetters = [];

  function inp(attrs){
    var i = el("input", "in");
    i.type = "text";
    i.setAttribute("autocomplete", "off");
    i.setAttribute("autocorrect", "off");
    i.setAttribute("autocapitalize", "off");
    i.setAttribute("spellcheck", "false");
    for(var k in attrs){ i.setAttribute(k, attrs[k]); }
    return i;
  }
  function field(label, node){
    var l = el("label", "fl");
    l.appendChild(el("span", null, label));
    l.appendChild(node);
    return l;
  }
  function sel(options, value){
    var s = el("select", "in");
    options.forEach(function(o){
      var op = el("option", null, o[1]); op.value = o[0]; s.appendChild(op);
    });
    s.value = value;
    return s;
  }
  function mkCard(title){
    var wrap = el("div", "wrap");
    var warn = el("div", "warn"); warn.hidden = true; warn.setAttribute("role", "alert");
    wrap.appendChild(warn);
    var card = el("section", "card");
    if(title){
      var ch = el("div", "ch");
      ch.appendChild(el("span", "ct", title));
      card.appendChild(ch);
    }
    var body = el("div", "body");
    card.appendChild(body);
    wrap.appendChild(card);
    return { wrap: wrap, warn: warn, card: card, body: body };
  }
  function tile(kind, label){
    var t = el("div", "tile " + kind);
    var l = el("div", "tl", label), v = el("div", "tv", "--");
    t.appendChild(l); t.appendChild(v);
    t.v = v; t.l = l;
    return t;
  }

  var viewPre = $("view-pre"), viewIn = $("view-in"), viewFuel = $("view-fuel"), viewNew = $("view-new");
  // Removed from Preflight but kept in code (never shown): ETOPS AOA and ETOPS critical fuel.
  // ETOPS tab has two pages: Fuel Analysis and ETOPS Rings.
  var etpNav = el("div", "full etpnav");
  var etpFuel = el("div", "etp"), etpRings = el("div", "etp");
  var flt = $("flt");

  // ───────── standalone note ─────────
  var standalone = (window.navigator.standalone === true) ||
                   (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  [viewPre, viewIn, viewFuel, viewNew].forEach(function(v){
    if(!standalone){
      v.appendChild(el("div", "pnote full", "To keep saved entries reliably, install this app: Share, then Add to Home Screen."));
    }
  });


FP.el = el; FP.viewPre = viewPre; FP.lsJSON = lsJSON; FP.pad2 = pad2; FP.mkCard = mkCard; FP.lsGet = lsGet; FP.inp = inp; FP.flt = flt; FP.field = field; FP.AOA_KEY = AOA_KEY; FP.FM = FM; FP.sel = sel; FP.lsSet = lsSet; FP.tile = tile; FP.addStale = addStale; FP.lsDel = lsDel; FP.setEdited = setEdited; FP.refreshStale = refreshStale; FP.resetters = resetters; FP.etpRings = etpRings; FP.FUEL_KEY = FUEL_KEY; FP.etpFuel = etpFuel; FP.viewIn = viewIn; FP.EO_KEY = EO_KEY; FP.HF_KEY = HF_KEY; FP.LADDER_KEY = LADDER_KEY; FP.viewFuel = viewFuel; FP.BINGO_KEY = BINGO_KEY; FP.$ = $; FP.viewNew = viewNew; FP.NAV_KEY = NAV_KEY; FP.etpNav = etpNav;
})();
