/* Flight Plan app, part: inflight. Loaded by index.html in order; shares helpers through window.FP. */
(function(){
"use strict";
var FP = window.FP;
var mkCard = FP.mkCard, inp = FP.inp, el = FP.el, field = FP.field, tile = FP.tile, pad2 = FP.pad2, resetters = FP.resetters, viewIn = FP.viewIn, lsJSON = FP.lsJSON, EO_KEY = FP.EO_KEY, addStale = FP.addStale, lsDel = FP.lsDel, lsSet = FP.lsSet, setEdited = FP.setEdited, refreshStale = FP.refreshStale, HF_KEY = FP.HF_KEY;
  // ═══════════ 3) TIME REMAINING ═══════════
  (function(){
    var C = mkCard("Time Remaining");
    var land = inp({ inputmode: "numeric", maxlength: "4", placeholder: "---" });
    var cur  = inp({ inputmode: "numeric", maxlength: "4", placeholder: "---" });
    var row = el("div", "row2");
    row.appendChild(field("Planned landing (UTC)", land));
    row.appendChild(field("Current time (UTC)", cur));
    C.body.appendChild(row);
    var liveBtn = el("button", "btn big", "Use current UTC");
    C.body.appendChild(liveBtn);
    var out = tile("neu", "Time remaining");
    C.body.appendChild(out);
    var msg = el("div", "msg"); msg.hidden = true; C.body.appendChild(msg);
    var note = el("div", "hint"); note.hidden = true; C.body.appendChild(note);

    function parse(s){
      if(!/^\d{4}$/.test(s)) return null;
      var h = +s.slice(0, 2), m = +s.slice(2);
      return (h <= 23 && m <= 59) ? h * 60 + m : null;
    }
    function compute(){
      var a = land.value, b = cur.value, bad = [];
      var L = parse(a), N = parse(b);
      if(a && L === null) bad.push("Landing time");
      if(b && N === null) bad.push("Current time");
      msg.hidden = !bad.length;
      if(bad.length) msg.textContent = bad.join(" and ") + ": enter 4 digits HHMM (hour 00-23, minute 00-59).";
      note.hidden = true;
      if(L === null || N === null){ out.v.textContent = "--"; return; }
      var diff = L - N;
      if(diff < 0){
        diff += 1440;
        note.textContent = "Landing time is earlier than the current time: assuming landing is after midnight UTC (+24 h).";
        note.hidden = false;
      }
      out.v.textContent = Math.floor(diff / 60) + "+" + pad2(diff % 60);
    }
    function utcNow(){ var d = new Date(); return pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()); }

    var timer = null;
    function tick(){
      var v = utcNow();
      if(v !== cur.value){ cur.value = v; compute(); }
    }
    function startLive(){
      cur.value = utcNow(); compute();
      liveBtn.textContent = "Stop live";
      liveBtn.classList.add("on");
      if(timer) clearInterval(timer);
      timer = setInterval(tick, 10000);
    }
    function stopLive(){
      if(timer){ clearInterval(timer); timer = null; }
      liveBtn.textContent = "Use current UTC";
      liveBtn.classList.remove("on");
    }
    function digits(i){ i.addEventListener("input", function(){ var v = i.value.replace(/\D/g, "").slice(0, 4); if(v !== i.value) i.value = v; }); }
    digits(land); digits(cur);
    land.addEventListener("input", compute);
    cur.addEventListener("input", function(){ if(timer) stopLive(); compute(); });
    cur.addEventListener("beforeinput", function(){ if(timer) stopLive(); });
    cur.addEventListener("keydown", function(e){ if(timer && e.key !== "Tab" && e.key !== "Shift") stopLive(); });
    liveBtn.addEventListener("click", function(){ if(timer) stopLive(); else startLive(); });
    document.addEventListener("visibilitychange", function(){ if(!document.hidden && timer) tick(); });
    compute();
    resetters.push(function(){ stopLive(); land.value = ""; cur.value = ""; compute(); });
    viewIn.appendChild(C.wrap);
  })();

  // ═══════════ 4) FMC EO SPD / ALT (emergency reference, no heading) ═══════════
  (function(){
    var C = mkCard(null);
    var s = "", a = "", t = 0;
    (function load(){
      var o = lsJSON(EO_KEY);
      if(o && typeof o === "object"){
        if(o.s != null) s = String(o.s);
        if(o.a != null) a = String(o.a);
        if(typeof o.t === "number") t = o.t;
      }
    })();
    var sIn = inp({ inputmode: "decimal", placeholder: "---" });
    var aIn = inp({ inputmode: "decimal", placeholder: "---" });
    var row = el("div", "eorow");
    var l1 = el("span", "eolab", "FMC EO SPD"), l2 = el("span", "eolab", "ALT");
    row.appendChild(l1); row.appendChild(sIn); row.appendChild(l2); row.appendChild(aIn);
    C.body.appendChild(row);
    var tiles = el("div", "tiles");
    var ts = tile("dng", "FMC EO SPD"), ta = tile("dng", "ALT");
    tiles.appendChild(ts); tiles.appendChild(ta);
    C.body.appendChild(tiles);
    var edited = el("div", "edited"); C.body.appendChild(edited);
    var clr = el("button", "dbtn", "Clear EO"); C.body.appendChild(clr);
    resetters.push(function(){ clr.click(); });
    addStale(C.warn, function(){ return t; }, "FMC EO values");

    function show(){
      ts.v.textContent = s.trim() || "--";
      ta.v.textContent = a.trim() || "--";
    }
    function persist(){
      if(!s.trim() && !a.trim()){ lsDel(EO_KEY); t = 0; }
      else{ t = Date.now(); lsSet(EO_KEY, JSON.stringify({ s: s, a: a, t: t })); }
      setEdited(edited, t); refreshStale();
    }
    sIn.value = s; aIn.value = a; show(); setEdited(edited, t);
    sIn.addEventListener("input", function(){ s = sIn.value; show(); persist(); });
    aIn.addEventListener("input", function(){ a = aIn.value; show(); persist(); });
    clr.addEventListener("click", function(){
      s = ""; a = ""; sIn.value = ""; aIn.value = ""; show();
      lsDel(EO_KEY); t = 0; setEdited(edited, 0); refreshStale();
    });
    viewIn.appendChild(C.wrap);
  })();

  // ═══════════ 5) HF FREQUENCIES ═══════════
  (function(){
    var C = mkCard("HF Frequencies");
    C.card.classList.add("hfcard");
    var rows = [], t = 0;
    for(var i = 0; i < 4; i++) rows.push({ p: "", s: "", w: "" });
    (function load(){
      var o = lsJSON(HF_KEY);
      if(!o || typeof o !== "object") return;
      if(Array.isArray(o.rows)){
        for(var k = 0; k < 4; k++){
          var r = o.rows[k];
          if(r && typeof r === "object"){
            rows[k] = { p: r.p == null ? "" : String(r.p), s: r.s == null ? "" : String(r.s), w: r.w == null ? "" : String(r.w) };
          }
        }
      }
      if(typeof o.t === "number") t = o.t;
    })();

    var edited = el("div", "edited");
    var inputs = [];
    rows.forEach(function(r, k){
      var line = el("div", "hfrow");
      line.appendChild(el("span", "hfn", String(k + 1)));
      var p = inp({ inputmode: "numeric", placeholder: "---", "aria-label": "HF " + (k + 1) + " primary kHz" });
      var s = inp({ inputmode: "numeric", placeholder: "---", "aria-label": "HF " + (k + 1) + " secondary kHz" });
      var sw = el("div", "hfsw");
      sw.appendChild(el("span", "hfat", "@"));
      var w = inp({ placeholder: "Switch-over (fix, longitude or time)", "aria-label": "HF " + (k + 1) + " switch-over point" });
      sw.appendChild(w);
      p.value = r.p; s.value = r.s; w.value = r.w;
      line.appendChild(p); line.appendChild(s); line.appendChild(sw);
      C.body.appendChild(line);
      inputs.push([p, s, w]);
      p.addEventListener("input", function(){ r.p = p.value; persist(); });
      s.addEventListener("input", function(){ r.s = s.value; persist(); });
      w.addEventListener("input", function(){ r.w = w.value; persist(); });
    });
    C.body.appendChild(edited);
    var clr = el("button", "dbtn", "Clear all HF"); C.body.appendChild(clr);
    resetters.push(function(){ clr.click(); });
    C.body.appendChild(el("div", "hint", "Saved on this device. Clear between flights."));
    addStale(C.warn, function(){ return t; }, "HF frequencies");

    function persist(){
      var empty = rows.every(function(r){ return !r.p.trim() && !r.s.trim() && !r.w.trim(); });
      if(empty){ lsDel(HF_KEY); t = 0; }
      else{ t = Date.now(); lsSet(HF_KEY, JSON.stringify({ rows: rows, t: t })); }
      setEdited(edited, t); refreshStale();
    }
    clr.addEventListener("click", function(){
      rows.forEach(function(r, k){
        r.p = r.s = r.w = "";
        inputs[k][0].value = ""; inputs[k][1].value = ""; inputs[k][2].value = "";
      });
      lsDel(HF_KEY); t = 0; setEdited(edited, 0); refreshStale();
    });
    setEdited(edited, t);
    viewIn.appendChild(C.wrap);
  })();

})();
