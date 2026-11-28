/* Flight Plan app, part: preflight. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP;
var el = FP.el, viewPre = FP.viewPre, lsJSON = FP.lsJSON, pad2 = FP.pad2, mkCard = FP.mkCard, lsGet = FP.lsGet, inp = FP.inp, flt = FP.flt, field = FP.field, AOA_KEY = FP.AOA_KEY, FM = FP.FM, sel = FP.sel, lsSet = FP.lsSet, tile = FP.tile, addStale = FP.addStale, lsDel = FP.lsDel, setEdited = FP.setEdited, refreshStale = FP.refreshStale, resetters = FP.resetters;
  // ═══════════ 0) FLIGHT + FMS DATA ═══════════
  var flightRef = { dep: "", arr: "", block: "", on: [] };
  var PLAN_KEY = "orca_plan";   // distance and time en route as printed on the loaded flight plan (read-only; separate from the FMS boxes you type)
  try{ var pj = JSON.parse(localStorage.getItem(PLAN_KEY) || "null"); if(pj){ flightRef.planDist = pj.dist || ""; flightRef.planTime = pj.time || ""; } }catch(e){}
  // OFP upload (parsed on this device by the Nav Log page; the PDF never leaves it)
  var ofpBar = el("div", "ofpbar full");
  var ofpTx = el("div", "ofptx");
  ofpTx.appendChild(el("div", "ofpt", "Flight plan"));
  var ofpSt = el("div", "ofps", "Load the United OFP PDF here or in the Nav Log tab. It is read on this device and never uploaded. Flight, times, fuel ladder and ETOPS fill in here; FMS data you type yourself as a cross-check.");
  ofpTx.appendChild(ofpSt);
  viewPre.appendChild(ofpBar);
  ofpBar.appendChild(ofpTx);
  var ofpFile = document.createElement("input"); ofpFile.type = "file"; ofpFile.accept = "application/pdf,.pdf"; ofpFile.style.display = "none";
  var ofpBtn = el("button", "btn big", "Load flight plan PDF"); ofpBtn.id = "preLoadPdf";
  ofpBtn.addEventListener("click", function(){ ofpFile.click(); });
  ofpFile.addEventListener("change", function(){
    var f = ofpFile.files && ofpFile.files[0]; if(!f) return;
    ofpSt.className = "ofps"; ofpSt.textContent = "Reading " + f.name + "…";
    try{ window.nlLoadFile(f); }catch(e){ ofpSt.className = "ofps err"; ofpSt.textContent = "Could not start the Nav Log: " + e.message; }
    setTimeout(function(){ ofpFile.value = ""; }, 500);
  });
  var ofpView = el("button", "btn big", "View PDF"); ofpView.id = "preViewPdf"; ofpView.hidden = true;
  var viewBack = null;
  ofpView.addEventListener("click", function(){
    var cur = ["pre","nav","fuel","new","in"].filter(function(k){ var b = document.getElementById("nav-" + k); return b && b.getAttribute("aria-selected") === "true"; })[0];
    viewBack = cur && cur !== "nav" ? "nav-" + cur : null;
    var nb = document.getElementById("nav-nav"); if(nb) nb.click();   // the viewer lives in the Nav Log page
    setTimeout(function(){ try{ window.NavLog.viewPdf(); }catch(e){} }, 60);
  });
  window.addEventListener("navlogpdfclosed", function(){
    if(viewBack){ var b = document.getElementById(viewBack); viewBack = null; if(b) b.click(); }
  });
  function refreshViewBtn(){
    try{ if(window.NavLog && window.NavLog.hasPdf) window.NavLog.hasPdf().then(function(ok){ ofpView.hidden = !ok; }); }catch(e){}
  }
  window.refreshViewBtn = refreshViewBtn;
  ["navlogloaded","navlogerror"].forEach(function(ev){ window.addEventListener(ev, function(){ setTimeout(refreshViewBtn, 400); }); });
  document.addEventListener("click", function(e){ var t = e.target; if(t && (t.id === "nav-pre" || t.id === "resetAll" || t.id === "wipeAll")) setTimeout(refreshViewBtn, 500); });
  setTimeout(refreshViewBtn, 800);
  ofpBar.appendChild(ofpBtn); ofpBar.appendChild(ofpView); ofpBar.appendChild(ofpFile);
  window.refreshOfpView = function(){};
  window.addEventListener("navlogask", function(){ var nb = document.getElementById("nav-nav"); if(nb) nb.click(); });
  window.addEventListener("navlogerror", function(ev){
    clearTimeout(window.nlTimer); ofpSt.className = "ofps err"; ofpSt.textContent = "Could not read that PDF: " + ev.detail;
  });
  window.addEventListener("navlogloaded", function(ev){
    clearTimeout(window.nlTimer);
    setTimeout(function(){ if(window.refreshOfpView) window.refreshOfpView(); }, 50);
    var d = ev.detail, h = d.h || {}, fm = d.fms || {}, rt = d.routing || {};
    var chk = d.checks ? " · parse " + d.checks[0] + "/" + d.checks[1] : "";
    var cs = String(h.callsign || ""), m = /^([A-Z]{3})(\d+)/.exec(cs);
    var fno = m ? ((m[1] === "UAL" ? "UA" : m[1]) + " " + m[2]) : cs;
    var tm = String(h.ete || "").replace(/^0/, "");
    var ap = String(h.type || "").replace(/^B/, "");
    flightRef.planDist = rt.dist ? String(rt.dist) : ""; flightRef.planTime = tm;
    try{ localStorage.setItem(PLAN_KEY, JSON.stringify({ dist: flightRef.planDist, time: flightRef.planTime })); }catch(e){}
    window.ofpApply({
      flight: fno, dep: h.dep && h.dep.icao, arr: h.arr && h.arr.icao,
      out: h.outZ, off: h.offZ, on: h.onZ, inn: h.inZ, ap: ap,
      zfw: fm.weights && fm.weights.ZFW && fm.weights.ZFW.planned ? (fm.weights.ZFW.planned / 1000).toFixed(1) : "",
      crz: fm.cruiseFL ? "FL" + fm.cruiseFL : "", ci: rt.ci, df: rt.perf, dist: rt.dist, time: tm
    });
    // Fuel page: ladder (PLAN GATE, MIN TO, ALT, RSV=FAR, REMF) and Bingo's destination fuel. FOB stays yours to enter.
    var lad = d.ladder || [], kl = function(x){ return x == null ? "" : (x / 1000).toFixed(1); };
    var altL = lad.filter(function(l, i){ return i > 0 && /^[A-Z]{4}\/[A-Z]{3}$/.test(l.label); })[0];
    function lf(label){ var r = lad.filter(function(l){ return l.label === label; })[0]; return r ? kl(r.fuel) : ""; }
    var farL = lad.filter(function(l){ return l.label === "FAR"; })[0];
    window.ofpApplyLadder([lf("PLAN GATE"), lf("MIN T/O"), altL ? kl(altL.fuel) : "", farL ? kl(farL.fuel) : "", lf("REMF")]);
    // Bingo is an on-demand calculator: it is never filled from the OFP.
    window.ofpApplyEtops(d.etops);
    if(window.preRenderRoute) window.preRenderRoute();
    var etn = d.etops && ((d.etops.cps && d.etops.cps.length) || (d.etops.windows && d.etops.windows.length));
    // Date check: the OFP date is local; allow yesterday and tomorrow for time zones.
    var MON = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    var dm = /^(\d{2})([A-Z]{3})(\d{2})$/.exec(String(h.dateLocal || "")), old = "";
    if(dm){
      var od = new Date(2000 + +dm[3], MON.indexOf(dm[2]), +dm[1]), now = new Date();
      var diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - od) / 86400000);
      if(Math.abs(diff) > 1) old = " WARNING: this OFP is dated " + h.dateLocal + ", which is not today. Check you loaded the right plan.";
    }
    var bad = d.checks && d.checks[0] !== d.checks[1];
    ofpSt.className = (bad || old) ? "ofps err" : "ofps ok";
    ofpSt.textContent = fno + " " + (h.dep ? h.dep.icao : "") + " to " + (h.arr ? h.arr.icao : "") + " loaded" + chk +
      ". Filled: flight, times, fuel ladder (RSV is the FAR line)" + (etn ? ", ETOPS airports and critical points" : "") + ". FMS data is left for you to type as a cross-check." + old;
  });
  (function(){
    var RT_KEY = "orca_route", FMS_KEY = "orca_fms";
    var r = { dep: "", arr: "", out: "", off: "", on: "", inn: "" }, rt = 0;
    var f = { zfw: "", rsv: "", crz: "", ci: "", df: "", dist: "", time: "" }, ft = 0, open = false;
    (function load(){
      var o = lsJSON(RT_KEY);
      if(o && typeof o === "object"){ Object.keys(r).forEach(function(k){ if(o[k] != null) r[k] = String(o[k]); }); if(typeof o.t === "number") rt = o.t; }
      var p = lsJSON(FMS_KEY);
      if(p && typeof p === "object"){ Object.keys(f).forEach(function(k){ if(p[k] != null) f[k] = String(p[k]); }); if(typeof p.t === "number") ft = p.t; open = p.open === true; }
    })();

    function mins(s){
      var m = /^(\d{2})(\d{2})$/.exec(s.trim());
      if(!m || +m[1] > 23 || +m[2] > 59) return null;
      return +m[1] * 60 + +m[2];
    }
    function span(a, b){
      var x = mins(a), y = mins(b);
      if(x === null || y === null) return null;
      return (y - x + 1440) % 1440;
    }
    function hm(n){ return n === null ? "--" : Math.floor(n / 60) + ":" + pad2(n % 60); }

    // ── flight card ──
    var C = mkCard("Flight");
    var preSeg = el("div", "preseg full"); var flightBtn = el("button", "btn big", "Flight"); var fmsBtn = el("button", "btn big", "FMS Data"); var diffBtn = el("button", "btn big", "Differences"); diffBtn.setAttribute("aria-pressed", "false");
    flightBtn.setAttribute("aria-pressed", "true"); fmsBtn.setAttribute("aria-pressed", "false");
    preSeg.appendChild(flightBtn); preSeg.appendChild(fmsBtn); preSeg.appendChild(diffBtn); viewPre.appendChild(preSeg);
    var diffOn = lsGet("orca_pre_diff") === "1";
    var fltIn = inp({ maxlength: "12", autocapitalize: "characters", "aria-label": "Flight number", placeholder: "---" });
    var depIn = inp({ maxlength: "4", autocapitalize: "characters", "aria-label": "Departure", placeholder: "---" });
    var arrIn = inp({ maxlength: "4", autocapitalize: "characters", "aria-label": "Arrival", placeholder: "---" });
    var tIn = {};
    var TL = [["out", "OUT (Z)"], ["off", "OFF (Z)"], ["on", "ON (Z)"], ["inn", "IN (Z)"]];
    TL.forEach(function(x){
      tIn[x[0]] = inp({ inputmode: "numeric", maxlength: "4", placeholder: "---", "aria-label": x[1] });
    });
    depIn.value = r.dep; arrIn.value = r.arr;
    TL.forEach(function(x){ tIn[x[0]].value = r[x[0]]; });
    fltIn.value = flt.value;

    C.body.appendChild(field("Flight number", fltIn));
    var apSaved = lsJSON(AOA_KEY) || {};
    var apId = FM.airplanes.some(function(a){ return a.id === apSaved.ap; }) ? apSaved.ap : FM.defaultAirplane;
    var apSel = sel(FM.airplanes.map(function(a){ return [a.id, a.name]; }), apId);
    apSel.setAttribute("aria-label", "Aircraft type");
    C.body.appendChild(field("AIRCRAFT TYPE (used for the ETOPS rings)", apSel));
    apSel.addEventListener("change", function(){
      var o = lsJSON(AOA_KEY) || {};
      o.ap = apSel.value;
      lsSet(AOA_KEY, JSON.stringify(o));
      window.dispatchEvent(new Event("apsync"));
    });
    var rowA = el("div", "row2"); rowA.appendChild(field("DEP", depIn)); rowA.appendChild(field("ARR", arrIn));
    C.body.appendChild(rowA);
    var rowB = el("div", "row2"); rowB.appendChild(field(TL[0][1], tIn.out)); rowB.appendChild(field(TL[1][1], tIn.off));
    C.body.appendChild(rowB);
    var rowC = el("div", "row2"); rowC.appendChild(field(TL[2][1], tIn.on)); rowC.appendChild(field(TL[3][1], tIn.inn));
    C.body.appendChild(rowC);
    var DI = inp({ inputmode: "numeric", placeholder: "---", maxlength: "5", "aria-label": "Distance, nm" });
    var TM = inp({ placeholder: "---", maxlength: "6", "aria-label": "Flight time" });
    DI.value = f.dist; TM.value = f.time;
        function mkRoute(){
      var t = tile("neu", "Route");
      t.sub = el("div", "hint"); t.appendChild(t.sub);
      return t;
    }
    var routeTop = mkRoute(); C.body.appendChild(routeTop);
    var tiles = el("div", "tiles");
    var tBlock = tile("acc", "Block time (OUT to IN)"), tAir = tile("neu", "Air time (OFF to ON)");
    tiles.appendChild(tBlock); tiles.appendChild(tAir);
    C.body.appendChild(tiles);
    var edited = el("div", "edited"); C.body.appendChild(edited);
    var clr = el("button", "btn big", "Clear flight times");
    C.body.appendChild(clr);
    C.body.appendChild(el("div", "hint", "Times are UTC, 4 digits (1435 for 1435Z). Block and air time handle crossing midnight. The flight number, route, aircraft and times show in the header on every page."));
    addStale(C.warn, function(){ return rt; }, "flight times");
    viewPre.appendChild(C.wrap);
    var preBrief = document.createElement("div"); preBrief.id = "preBrief"; viewPre.appendChild(preBrief);
    window.mountPreBrief = function(){ try{ if(window.NavLog && window.NavLog.mountPre) window.NavLog.mountPre(preBrief); }catch(e){} };

    // ── FMS data card ──
    var F = mkCard("FMS Data");
    var ZF = inp({ inputmode: "decimal", placeholder: "---", "aria-label": "ZFW, k lb" });
    var RS = inp({ inputmode: "decimal", placeholder: "---", "aria-label": "Reserves, k lb" });
    var CZ = inp({ placeholder: "---", maxlength: "6", autocapitalize: "characters", "aria-label": "Cruise altitude" });
    var CI = inp({ inputmode: "numeric", placeholder: "CI", maxlength: "4", "aria-label": "Cost index" });
    var DF = inp({ placeholder: "+0.0/+0.0", maxlength: "12", "aria-label": "Drag and fuel flow factors" });
    var map = { zfw: ZF, rsv: RS, crz: CZ, ci: CI, df: DF, dist: DI, time: TM };
    Object.keys(map).forEach(function(k){ map[k].value = f[k]; });
    // ZFW and reserve are thousands of pounds with one decimal (123.5). Whole numbers or pounds are tidied on leaving the box.
    [ZF, RS].forEach(function(box){
      box.addEventListener("blur", function(){
        var x = parseFloat(String(box.value).replace(/,/g, "")); if(isNaN(x)) return;
        if(x >= 1000) x = x / 1000;
        var v = x.toFixed(1);
        if(v !== box.value){ box.value = v; box.dispatchEvent(new Event("input", { bubbles: true })); }
      });
    });
    var rows = [[["ZFW (k lb)", ZF], ["RSV (k lb)", RS]], [["CRZ ALT", CZ], ["CI", CI]], [["D/F (DRAG / FUEL FLOW)", DF], ["DIST (nm)", DI]], [["TIME (from flight plan)", TM]]];
    rows.forEach(function(rw){
      var d = el("div", "row2"); rw.forEach(function(x){ d.appendChild(field(x[0], x[1])); }); F.body.appendChild(d);
    });
    var fEdited = el("div", "edited"); F.body.appendChild(fEdited);
    var fClr = el("button", "btn big", "Clear FMS data"); F.body.appendChild(fClr);
    F.body.appendChild(el("div", "hint", "Reference for programming the FMS. Fuel in thousands of pounds. The OFP and dispatch release govern."));
    addStale(F.warn, function(){ return ft; }, "FMS entries");
    F.wrap.hidden = !open;
    viewPre.appendChild(F.wrap);

    // ── Differences card (757/767 differences card, 19 SEP 25, 756DIFF) ──
    var D = mkCard("757/767 Differences");
    var dh = '<div style="overflow-x:auto"><table class="dtab"><colgroup><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"></colgroup><thead><tr><th></th><th>752</th><th>753</th><th>763</th><th>764</th></tr></thead><tbody>' +
      '<tr><th class="rl">Min FAs</th><td>4</td><td>5</td><td>5</td><td>6</td></tr>' +
      '<tr><th class="rl">Dom Oil</th><td colspan="2">16 qt</td><td rowspan="2">15 qt</td><td>16 qt</td></tr>' +
      '<tr><th class="rl">ETOPS Oil</th><td colspan="2">18 qt</td><td>18 qt</td></tr>' +
      '<tr><th class="rl">Ground Start</th><td colspan="2">25% N3, 10% N2, EGT&lt;100<sup>1</sup><small>(&ge;15% N3 MM, N2 MM)</small></td><td>MM N2, &gt;Fuel On Cmd bug</td><td>20% N2<small>(&ge;15% MM)</small></td></tr>' +
      '<tr><th class="rl">Warmup<sup>2</sup></th><td colspan="4">3 min (shutdown &le;1.5 hr) / 5 min (&gt;1.5 hr)</td></tr>' +
      '<tr><th class="rl">Cooldown<sup>3</sup></th><td colspan="2">3 min</td><td>5 min</td><td>3 min</td></tr>' +
      '<tr><th class="rl">Turbulence</th><td colspan="4">.78M/290 (&ge;10K) / 250 (&lt;10K)</td></tr>' +
      '</tbody></table></div>' +
      '<div class="dnote"><sup>1</sup>Rich until idle if EGT=0 &nbsp; <sup>2</sup>Should for 757 / Rec. for 767 &nbsp; <sup>3</sup>Rec. for all</div>' +
      '<div style="overflow-x:auto;margin-top:14px"><table class="dtab"><colgroup><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"></colgroup><thead><tr><th>Max Limit</th><th>752</th><th>753</th><th>763</th><th>764</th></tr></thead><tbody>' +
      '<tr><th class="rl">Taxi</th><td>256.0</td><td>273.5</td><td>408.4</td><td>451.0</td></tr>' +
      '<tr><th class="rl">Takeoff</th><td>255.0</td><td>272.5</td><td>407.0</td><td>450.0</td></tr>' +
      '<tr><th class="rl">Landing</th><td>198.0</td><td>224.0</td><td>320.0</td><td>350.0</td></tr>' +
      '<tr><th class="rl">ZFW</th><td>185.4</td><td>211.7</td><td>291.3</td><td>330.0</td></tr>' +
      '<tr><th class="rl">Wingspan</th><td colspan="2">135 ft<small>41.1 m</small></td><td>167 ft<small>50.9 m</small></td><td>171 ft<small>52.0 m</small></td></tr>' +
      '<tr><th class="rl">180&deg; Turn</th><td>120 ft<small>36.6 m</small></td><td>141 ft<small>43.0 m</small></td><td>146 ft<small>44.6 m</small></td><td>165 ft<small>50.3 m</small></td></tr>' +
      '</tbody></table></div>' +
      '<div class="dnote">Reference copy of the 757/767 Differences card (19 SEP 25, 756DIFF). Max limit weights in thousands of pounds. The card and the Flight Manual govern.</div>';
    var DT = { "752": { n: "757-200", fa: "4", dom: "16 qt", et: "18 qt", gs: "25% N3, 10% N2, EGT&lt;100<sup>1</sup><small>(&ge;15% N3 MM, N2 MM)</small>", cd: "3 min", lim: ["256.0","255.0","198.0","185.4"], ws: "135 ft<small>41.1 m</small>", tn: "120 ft<small>36.6 m</small>" },
      "753": { n: "757-300", fa: "5", dom: "16 qt", et: "18 qt", gs: "25% N3, 10% N2, EGT&lt;100<sup>1</sup><small>(&ge;15% N3 MM, N2 MM)</small>", cd: "3 min", lim: ["273.5","272.5","224.0","211.7"], ws: "135 ft<small>41.1 m</small>", tn: "141 ft<small>43.0 m</small>" },
      "763": { n: "767-300", fa: "5", dom: "15 qt", et: "15 qt", gs: "MM N2, &gt;Fuel On Cmd bug", cd: "5 min", lim: ["408.4","407.0","320.0","291.3"], ws: "167 ft<small>50.9 m</small>", tn: "146 ft<small>44.6 m</small>" },
      "764": { n: "767-400", fa: "6", dom: "16 qt", et: "18 qt", gs: "20% N2<small>(&ge;15% MM)</small>", cd: "3 min", lim: ["451.0","450.0","350.0","330.0"], ws: "171 ft<small>52.0 m</small>", tn: "165 ft<small>50.3 m</small>" } };
    function oneHTML(id){
      var t = DT[id]; if(!t) return "";
      function r(l, v){ return '<tr><th class="rl">' + l + '</th><td>' + v + '</td></tr>'; }
      return '<div style="overflow-x:auto"><table class="dtab"><colgroup><col style="width:40%"><col style="width:60%"></colgroup><thead><tr><th></th><th>' + id + ' &middot; ' + t.n + '</th></tr></thead><tbody>' +
        r("Min FAs", t.fa) + r("Dom Oil", t.dom) + r("ETOPS Oil", t.et) + r("Ground Start", t.gs) +
        r("Warmup<sup>2</sup>", "3 min (shutdown &le;1.5 hr) / 5 min (&gt;1.5 hr)") + r("Cooldown<sup>3</sup>", t.cd) +
        r("Turbulence", ".78M/290 (&ge;10K) / 250 (&lt;10K)") + '</tbody></table></div>' +
        '<div class="dnote"><sup>1</sup>Rich until idle if EGT=0 &nbsp; <sup>2</sup>Should for 757 / Rec. for 767 &nbsp; <sup>3</sup>Rec. for all</div>' +
        '<div style="overflow-x:auto;margin-top:14px"><table class="dtab"><colgroup><col style="width:40%"><col style="width:60%"></colgroup><thead><tr><th>Max Limit</th><th>' + id + '</th></tr></thead><tbody>' +
        r("Taxi", t.lim[0]) + r("Takeoff", t.lim[1]) + r("Landing", t.lim[2]) + r("ZFW", t.lim[3]) + r("Wingspan", t.ws) + r("180&deg; Turn", t.tn) + '</tbody></table></div>' +
        '<div class="dnote">Reference copy of the 757/767 Differences card (19 SEP 25, 756DIFF). Max limit weights in thousands of pounds. The card and the Flight Manual govern.</div>';
    }
    var dSeg = el("div", "preseg full"); var dMine = el("button", "btn", ""); var dAll = el("button", "btn", "All types"); dSeg.appendChild(dMine); dSeg.appendChild(dAll);
    var dbox = document.createElement("div"), dwrap = document.createElement("div"), dall = document.createElement("div");
    dall.innerHTML = dh; D.body.appendChild(dSeg); D.body.appendChild(dbox); dbox.appendChild(dwrap); dbox.appendChild(dall);
    function dView(){
      var showAll = lsGet("orca_diff_all") === "1", id = apSel.value;
      dMine.textContent = "My aircraft (" + id + ")";
      dMine.setAttribute("aria-pressed", showAll ? "false" : "true"); dAll.setAttribute("aria-pressed", showAll ? "true" : "false");
      dwrap.innerHTML = oneHTML(id); dwrap.style.display = showAll ? "none" : ""; dall.style.display = showAll ? "" : "none";
    }
    dMine.addEventListener("click", function(){ lsSet("orca_diff_all", "0"); dView(); });
    dAll.addEventListener("click", function(){ lsSet("orca_diff_all", "1"); dView(); });
    apSel.addEventListener("change", dView); window.addEventListener("apsync", dView);
    dView();
    D.wrap.classList.add("full"); viewPre.appendChild(D.wrap);

    window.preRenderRoute = function(){ render(); };
    function render(){
      var blk = span(r.out, r.inn), air = span(r.off, r.on);
      tBlock.v.textContent = hm(blk); tAir.v.textContent = hm(air);
      var fm = span(r.out, r.on);
      flightRef.block = fm === null ? "" : hm(fm);
      var rtxt = (r.dep || "----") + " → " + (r.arr || "----");
      var pt = String(flightRef.planTime || "").trim().replace(/^(\d{1,2})(\d{2})$/, "$1:$2");
      var sub = "DIST " + (flightRef.planDist ? flightRef.planDist + " nm" : "--") + "   TIME " + (pt || "--");
      routeTop.v.textContent = rtxt; routeTop.sub.textContent = sub;
      
      fmsBtn.setAttribute("aria-pressed", open && !diffOn ? "true" : "false"); flightBtn.setAttribute("aria-pressed", !open && !diffOn ? "true" : "false");
      diffBtn.setAttribute("aria-pressed", diffOn ? "true" : "false");
      F.wrap.hidden = !open || diffOn; C.wrap.hidden = open || diffOn; preBrief.hidden = open || diffOn; D.wrap.hidden = !diffOn;
    }
    function saveRoute(){
      var any = Object.keys(r).some(function(k){ return r[k].trim(); });
      if(!any){ lsDel(RT_KEY); rt = 0; }
      else{ rt = Date.now(); lsSet(RT_KEY, JSON.stringify({ dep: r.dep, arr: r.arr, out: r.out, off: r.off, on: r.on, inn: r.inn, t: rt })); }
      setEdited(edited, rt); refreshStale(); render();
      window.dispatchEvent(new Event("fbsync"));
    }
    function saveFms(){
      var any = Object.keys(f).some(function(k){ return f[k].trim(); });
      if(!any) ft = 0; else ft = Date.now();
      if(!any && !open) lsDel(FMS_KEY);
      else lsSet(FMS_KEY, JSON.stringify({ zfw: f.zfw, rsv: f.rsv, crz: f.crz, ci: f.ci, df: f.df, dist: f.dist, time: f.time, open: open, t: ft }));
      setEdited(fEdited, ft); refreshStale(); render();
    }
    fltIn.addEventListener("input", function(){
      flt.value = fltIn.value; flt.dispatchEvent(new Event("input"));
    });
    window.addEventListener("fltsync", function(){ fltIn.value = flt.value; });
    [["dep", depIn], ["arr", arrIn]].forEach(function(x){
      x[1].addEventListener("input", function(){ x[1].value = x[1].value.toUpperCase(); r[x[0]] = x[1].value; saveRoute(); });
    });
    TL.forEach(function(x){
      var i = tIn[x[0]];
      i.addEventListener("input", function(){ i.value = i.value.replace(/\D/g, "").slice(0, 4); r[x[0]] = i.value; saveRoute(); });
    });
    Object.keys(map).forEach(function(k){
      map[k].addEventListener("input", function(){
        if(k === "crz") map[k].value = map[k].value.toUpperCase();
        f[k] = map[k].value; saveFms();
      });
    });
    function setDiff(v){ diffOn = v; lsSet("orca_pre_diff", v ? "1" : "0"); }
    fmsBtn.addEventListener("click", function(){ open = true; setDiff(false); saveFms(); render(); });
    flightBtn.addEventListener("click", function(){ open = false; setDiff(false); saveFms(); render(); });
    diffBtn.addEventListener("click", function(){ setDiff(true); render(); });
    clr.addEventListener("click", function(){
      ["out", "off", "on", "inn"].forEach(function(k){ r[k] = ""; tIn[k].value = ""; });
      saveRoute();
    });
    fClr.addEventListener("click", function(){
      Object.keys(f).forEach(function(k){ f[k] = ""; map[k].value = ""; });
      saveFms();
    });
    resetters.push(function(){
      r.dep = r.arr = ""; depIn.value = arrIn.value = "";
      ["out", "off", "on", "inn"].forEach(function(k){ r[k] = ""; tIn[k].value = ""; });
      Object.keys(f).forEach(function(k){ f[k] = ""; map[k].value = ""; });
      open = false; setDiff(false); lsDel(RT_KEY); lsDel(FMS_KEY); rt = 0; ft = 0;
      setEdited(edited, 0); setEdited(fEdited, 0); render(); refreshStale(); window.dispatchEvent(new Event("fbsync"));
    });
    window.ofpApply = function(d){
      function put(i, v){ if(v == null || v === "") return; i.value = String(v); i.dispatchEvent(new Event("input")); }
      put(fltIn, d.flight); put(depIn, d.dep); put(arrIn, d.arr);
      put(tIn.out, d.out); put(tIn.off, d.off); put(tIn.on, d.on); put(tIn.inn, d.inn);
      if(d.ap && FM.airplanes.some(function(a){ return a.id === d.ap; })){ apSel.value = d.ap; apSel.dispatchEvent(new Event("change")); }
      // FMS data is never filled from the OFP: typing it is the pilot's own cross-check against the plan.
    };
    setEdited(edited, rt); setEdited(fEdited, ft); render();
  })();


FP.PLAN_KEY = PLAN_KEY; FP.flightRef = flightRef; FP.ofpSt = ofpSt;
})();
