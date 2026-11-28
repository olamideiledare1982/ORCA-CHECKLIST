/* Flight Plan app, part: fuel. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP;
var mkCard = FP.mkCard, lsJSON = FP.lsJSON, LADDER_KEY = FP.LADDER_KEY, el = FP.el, inp = FP.inp, addStale = FP.addStale, resetters = FP.resetters, lsDel = FP.lsDel, lsSet = FP.lsSet, setEdited = FP.setEdited, refreshStale = FP.refreshStale, viewFuel = FP.viewFuel, BINGO_KEY = FP.BINGO_KEY, field = FP.field, tile = FP.tile, lsGet = FP.lsGet;
  // ═══════════ FUEL: LADDER + BINGO ═══════════
  function kNum(x){
    x = String(x).trim().replace(",", ".");
    return /^(\d+(\.\d*)?|\.\d+)$/.test(x) ? parseFloat(x) : null;
  }

  // Ladder values are shared so Bingo can default to the ladder ALT and REMF.
  var ladderRef = { v: ["", "", "", "", ""], on: [] };

  // Fuel ladder: five values typed from the flight plan, no math.
  (function(){
    var C = mkCard("Fuel Ladder");
    var LAB = ["PLAN GATE", "MIN TO", "ALT", "RSV", "REMF"];
    var vals = ladderRef.v, t = 0;
    (function load(){
      var o = lsJSON(LADDER_KEY);
      if(o && typeof o === "object"){
        if(Array.isArray(o.v)){ for(var i = 0; i < 5; i++) if(o.v[i] != null) vals[i] = String(o.v[i]); }
        if(typeof o.t === "number") t = o.t;
      }
    })();
    var ladder = el("div", "ladder"), ins = [];
    LAB.forEach(function(name, i){
      var r = el("div", "rung");
      r.appendChild(el("span", "rl", name));
      var f = inp({ inputmode: "decimal", placeholder: "---", "aria-label": name + " fuel, k lb" });
      f.value = vals[i];
      r.appendChild(f); ladder.appendChild(r); ins.push(f);
      f.addEventListener("input", function(){ vals[i] = f.value; persist(); });
    });
    C.body.appendChild(ladder);
    var edited = el("div", "edited"); C.body.appendChild(edited);
    var clr = el("button", "dbtn", "Clear ladder"); C.body.appendChild(clr);
    C.body.appendChild(el("div", "hint", "Fuel is in thousands of pounds: type 20.0 for 20,000 lb. Copy from the flight plan. The OFP governs."));
    addStale(C.warn, function(){ return t; }, "fuel ladder entries");
    resetters.push(function(){ clr.click(); });
    function persist(){
      if(vals.every(function(v){ return !v.trim(); })){ lsDel(LADDER_KEY); t = 0; }
      else{ t = Date.now(); lsSet(LADDER_KEY, JSON.stringify({ v: vals, t: t })); }
      setEdited(edited, t); refreshStale(); ladderRef.on.forEach(function(fn){ fn(); });
    }
    clr.addEventListener("click", function(){
      for(var i = 0; i < 5; i++){ vals[i] = ""; ins[i].value = ""; }
      lsDel(LADDER_KEY); t = 0; setEdited(edited, 0); refreshStale(); ladderRef.on.forEach(function(fn){ fn(); });
    });
    window.ofpApplyLadder = function(v){
      for(var i = 0; i < 5; i++){ vals[i] = v[i] || ""; ins[i].value = vals[i]; }
      persist();
    };
    setEdited(edited, t);
    viewFuel.appendChild(C.wrap);
  })();

  // Bingo fuel calculator.
  // FOM 4.40.15: Bingo = (FOB - predicted fuel at destination) + fuel to ALT + REMF (not less than FAR 00:45)
  (function(){
    var C = mkCard("Bingo Fuel");
    var KEYS = ["fob", "dst", "alt", "min"];
    var LABELS = ["Fuel on board now (k lb)", "Predicted fuel at destination (k lb)", "Fuel to ALT, ALTN line (k lb)", "REMF, FAR 00:45 or more (k lb)"];
    var d = { fob: "", dst: "", alt: "", min: "" }, t = 0;
    (function load(){
      var o = lsJSON(BINGO_KEY);
      if(o && typeof o === "object"){
        KEYS.forEach(function(k){ if(o[k] != null) d[k] = String(o[k]); });
        if(typeof o.t === "number") t = o.t;
      }
    })();
    var ins = {};
    var grid = el("div", "cplist");
    for(var r = 0; r < 2; r++){
      var row = el("div", "row2");
      for(var c = 0; c < 2 && r * 2 + c < KEYS.length; c++){
        var k = KEYS[r * 2 + c];
        var f = inp({ inputmode: "decimal", placeholder: "---" });
        f.value = d[k]; ins[k] = f;
        row.appendChild(field(LABELS[r * 2 + c], f));
      }
      grid.appendChild(row);
    }
    C.body.appendChild(grid);
    var out = tile("neg", "Bingo fuel");
    C.body.appendChild(out);
    C.body.appendChild(el("div", "hint", "Bingo = (FOB \u2212 fuel at destination) + fuel to ALT + REMF. Fuel at destination from FMC/HOWGOZIT/OFP. Fuel to ALT is the ALTN line of the OFP fuel ladder. REMF is not less than FAR 00:45 (international: FAR 30 \u00d7 1.5)."));
    var edited = el("div", "edited"); C.body.appendChild(edited);
    var clr = el("button", "dbtn", "Clear bingo"); C.body.appendChild(clr);
    addStale(C.warn, function(){ return t; }, "bingo fuel entries");
    resetters.push(function(){ clr.click(); });

    function eff(k){ return kNum(d[k]); }
    function show(){
      out.v.className = "tv neg";
      var n = ["fob", "dst", "alt", "min"].map(eff);
      if(n.some(function(x){ return x === null; })){ out.v.textContent = "--"; return; }
      var b = Math.round(((n[0] - n[1]) + n[2] + n[3]) * 10) / 10;
      out.v.textContent = b.toFixed(1) + "k lb";
    }
    ladderRef.on.push(show);
    function persist(){
      if(KEYS.every(function(k){ return !d[k].trim(); })){ lsDel(BINGO_KEY); t = 0; }
      else{
        t = Date.now();
        lsSet(BINGO_KEY, JSON.stringify({ fob: d.fob, dst: d.dst, alt: d.alt, min: d.min, t: t }));
      }
      setEdited(edited, t); refreshStale();
    }
    KEYS.forEach(function(k){
      ins[k].addEventListener("input", function(){ d[k] = ins[k].value; show(); persist(); });
    });
    clr.addEventListener("click", function(){
      KEYS.forEach(function(k){ d[k] = ""; ins[k].value = ""; });
      show(); lsDel(BINGO_KEY); t = 0; setEdited(edited, 0); refreshStale();
    });
    window.ofpApplyBingo = function(dst){
      d.fob = ""; ins.fob.value = ""; d.alt = ""; ins.alt.value = ""; d.min = ""; ins.min.value = "";
      d.dst = dst || ""; ins.dst.value = d.dst;
      show(); persist();
    };
    show(); setEdited(edited, t);
    viewFuel.appendChild(C.wrap);
  })();

  // Fuel page: buttons switch between the fuel ladder and the Bingo calculator.
  (function(){
    var wraps = [].slice.call(viewFuel.children).filter(function(n){ return n.classList.contains("wrap"); });
    if(wraps.length < 2) return;
    var PG_KEY = "orca_fuelpg", pg = lsGet(PG_KEY) === "bingo" ? 1 : 0;
    var seg = el("div", "preseg full");
    var bL = el("button", "btn big", "Fuel Ladder"), bB = el("button", "btn big", "Bingo");
    seg.appendChild(bL); seg.appendChild(bB);
    viewFuel.insertBefore(seg, wraps[0]);
    function draw(){
      wraps[0].hidden = pg !== 0; wraps[1].hidden = pg !== 1;
      bL.setAttribute("aria-pressed", pg === 0 ? "true" : "false"); bB.setAttribute("aria-pressed", pg === 1 ? "true" : "false");
    }
    bL.addEventListener("click", function(){ pg = 0; lsSet(PG_KEY, "ladder"); draw(); });
    bB.addEventListener("click", function(){ pg = 1; lsSet(PG_KEY, "bingo"); draw(); });
    draw();
  })();

})();
