/* Flight Plan app, part: etops. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP;
var mkCard = FP.mkCard, FM = FP.FM, el = FP.el, etpRings = FP.etpRings, lsJSON = FP.lsJSON, AOA_KEY = FP.AOA_KEY, tile = FP.tile, sel = FP.sel, field = FP.field, lsSet = FP.lsSet, FUEL_KEY = FP.FUEL_KEY, inp = FP.inp, resetters = FP.resetters, addStale = FP.addStale, lsDel = FP.lsDel, setEdited = FP.setEdited, refreshStale = FP.refreshStale, etpFuel = FP.etpFuel;
  // ═══════════ 1) AIRPLANE + ETOPS AOA (from FM data block) ═══════════
  (function(){
    var C = mkCard("Airplane + ETOPS AOA");
    var n = FM.ruleTimes.length - 1;
    var ok = FM.airplanes.every(function(a){ return a.m290.length === n && a.m310.length === n; });
    if(!ok){
      C.body.appendChild(el("div", "msg", "FM data block error: check array lengths."));
      etpRings.appendChild(C.wrap);
      return;
    }

    var saved = lsJSON(AOA_KEY) || {};
    var apId = FM.airplanes.some(function(a){ return a.id === saved.ap; }) ? saved.ap : FM.defaultAirplane;
    var spId = FM.speeds[saved.sp] ? saved.sp : FM.defaultSpeed;
    var rt = FM.ruleTimes.indexOf(+saved.rt) >= 0 ? +saved.rt : FM.defaultRule;

    var apTile = tile("neu", "Aircraft (set on Preflight)");
    var spSel = sel(FM.speedOrder.map(function(k){ return [k, FM.speeds[k].label]; }), spId);
    var rtSel = sel(FM.ruleTimes.map(function(m){ return [String(m), m + " min"]; }), String(rt));

    var t1 = tile("acc", FM.ruleTimes[0] + "-minute distance");
    var t2 = tile("acc", FM.ruleTimes[0] + "-minute speed");
    var tiles = el("div", "tiles"); tiles.appendChild(t1); tiles.appendChild(t2);
    var ring = tile("neu", "");
    var ringSub = el("div", "hint");

    C.body.appendChild(apTile);
    C.body.appendChild(tiles);
    C.body.appendChild(field("Dispatched ETOPS time", rtSel));
    C.body.appendChild(field("Diversion speed (" + FM.ruleTimes[1] + " min and up)", spSel));
    ring.appendChild(ringSub);
    C.body.appendChild(ring);
    C.body.appendChild(el("div", "hint", "The " + FM.ruleTimes[0] + " minute ring is always " + FM.d60Speed +
      ". The speed selector applies to " + FM.ruleTimes[1] + " minutes and up."));
    C.body.appendChild(el("div", "src2", FM.source + ", " + FM.date));

    function render(){
      var a = FM.airplanes.filter(function(x){ return x.id === apId; })[0];
      apTile.v.textContent = a.name;
      var dist, tag;
      if(rt === FM.ruleTimes[0]){ dist = a.d60; tag = FM.d60Speed; }
      else{ dist = a[spId][FM.ruleTimes.indexOf(rt) - 1]; tag = FM.speeds[spId].tag; }
      t1.v.textContent = a.d60 + " nm";
      t2.v.textContent = FM.d60Speed;
      ring.l.textContent = "Ring radius, " + rt + " min";
      ring.v.textContent = dist + " nm";
      ringSub.textContent = "Speed used: " + tag;
    }
    function persist(){
      var o = lsJSON(AOA_KEY) || {};
      o.sp = spId; o.rt = rt;
      lsSet(AOA_KEY, JSON.stringify(o));
    }
    window.addEventListener("apsync", function(){
      var o = lsJSON(AOA_KEY) || {};
      if(FM.airplanes.some(function(a){ return a.id === o.ap; })){ apId = o.ap; render(); }
    });
    spSel.addEventListener("change", function(){ spId = spSel.value; render(); persist(); });
    rtSel.addEventListener("change", function(){ rt = +rtSel.value; render(); persist(); });
    render();
    etpRings.appendChild(C.wrap);
  })();

  // ═══════════ 2) ETOPS FUEL ANALYSIS (typed per flight) ═══════════
  (function(){
    var CA = mkCard("ETOPS Airports");
    var CP = mkCard("Critical Points");
    var en = "", ex = "", savedT = 0;
    var alts = [{ ic: "", from: "", to: "" }, { ic: "", from: "", to: "" }];
    var cps = [newCP()];
    function newCP(){ return { a1: "", a2: "", lat: "", lon: "", fr: "", rq: "" }; }
    function str(v){ return v == null ? "" : String(v); }

    (function load(){
      var o = lsJSON(FUEL_KEY);
      if(!o || typeof o !== "object") return;
      var d = o.d;
      if(d && typeof d === "object"){
        if(typeof d.en === "string") en = d.en;
        if(typeof d.ex === "string") ex = d.ex;
        if(Array.isArray(d.alts) && d.alts.length >= 2){
          alts = d.alts.map(function(a){ a = a || {}; return { ic: str(a.ic), from: str(a.from), to: str(a.to) }; });
        }
        if(Array.isArray(d.cps) && d.cps.length >= 1){
          cps = d.cps.map(function(c){
            c = c || {};
            return { a1: str(c.a1), a2: str(c.a2), lat: str(c.lat), lon: str(c.lon), fr: str(c.fr), rq: str(c.rq) };
          });
        }
      }
      if(typeof o.t === "number") savedT = o.t;
    })();

    // ── airports card ──
    var enIn = inp({ maxlength: "5", autocapitalize: "characters", placeholder: "---" });
    var exIn = inp({ maxlength: "5", autocapitalize: "characters", placeholder: "---" });
    var row = el("div", "row2");
    row.appendChild(field("ETOPS entry airport", enIn));
    row.appendChild(field("ETOPS exit airport", exIn));
    CA.body.appendChild(row);
    CA.body.appendChild(el("div", "sub", "ETOPS alternate airports"));
    var altList = el("div", "cplist");
    CA.body.appendChild(altList);
    var addAlt = el("button", "btn big", "Add alternate airport");
    CA.body.appendChild(addAlt);
    CA.body.appendChild(el("div", "hint", "Legal times are the window when the airport is legal as an ETOPS alternate, in Zulu (hhmm)."));

    // ── critical points card ──
    var list = el("div", "cplist");
    CP.body.appendChild(list);
    var addBtn = el("button", "btn big", "Add critical point");
    CP.body.appendChild(addBtn);
    var edited = el("div", "edited");
    CP.body.appendChild(edited);
    var clr = el("button", "dbtn", "Clear ETOPS fuel analysis");
    CP.body.appendChild(clr);
    resetters.push(function(){ clr.click(); });
    CP.body.appendChild(el("div", "hint", "Fuel is in thousands of pounds: type 20.0 for 20,000 lb. Copy from the ETOPS Analysis page of the OFP. The OFP governs."));

    addStale(CA.warn, function(){ return savedT; }, "ETOPS entries");
    addStale(CP.warn, function(){ return savedT; }, "critical fuel entries");

    function num(s){
      s = String(s).trim().replace(",", ".");
      return /^(\d+(\.\d*)?|\.\d+)$/.test(s) ? parseFloat(s) : null;
    }
    function marginTag(c, tagEl){
      var a = num(c.fr), b = num(c.rq);
      tagEl.className = "tag";
      if(a === null || b === null){ tagEl.textContent = "Margin --"; return; }
      var m = Math.round((a - b) * 10) / 10 + 0;
      tagEl.textContent = "Margin " + (m < 0 ? "-" : "+") + Math.abs(m).toFixed(1) + "k lb";
      tagEl.classList.add(m < 0 ? "neg" : "pos");
    }
    function isEmptyCP(c){ return !(c.a1 + c.a2 + c.lat + c.lon + c.fr + c.rq).trim(); }
    function isEmptyAlt(a){ return !(a.ic + a.from + a.to).trim(); }

    function persist(){
      var allEmpty = !en.trim() && !ex.trim() && cps.every(isEmptyCP) && alts.every(isEmptyAlt);
      if(allEmpty){ lsDel(FUEL_KEY); savedT = 0; }
      else{
        savedT = Date.now();
        lsSet(FUEL_KEY, JSON.stringify({ d: { en: en, ex: ex,
          alts: alts.map(function(a){ return { ic: a.ic, from: a.from, to: a.to }; }),
          cps: cps.map(function(c){ return { a1: c.a1, a2: c.a2, lat: c.lat, lon: c.lon, fr: c.fr, rq: c.rq }; }) }, t: savedT }));
      }
      setEdited(edited, savedT);
      refreshStale();
    }

    // Tap-twice remove button shared by both lists.
    function armedRemove(rm, isEmpty, doRemove){
      var armed = false, timer = null;
      function disarm(){ armed = false; clearTimeout(timer); rm.textContent = "Remove"; rm.classList.remove("armed"); }
      rm.addEventListener("click", function(){
        if(!isEmpty() && !armed){
          armed = true; rm.textContent = "Tap again to remove"; rm.classList.add("armed");
          timer = setTimeout(disarm, 3000);
          return;
        }
        clearTimeout(timer); doRemove();
      });
    }

    function renderAlts(){
      altList.textContent = "";
      alts.forEach(function(a, i){
        var blk = el("div", "cpb");
        var hd = el("div", "cph");
        hd.appendChild(el("b", null, "ALTN " + (i + 1)));
        var rm = el("button", "dbtn small", "Remove"); hd.appendChild(rm);
        blk.appendChild(hd);
        var bd = el("div", "altbody");
        var ic = inp({ maxlength: "5", autocapitalize: "characters", placeholder: "---", "aria-label": "Alternate " + (i + 1) + " airport" }); ic.value = a.ic;
        var f1 = inp({ inputmode: "numeric", maxlength: "4", placeholder: "---", "aria-label": "Alternate " + (i + 1) + " legal from, Zulu" }); f1.value = a.from;
        var f2 = inp({ inputmode: "numeric", maxlength: "4", placeholder: "---", "aria-label": "Alternate " + (i + 1) + " legal to, Zulu" }); f2.value = a.to;
        bd.appendChild(field("Airport", ic));
        bd.appendChild(field("Legal from (Z)", f1));
        bd.appendChild(field("Legal to (Z)", f2));
        blk.appendChild(bd);
        altList.appendChild(blk);
        ic.addEventListener("input", function(){ a.ic = ic.value.toUpperCase(); ic.value = a.ic; persist(); });
        [[f1, "from"], [f2, "to"]].forEach(function(x){
          x[0].addEventListener("input", function(){ x[0].value = x[0].value.replace(/\D/g, "").slice(0, 4); a[x[1]] = x[0].value; persist(); });
        });
        armedRemove(rm, function(){ return isEmptyAlt(a); }, function(){
          if(alts.length <= 2){ alts[i] = { ic: "", from: "", to: "" }; }
          else alts.splice(i, 1);
          renderAlts(); persist();
        });
      });
    }

    function copyText(text, btn){
      function done(ok){
        var old = btn.getAttribute("data-l") || btn.textContent;
        btn.setAttribute("data-l", old);
        btn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(function(){ btn.textContent = old; }, 1500);
      }
      function fallback(){
        try{
          var ta = document.createElement("textarea");
          ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
          var ok = document.execCommand("copy"); document.body.removeChild(ta); done(ok);
        }catch(e){ done(false); }
      }
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(function(){ done(true); }, fallback);
        }else fallback();
      }catch(e){ fallback(); }
    }

    // Split a pasted position like "N45 30.0 W040 00.0", "4530N 04000W" or "45.5, -40.0".
    function cleanPos(s){ return s.replace(/[\u00B0'"\u2032\u2033]/g, " ").replace(/\s+/g, " ").trim().toUpperCase(); }
    var LATD = "\\d{2}(?:[\\s\\u00B0]*\\d{2}(?:\\.\\d+)?|\\.\\d+)?", LOND = "\\d{2,3}(?:[\\s\\u00B0]*\\d{2}(?:\\.\\d+)?|\\.\\d+)?";
    var RE1 = new RegExp("([NS])\\s*(" + LATD + ")[\\s'\\u2032,;/]*([EW])\\s*(" + LOND + ")", "i");
    var RE2 = new RegExp("(" + LATD + ")[\\s'\\u2032]*([NS])[\\s,;/]*(" + LOND + ")[\\s'\\u2032]*([EW])", "i");
    function parsePos(t){
      t = String(t || "").trim();
      var m = RE1.exec(t);
      if(m) return { lat: cleanPos(m[1] + m[2]), lon: cleanPos(m[3] + m[4]) };
      m = RE2.exec(t);
      if(m) return { lat: cleanPos(m[2] + m[1]), lon: cleanPos(m[4] + m[3]) };
      m = /^(-?\d+(?:\.\d+)?)[\s,;]+(-?\d+(?:\.\d+)?)$/.exec(t);
      if(m) return { lat: m[1], lon: m[2] };
      return null;
    }

    function render(){
      list.textContent = "";
      cps.forEach(function(c, i){
        var blk = el("div", "cpb");
        var hd = el("div", "cph");
        hd.appendChild(el("b", null, "CP-" + (i + 1)));
        var tag = el("span", "tag"); hd.appendChild(tag);
        var rm = el("button", "dbtn small", "Remove"); hd.appendChild(rm);
        blk.appendChild(hd);

        // position (for Jepp)
        var pos = el("div", "posrow");
        var lat = inp({ placeholder: "---", maxlength: "20", autocapitalize: "characters", "aria-label": "CP-" + (i + 1) + " latitude" }); lat.value = c.lat;
        var lon = inp({ placeholder: "---", maxlength: "20", autocapitalize: "characters", "aria-label": "CP-" + (i + 1) + " longitude" }); lon.value = c.lon;
        var cp = el("button", "btn big", "Copy"), ps = el("button", "btn big", "Paste");
        pos.appendChild(field("Latitude", lat)); pos.appendChild(field("Longitude", lon));
        var pb = el("div", "posbtns"); pb.appendChild(cp); pb.appendChild(ps); pos.appendChild(pb);
        blk.appendChild(pos);

        // alternates for this CP
        var ab = el("div", "row2");
        var a1 = inp({ maxlength: "5", autocapitalize: "characters", placeholder: "---", "aria-label": "CP-" + (i + 1) + " alternate 1" }); a1.value = c.a1;
        var a2 = inp({ maxlength: "5", autocapitalize: "characters", placeholder: "---", "aria-label": "CP-" + (i + 1) + " alternate 2" }); a2.value = c.a2;
        ab.appendChild(field("ETOPS alternate 1", a1)); ab.appendChild(field("ETOPS alternate 2", a2));
        blk.appendChild(ab);

        // fuel
        var bd = el("div", "row2 cpbody");
        var fr = inp({ inputmode: "decimal", placeholder: "---", "aria-label": "CP-" + (i + 1) + " fuel remaining" }); fr.value = c.fr;
        var rq = inp({ inputmode: "decimal", placeholder: "---", "aria-label": "CP-" + (i + 1) + " fuel required" }); rq.value = c.rq;
        rq.classList.add("req");
        var lf = field("Fuel remaining (k lb)", fr), lr = field("Fuel required (k lb)", rq);
        lr.classList.add("req");
        bd.appendChild(lf); bd.appendChild(lr);
        blk.appendChild(bd);
        list.appendChild(blk);
        marginTag(c, tag);

        lat.addEventListener("input", function(){ c.lat = lat.value.toUpperCase(); lat.value = c.lat; persist(); });
        lon.addEventListener("input", function(){ c.lon = lon.value.toUpperCase(); lon.value = c.lon; persist(); });
        a1.addEventListener("input", function(){ c.a1 = a1.value.toUpperCase(); a1.value = c.a1; persist(); });
        a2.addEventListener("input", function(){ c.a2 = a2.value.toUpperCase(); a2.value = c.a2; persist(); });
        fr.addEventListener("input", function(){ c.fr = fr.value; marginTag(c, tag); persist(); });
        rq.addEventListener("input", function(){ c.rq = rq.value; marginTag(c, tag); persist(); });
        function applyPos(p){
          c.lat = p.lat; c.lon = p.lon; lat.value = p.lat; lon.value = p.lon; persist();
        }
        [lat, lon].forEach(function(f){
          f.addEventListener("paste", function(e){
            var t = e.clipboardData ? e.clipboardData.getData("text") : "";
            var p = parsePos(t);
            if(p){ e.preventDefault(); applyPos(p); }
          });
        });
        ps.addEventListener("click", function(){
          var old = ps.getAttribute("data-l") || ps.textContent; ps.setAttribute("data-l", old);
          function msg(s){ ps.textContent = s; setTimeout(function(){ ps.textContent = old; }, 1800); }
          try{
            navigator.clipboard.readText().then(function(t){
              var p = parsePos(t);
              if(p){ applyPos(p); msg("Pasted"); } else msg("Not a position");
            }, function(){ msg("Press and hold a box, tap Paste"); });
          }catch(e){ msg("Press and hold a box, tap Paste"); }
        });
        cp.addEventListener("click", function(){
          var t = (c.lat.trim() + " " + c.lon.trim()).trim();
          if(!t){ copyText("", cp); return; }
          copyText(t, cp);
        });
        armedRemove(rm, function(){ return isEmptyCP(c); }, function(){
          var idx = cps.indexOf(c);
          if(cps.length === 1) cps[0] = newCP();
          else cps.splice(idx, 1);
          render(); persist();
        });
      });
    }

    enIn.value = en; exIn.value = ex;
    enIn.addEventListener("input", function(){ en = enIn.value.toUpperCase(); enIn.value = en; persist(); });
    exIn.addEventListener("input", function(){ ex = exIn.value.toUpperCase(); exIn.value = ex; persist(); });

    addAlt.addEventListener("click", function(){
      alts.push({ ic: "", from: "", to: "" });
      renderAlts(); persist();
      var blks = altList.querySelectorAll(".cpb");
      var last = blks[blks.length - 1];
      var first = last.querySelector("input"); if(first) first.focus();
      last.scrollIntoView({ block: "nearest" });
    });
    addBtn.addEventListener("click", function(){
      cps.push(newCP());
      render(); persist();
      var ins = list.querySelectorAll(".cpb");
      var first = ins[ins.length - 1].querySelector("input");
      if(first) first.focus();
      ins[ins.length - 1].scrollIntoView({ block: "nearest" });
    });
    clr.addEventListener("click", function(){
      en = ""; ex = ""; cps = [newCP()];
      alts = [{ ic: "", from: "", to: "" }, { ic: "", from: "", to: "" }];
      enIn.value = ""; exIn.value = "";
      renderAlts(); render(); lsDel(FUEL_KEY); savedT = 0; setEdited(edited, 0); refreshStale();
    });

    // Fill from a parsed OFP (null = this flight has no ETOPS section: reset the page).
    window.ofpApplyEtops = function(d){
      function icao(x){ return String(x || "").split("/")[0].toUpperCase(); }
      function k(v){ return v == null ? "" : (v / 1000).toFixed(1); }
      if(!d || !(d.windows && d.windows.length) && !(d.cps && d.cps.length)){ clr.click(); return; }
      en = icao(d.entryAirport); ex = icao(d.exitAirport);
      enIn.value = en; exIn.value = ex;
      alts = (d.windows || []).map(function(w){ return { ic: icao(w.apt), from: String(w.from || ""), to: String(w.to || "") }; });
      while(alts.length < 2) alts.push({ ic: "", from: "", to: "" });
      cps = (d.cps || []).map(function(c){
        return { a1: icao(c.alts && c.alts[0]), a2: icao(c.alts && c.alts[1]), lat: c.latStr || "", lon: c.lonStr || "", fr: k(c.fuelRem), rq: k(c.fuelReq) };
      });
      if(!cps.length) cps = [newCP()];
      renderAlts(); render(); persist();
    };

    renderAlts(); render(); setEdited(edited, savedT);
    etpFuel.appendChild(CA.wrap);
    etpFuel.appendChild(CP.wrap);
  })();

})();
