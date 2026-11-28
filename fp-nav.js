/* Flight Plan app, part: nav. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP;
var $ = FP.$, viewPre = FP.viewPre, viewIn = FP.viewIn, viewFuel = FP.viewFuel, viewNew = FP.viewNew, lsJSON = FP.lsJSON, AOA_KEY = FP.AOA_KEY, flt = FP.flt, FM = FP.FM, refreshStale = FP.refreshStale, lsSet = FP.lsSet, NAV_KEY = FP.NAV_KEY, lsGet = FP.lsGet, lsDel = FP.lsDel, resetters = FP.resetters, el = FP.el, PLAN_KEY = FP.PLAN_KEY, flightRef = FP.flightRef, ofpSt = FP.ofpSt, etpNav = FP.etpNav, etpFuel = FP.etpFuel, etpRings = FP.etpRings;
  // ═══════════ NAVIGATION ═══════════
  var views = { orca: $("view-orca"), pre: viewPre, nav: $("view-nav"), "in": viewIn, fuel: viewFuel, "new": viewNew };
  var btns = { pre: $("nav-pre"), nav: $("nav-nav"), "in": $("nav-in"), fuel: $("nav-fuel"), "new": $("nav-new") };

  // The Nav Log is built into this page (navlog-ui.js, in its own shadow root so styles never mix).
  var navHost = $("view-nav"), navMounted = false;
  function ensureNav(){
    if(navMounted) return;
    navMounted = true;
    try{ window.NavLog.mount(navHost); }
    catch(e){ navMounted = false; window.dispatchEvent(new CustomEvent("navlogerror", { detail: "Nav Log could not start (" + (e && e.message ? e.message : e) + ")" })); }
  }
  ensureNav(); if(window.mountPreBrief) window.mountPreBrief();
  window.nlLoadFile = function(file){ ensureNav(); window.NavLog.loadFile(file); };

  function updFbar(){
    var r = lsJSON("orca_route") || {}, a = lsJSON(AOA_KEY) || {};
    function set(id, v){ var n = $(id); var ok = v && String(v).trim(); n.textContent = ok ? v : "----"; n.className = ok ? "" : "dim"; }
    set("fbNo", flt.value.trim());
    $("fbRt").textContent = (r.dep || "----") + " \u2192 " + (r.arr || "----");
    var ap = FM.airplanes.filter(function(x){ return x.id === a.ap; })[0];
    $("fbAc").textContent = ap ? ap.name : "--";
    set("fbOut", r.out); set("fbOff", r.off); set("fbOn", r.on); set("fbIn", r.inn);
  }
  setTimeout(ensureNav, 1500);
  window.addEventListener("fltsync", updFbar); window.addEventListener("fbsync", updFbar); window.addEventListener("apsync", updFbar);
  var foot = $("foot"), ref = $("ref");
  var footOrca = foot.textContent;
  var footNew = "Reference aid only. The Flight Manual and OFP govern.";
  var REF = { pre: "PREFLIGHT", nav: "NAV LOG", "in": "INFLIGHT", fuel: "FUEL", "new": "ETOPS" };

  function showView(v, persist){
    Object.keys(views).forEach(function(k){
      views[k].hidden = (k !== v);
    });
    Object.keys(btns).forEach(function(k){
      btns[k].setAttribute("aria-selected", (k === v || (v === "orca" && k === "new")) ? "true" : "false");
    });
    $("orcatools").hidden = (v !== "orca");
    if(v === "nav") ensureNav();
    updFbar();
    foot.textContent = (v === "orca") ? footOrca : footNew;
    if(v === "orca"){ window.dispatchEvent(new Event("orcashown")); }
    else{ ref.textContent = REF[v]; refreshStale(); }
    if(persist) lsSet(NAV_KEY, v);
  }
  Object.keys(btns).forEach(function(k){
    btns[k].addEventListener("click", function(){ showView(k, true); });
  });
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) refreshStale(); });

  // Flight number: one field in the header, shared by every view, saved on the device.
  var FLT_KEY = "orca_flt";
  flt.value = lsGet(FLT_KEY) || "";
  flt.addEventListener("input", function(){
    flt.value = flt.value.toUpperCase();
    if(flt.value.trim()) lsSet(FLT_KEY, flt.value); else lsDel(FLT_KEY);
    window.dispatchEvent(new Event("fltsync"));
  });
  window.dispatchEvent(new Event("fltsync"));

  resetters.push(function(){ flt.value = ""; lsDel(FLT_KEY); window.dispatchEvent(new Event("fltsync")); });

  // Global Reset All: new flight. Clears ORCA checks, flight number, critical fuel,
  // FMC EO values, HF frequencies and the time fields. Airplane / ETOPS selections stay.
  var newFlt = el("div", "full newflt");
  newFlt.appendChild(el("div", "hint", "Starting a new flight? This clears everything you entered."));
  var resetBtn = el("button", "dbtn", "Reset All for a new flight"); resetBtn.id = "resetAll";
  newFlt.appendChild(resetBtn);
  var wipeBtn = el("button", "dbtn", "Clear ALL data on this device"); wipeBtn.id = "wipeAll"; wipeBtn.style.marginTop = "8px";
  var stoSt = el("div", "hint", ""); stoSt.style.marginTop = "6px";
  newFlt.appendChild(wipeBtn); newFlt.appendChild(stoSt);
  function stoCheck(){
    try{
      if(!(navigator.storage && navigator.storage.persisted)){ stoSt.textContent = ""; return; }
      navigator.storage.persisted().then(function(ok){
        if(ok) return true;
        return navigator.storage.persist ? navigator.storage.persist() : false;
      }).then(function(ok){
        stoSt.textContent = ok ? "Storage: protected. This device will keep your entries." : "Storage: not guaranteed. Add the app to your Home Screen so the device keeps your entries.";
      }).catch(function(){});
    }catch(e){}
  }
  stoCheck();
  wipeBtn.addEventListener("click", function(){
    if(!window.confirm("Clear ALL data on this device?\n\nThis deletes every entry, the saved flight plan PDFs, recent flights and settings (including airplane, ETOPS and theme). It cannot be undone. The app itself stays installed and works offline.")) return;
    try{ localStorage.clear(); }catch(e){}
    try{ sessionStorage.clear(); }catch(e){}
    var done = function(){ location.reload(); };
    try{
      var rq = indexedDB.deleteDatabase("navlog-pdf");
      rq.onsuccess = rq.onerror = rq.onblocked = done;
      setTimeout(done, 1500);
    }catch(e){ done(); }
  });
  viewPre.appendChild(newFlt);
  resetBtn.addEventListener("click", function(){
    if(!window.confirm("Reset ALL for a new flight?\n\nThis clears the ORCA checks, flight number, route and times, FMS data, critical fuel, FMC EO values, HF frequencies, fuel ladder, bingo fuel, time fields and the loaded Nav Log with its ATA and fuel entries.\n\nAirplane and ETOPS selections are kept.")) return;
    if(window.orcaResetChecks) window.orcaResetChecks();
    resetters.forEach(function(f){ try{ f(); }catch(e){} });
    try{ if(navMounted) window.NavLog.reset(); }catch(e){}
    try{ indexedDB.deleteDatabase("navlog-pdf"); }catch(e){}
    try{ localStorage.removeItem(PLAN_KEY); }catch(e){} flightRef.planDist = ""; flightRef.planTime = ""; if(window.preRenderRoute) window.preRenderRoute();
    ofpSt.className = "ofps"; ofpSt.textContent = "Load the United OFP PDF here or in the Nav Log tab. It is read on this device and never uploaded. Flight, times, fuel ladder and ETOPS fill in here; FMS data you type yourself as a cross-check.";
    refreshStale();
  });

  (function(){
    var PG_KEY = "orca_etops_pg", pg = lsGet(PG_KEY) === "rings" ? "rings" : "fuel";
    var bF = el("button", "btn big", "Fuel Analysis"), bR = el("button", "btn big", "ETOPS Rings");
    var bO = el("button", "btn big", "ORCA Checklist"); bO.setAttribute("aria-pressed", "false");
    etpNav.appendChild(bF); etpNav.appendChild(bR); etpNav.appendChild(bO);
    // The same three buttons sit at the top of the ORCA checklist so you can get back.
    var oNav = el("div", "etpnav"); oNav.style.cssText = "padding:8px 10px 0";
    var oF = el("button", "btn big", "Fuel Analysis"), oR = el("button", "btn big", "ETOPS Rings"), oO = el("button", "btn big", "ORCA Checklist");
    oO.setAttribute("aria-pressed", "true"); oF.setAttribute("aria-pressed", "false"); oR.setAttribute("aria-pressed", "false");
    oNav.appendChild(oF); oNav.appendChild(oR); oNav.appendChild(oO);
    var vo = $("view-orca"); vo.insertBefore(oNav, vo.firstChild);
    viewNew.appendChild(etpNav); viewNew.appendChild(etpFuel); viewNew.appendChild(etpRings);
    function showPg(p, save){
      pg = p;
      etpFuel.hidden = (p !== "fuel"); etpRings.hidden = (p !== "rings");
      bF.classList.toggle("on", p === "fuel"); bR.classList.toggle("on", p === "rings");
      bF.setAttribute("aria-pressed", p === "fuel" ? "true" : "false");
      bR.setAttribute("aria-pressed", p === "rings" ? "true" : "false");
      if(save) lsSet(PG_KEY, p);
    }
    bF.addEventListener("click", function(){ showPg("fuel", true); });
    bR.addEventListener("click", function(){ showPg("rings", true); });
    bO.addEventListener("click", function(){ showView("orca", true); });
    oF.addEventListener("click", function(){ showPg("fuel", true); showView("new", true); });
    oR.addEventListener("click", function(){ showPg("rings", true); showView("new", true); });
    showPg(pg, false);
  })();

  var start = lsGet(NAV_KEY);
  if(!views[start]) start = "pre";
  showView(start, false);
})();
