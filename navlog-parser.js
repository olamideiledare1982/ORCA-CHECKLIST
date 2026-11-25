/*!
 * navlog-parser.js
 * Parses a CAE Flight Plan Manager "OPERATIONAL FLIGHTPLAN" (United Airlines OFP) from the
 * text layer of a briefing-package PDF into structured JSON.
 *
 * Works in the browser (global NavLogParser) and Node (module.exports).
 * Input is positioned text items from pdf.js (page.getTextContent().items) – see
 * NavLogParser.parsePages(pagesOfItems).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NavLogParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. pdf.js text items -> lines of positioned tokens                  */
  /* ------------------------------------------------------------------ */
  function itemsToLines(items, pageNo) {
    var its = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.str || !it.str.trim()) continue;
      its.push({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width });
    }
    its.sort(function (a, b) { return (b.y - a.y) || (a.x - b.x); });
    var rows = [];
    its.forEach(function (it) {
      var L = rows[rows.length - 1];
      if (L && Math.abs(L.y - it.y) < 2.5) L.items.push(it);
      else rows.push({ y: it.y, items: [it] });
    });
    return rows.map(function (L) {
      L.items.sort(function (a, b) { return a.x - b.x; });
      // pdf.js sometimes splits one printed number into pieces that touch each other
      // (e.g. "30" + "0" for 300). Glue pieces with no visible gap back together.
      var merged = [];
      L.items.forEach(function (it) {
        var p = merged[merged.length - 1];
        if (p && Math.abs(it.x - (p.x + p.w)) < 0.6 && !/\s$/.test(p.s) && !/^\s/.test(it.s)) {
          merged[merged.length - 1] = { s: p.s + it.s, x: p.x, y: p.y, w: p.w + it.w };
        } else merged.push(it);
      });
      L.items = merged;
      var toks = [];
      L.items.forEach(function (it) {
        var cw = it.w / it.s.length;
        var re = /\S+/g, m;
        while ((m = re.exec(it.s))) toks.push({ s: m[0], x: it.x + m.index * cw });
      });
      return { y: L.y, page: pageNo, toks: toks, text: toks.map(function (t) { return t.s; }).join(' ') };
    });
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  var RE_COORD_LAT = /^[NS]\d{4}(\.\d)?$/;
  var RE_COORD_LON = /^[EW]\d{5}(\.\d)?$/;
  var RE_TCTH = /^(\d{3}|---)\/(\d{3}|---)$/;

  function num(s) { var n = parseFloat(s); return isNaN(n) ? null : n; }
  function hm(s) { // "4:35" or "00:08" -> minutes
    var m = /^(-?)(\d+):(\d\d)$/.exec(s || '');
    if (!m) return null;
    var v = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
    return m[1] ? -v : v;
  }
  function lat(s) { // N4041.5
    var m = /^([NS])(\d{2})(\d{2}(?:\.\d)?)$/.exec(s);
    if (!m) return null;
    var v = parseInt(m[2], 10) + parseFloat(m[3]) / 60;
    return m[1] === 'S' ? -v : v;
  }
  function lon(s) { // W07410.1
    var m = /^([EW])(\d{3})(\d{2}(?:\.\d)?)$/.exec(s);
    if (!m) return null;
    var v = parseInt(m[2], 10) + parseFloat(m[3]) / 60;
    return m[1] === 'W' ? -v : v;
  }
  function fmtLat(v) {
    var h = v < 0 ? 'S' : 'N'; v = Math.abs(v);
    var d = Math.floor(v), m = (v - d) * 60;
    return h + ('0' + d).slice(-2) + '\u00b0' + m.toFixed(1).padStart(4, '0') + "'";
  }
  function fmtLon(v) {
    var h = v < 0 ? 'W' : 'E'; v = Math.abs(v);
    var d = Math.floor(v), m = (v - d) * 60;
    return h + ('00' + d).slice(-3) + '\u00b0' + m.toFixed(1).padStart(4, '0') + "'";
  }

  /* ------------------------------------------------------------------ */
  /* 2. Main parse                                                       */
  /* ------------------------------------------------------------------ */
  function parsePages(pagesOfItems) {
    var all = [];
    pagesOfItems.forEach(function (items, i) {
      itemsToLines(items, i + 1).forEach(function (l) { all.push(l); });
    });
    return parseLines(all);
  }

  function parseLines(all) {
    var out = { ok: false, warnings: [] };

    /* ---- cover page ---- */
    for (var i = 0; i < Math.min(all.length, 60); i++) {
      var m;
      if ((m = /^BRIEFING PACKAGE FOR FLIGHT\s*:\s*(.+)$/.exec(all[i].text))) out.packageTitle = m[1];
      if ((m = /^CREATED BY:\s*(.+)$/.exec(all[i].text))) out.createdBy = m[1];
    }
    for (i = 0; i < Math.min(all.length, 80); i++) {
      var mm = /^CREATED TIME\s*:\s*(.+?)\.?$/.exec(all[i].text);
      if (mm) { out.createdTime = mm[1]; break; }
    }

    /* ---- locate OFP stream ---- */
    var start = -1, end = all.length;
    for (i = 0; i < all.length; i++) {
      if (/OPERATIONAL FLIGHTPLAN PG 1\/\d+/.test(all[i].text)) { start = i; break; }
    }
    if (start < 0) { out.error = 'No "OPERATIONAL FLIGHTPLAN" pages found in this PDF.'; return out; }
    for (i = start; i < all.length; i++) {
      if (/^\*END - OFP/.test(all[i].text)) { end = i; break; }
    }

    /* additional dispatcher release remarks (before OFP) */
    var rrStart = -1, rrEnd = -1;
    for (i = 0; i < start; i++) {
      if (/ADDITIONAL DISPATCHER RELEASE REMARKS/.test(all[i].text) && rrStart < 0 && !/END -/.test(all[i].text)) rrStart = i + 1;
      if (/END - ADDITIONAL DISPATCHER RELEASE REMARKS/.test(all[i].text)) { rrEnd = i; break; }
    }
    if (rrStart >= 0 && rrEnd > rrStart) {
      out.releaseRemarks = all.slice(rrStart, rrEnd)
        .map(function (l) { return l.text; })
        .filter(function (t) { return t && !/^\*+$/.test(t) && !/^CONTINUED ON NEXT PAGE/.test(t) && t !== 'B'; });
    }

    /* per-page column anchors from the nav-log table header */
    var pageCols = {};
    for (i = start; i < end; i++) {
      var L = all[i];
      if (L.toks[0] && L.toks[0].s === 'ARWY' && L.toks[1] && L.toks[1].s === 'POSITION') {
        pageCols[L.page] = { arwy: L.toks[0].x, pos: L.toks[1].x };
      }
    }

    /* strip repeated page headers */
    var S = [];
    for (i = start; i < end; i++) {
      var t = all[i].text;
      if (!t) continue;
      if (/^\S+\s+OPERATIONAL FLIGHTPLAN PG \d+\/\d+ PRTD/.test(t)) continue;
      if (/^\S+-\d+\s+\d{2}[A-Z]{3}\d{2}\s+\S+\/\d+\s+\S+\s+VRN?T\s/.test(t) && !/OUT\s/.test(t)) continue; // page sub-header
      if (/^ARWY POSITION MC DIST TIME MOR FL MACH GS\/TAS ZBO$/.test(t)) continue;
      if (/^COORDINATES MH EST ET ATA TROP SAT WIND FUEL$/.test(t)) continue;
      if (/^NAME TC\/TH$/.test(t)) continue;
      if (t === '$B' || t === 'B' || /^\*+$/.test(t)) continue;
      S.push(all[i]);
    }

    /* ---- header ---- */
    var h = {};
    var idx = 0;
    function textAt(k) { return S[k] ? S[k].text : ''; }
    var r;
    // line 1
    r = /^(\S+)-(\d+)\s+(\d{2}[A-Z]{3}\d{2})\s+([A-Z0-9]{4})\/([A-Z0-9]{3})\s+OUT\s+(\d{4})Z\/(\d{4})L\s+OFF\s+(\d{4})Z\/(\d{4})L/.exec(textAt(0));
    if (!r) { out.error = 'Unrecognised OFP header (line 1).'; return out; }
    h.callsign = r[1]; h.flightKey = r[1] + '-' + r[2]; h.dateLocal = r[3];
    h.dep = { icao: r[4], iata: r[5] };
    h.outZ = r[6]; h.outL = r[7]; h.offZ = r[8]; h.offL = r[9];
    r = /^(\S+)\/(\w+)\s+(\w+)\s+([A-Z0-9]{4})\/([A-Z0-9]{3})\s+ON\s+(\d{4})Z\/(\d{4})L\s+IN\s+(\d{4})Z\/(\d{4})L/.exec(textAt(1));
    if (!r) { out.error = 'Unrecognised OFP header (line 2).'; return out; }
    h.tail = r[1]; h.nose = r[2]; h.type = r[3];
    h.arr = { icao: r[4], iata: r[5] };
    h.onZ = r[6]; h.onL = r[7]; h.inZ = r[8]; h.inL = r[9];
    r = /^WIND\s+(\d{6})\s+(\d{6})\s+(\d\d:\d\d)\/(\d\d:\d\d)([EL])\s+VRN?T\s+(\S+)\s+RTN?G\s+(\S+)\s+RLSE\s+(\S+)/.exec(textAt(2));
    if (r) {
      h.windFrom = r[1]; h.windTo = r[2]; h.ete = r[3]; h.onTimeDelta = r[4]; h.onTimeFlag = r[5];
      h.variant = r[6]; h.routing = r[7]; h.release = r[8];
    }
    r = /^RLSD\s+(\S+)\s+TO\s+([A-Z0-9]{4})\/([A-Z0-9]{3})\s+(\S+)\s+(.+?)\s+(\d{3}-\d{3}-\d{4})\s*$/.exec(textAt(3));
    if (r) {
      h.releasedRules = r[1]; h.releasedTo = r[2] + '/' + r[3];
      h.dispatchSector = r[4]; h.dispatcher = r[5]; h.dispatcherPhone = r[6];
    }
    idx = 4;
    function collectUntil(re) {
      var arr = [];
      while (idx < S.length && !re.test(S[idx].text)) { arr.push(S[idx].text); idx++; }
      return arr;
    }
    h.basis = collectUntil(/^MEL ITEM INFO/).filter(function (x) { return x !== '---'; });
    idx++; h.mel = collectUntil(/^DISPATCHER REMARKS/).filter(function (x) { return !/^-+$/.test(x); });
    idx++; h.remarks = collectUntil(/^SYSTEM INFO/);
    idx++; h.systemInfo = collectUntil(/^ROUTING$/);
    idx++;

    // system info extras
    h.sys = {};
    h.systemInfo.forEach(function (ln) {
      var q;
      if ((q = /^VIA\s+(.+)$/.exec(ln))) h.sys.via = q[1];
      else if ((q = /^(\d+)\s+MINUTE ETOPS/.exec(ln))) h.sys.etopsMinutes = parseInt(q[1], 10);
      else if ((q = /^COLD(?:E)?ST ENRT (TAT|FUEL TEMP)\s+(M?P?\d+)C\s+\((.*?)\)\s+\((\S+ \S+)\)\s+(\d+:\d\d)\/(\d+)NM/.exec(ln)))
        h.sys.coldest = { kind: q[1], temp: q[2], at: q[3], pos: q[4], et: q[5], nm: q[6] };
      else if ((q = /^IA:(.+)$/.exec(ln))) h.sys.etopsChain = ln;
      else if ((q = /^ACF90=(\S+)\/ACF99=(\S+)\s+SAMPLE=(\S+)\s+AVGBDE=(\S+)\s+STDEV=(\S+)/.exec(ln)))
        h.sys.acf = { acf90: q[1], acf99: q[2], sample: q[3], avgbde: q[4], stdev: q[5] };
      else if (/^M[12] (CLEARS|DOES NOT CLEAR) TERRAIN/.test(ln)) h.sys.terrain = ln;
      else if (/^PTOG\s/.test(ln)) h.sys.ptog = ln;
      else if (/NOT ENROUTE TERRAIN LIMITED/.test(ln)) h.sys.terrainLimited = false;
    });
    out.header = h;
    out.raw = S.map(function (l) { return l.text; });

    /* ---- routing ---- */
    var rt = {};
    r = /^DIST\s+(\d+)\s+WC\s+([HT])(\d+)\s+(\S+)\s+(\S+)\s+FECO\s+(\S+)\s+(\S+)/.exec(textAt(idx));
    if (r) {
      rt.dist = parseInt(r[1], 10);
      rt.windComp = (r[2] === 'H' ? -1 : 1) * parseInt(r[3], 10); // + tailwind, - headwind
      rt.windCompLabel = r[2] + r[3];
      rt.perfLabel = r[4]; rt.perf = r[5];
      rt.feco = r[6] + ' ' + r[7];
      idx++;
    }
    r = /^CI\s+(\S+)\s+(\w+)\s*(.*)$/.exec(textAt(idx));
    if (r) {
      rt.ci = r[1]; rt.ciMode = r[2];
      var vp = r[3]; idx++;
      while (idx < S.length && !/^FMS INIT LOAD/.test(S[idx].text)) { vp += ' ' + S[idx].text; idx++; }
      var vt = vp.replace(/\//g, ' ').split(/\s+/).filter(Boolean);
      rt.vertical = [];
      if (vt.length) {
        rt.initialLevel = vt[0];
        for (var v = 1; v + 1 < vt.length; v += 2) rt.vertical.push({ fix: vt[v], level: vt[v + 1] });
      }
    }
    out.routing = rt;
    // (the 'FMS INIT LOAD' row also carries the 'TOW PARAMETERS' heading, so keep it)

    /* ---- FMS init load (two columns) ---- */
    var fmsLines = [];
    while (idx < S.length && !/^NO REDISPATCH POINT|^POINT OF RDSP|^INTENDED DEST|^INTERMEDIATE DEST|^REDISPATCH|^(DEP INFO|CLEARANCE|\*OFP\*|\(FPL)/.test(S[idx].text)) { fmsLines.push(S[idx]); idx++; }
    var colX = null;
    fmsLines.forEach(function (l) {
      if (/PARAMETERS/.test(l.text)) {
        for (var k = 0; k < l.toks.length; k++) if (l.toks[k].s === 'TOW' || l.toks[k].s === 'LW') { colX = l.toks[k].x; break; }
      }
    });
    if (colX == null) colX = 200;
    var left = [], right = [];
    fmsLines.forEach(function (l) {
      var lt = l.toks.filter(function (t) { return t.x < colX - 3; }).map(function (t) { return t.s; }).join(' ');
      var rtx = l.toks.filter(function (t) { return t.x >= colX - 3; }).map(function (t) { return t.s; }).join(' ');
      if (lt && !/^FMS INIT LOAD$/.test(lt)) left.push(lt);
      if (rtx) right.push(rtx);
    });
    var fms = { weights: {} };
    left.forEach(function (ln) {
      var q;
      if ((q = /^([A-Z0-9]{4})\/([A-Z0-9]{4})$/.exec(ln))) { fms.dep = q[1]; fms.dest = q[2]; }
      else if ((q = /^ARPT REF POINT\s+(\S+)\s+(\S+)/.exec(ln))) fms.refPoint = q[1] + ' ' + q[2];
      else if ((q = /^F(\d{3})\/([MP]\d+)\s+\((\w+)\)\s+TROP\s+F(\d{3})/.exec(ln))) {
        fms.cruiseFL = parseInt(q[1], 10); fms.sat = q[2]; fms.isaDev = q[3]; fms.trop = parseInt(q[4], 10);
      }
      else if ((q = /^TOC\s+(.+)$/.exec(ln))) fms.toc = q[1];
      else if ((q = /^(ZFW|TOW|LW)\s+(\d+)\s*\/\s*(\d+)([A-Z])?/.exec(ln)))
        fms.weights[q[1]] = { planned: parseInt(q[2], 10), max: parseInt(q[3], 10), limit: q[4] || '' };
    });
    function perfBlock(startRe, stopRe) {
      var on = false, buf = [];
      right.forEach(function (ln) {
        if (startRe.test(ln)) { on = true; return; }
        if (stopRe && stopRe.test(ln)) on = false;
        if (on) buf.push(ln);
      });
      var s = buf.join(' ');
      var o = { raw: buf.join(' | ') };
      var q;
      if ((q = /\bR(\d{2}[LRC]?)\b/.exec(s))) o.rwy = q[1];
      if ((q = /\bT(M?\d+)\b/.exec(s))) o.temp = q[1].replace('M', '-');
      if ((q = /\bA(\d{4})\b/.exec(s))) o.altim = q[1];
      if ((q = /\bW(\d{3})\/(\d{2,3})\b/.exec(s))) { o.wdir = q[1]; o.wspd = q[2]; }
      if ((q = /\b(HW|TW)(\d+)\b/.exec(s))) o.comp = q[1] + q[2];
      if ((q = /\bXW(\d+)\b/.exec(s))) o.xw = q[1];
      if ((q = /\bF(\d+)\b/.exec(s))) o.flaps = q[1];
      if ((q = /\b(DRY|WET|[A-Z]*CONT[A-Z]*)\b/.exec(s))) o.surface = q[1];
      if ((q = /\bAI\/(.+?)(?:\s+AC\/|\s+ICE\b|\s+L\d{4,5}\b|$)/.exec(s))) o.antiIce = q[1].trim();
      if ((q = /\bAC\/(.+?)(?:\s+ENRT\b|\s+ICE\b|\s+L\d{4,5}\b|$)/.exec(s))) o.bleed = q[1].trim();
      if (/ENRT\s*\|?\s*ICE ACCR/.test(s)) o.enrtIce = true;
      if ((q = /\bL(\d{4,5})\b/.exec(s))) o.rwyLen = q[1];
      return o;
    }
    fms.tow = perfBlock(/^TOW PARAMETERS/, /^LW PARAMETERS/);
    fms.lw = perfBlock(/^LW PARAMETERS/, null);
    // re-read the first line after "TOW PARAMETERS ..." only when it carries data on the same row
    out.fms = fms;

    /* ---- redispatch / intended destination fuel ladder ---- */
    var rd = [];
    while (idx < S.length && !/^INTENDED DEST/.test(S[idx].text) && !/^(DEP INFO|CLEARANCE|\*OFP\*|\(FPL)/.test(S[idx].text)) { rd.push(S[idx].text); idx++; }
    fms.redispatch = rd.join(' ');
    // Redispatch plans print two ladders side by side (INTENDED DEST | INTERMEDIATE DEST) before the right-hand block.
    var interX = null;
    if (idx < S.length && /^INTENDED DEST/.test(S[idx].text)) {
      S[idx].toks.forEach(function (t) { if (/^INTERMEDIATE$/.test(t.s) && interX == null) interX = t.x; });
      idx++;
    }
    var ladder = [], capt = { name: '', dom: '', min: '' }, lcl = [];
    var rightRows = [], midRows = [], ladderDone = false;
    var splitX = interX != null ? interX - 3 : 250;
    var rightX = interX != null ? 360 : splitX;
    while (idx < S.length) {
      var Ln = S[idx];
      if (/^(DEP INFO|CLEARANCE|\*OFP\*)/.test(Ln.text)) break;
      var lt2 = Ln.toks.filter(function (t) { return t.x < splitX; });
      var rx = ladderDone ? splitX : rightX; // below the ladder (CI / LCL APT rows) the right block starts at the split
      var rt2 = Ln.toks.filter(function (t) { return t.x >= rx; }).map(function (t) { return t.s; });
      var mt2 = (interX != null && !ladderDone) ? Ln.toks.filter(function (t) { return t.x >= splitX && t.x < rightX; }).map(function (t) { return t.s; }) : [];
      if (mt2.length) midRows.push(mt2);
      if (lt2.length && lt2[0].s === 'REMF') ladderDone = true;
      var ltxt = lt2.map(function (t) { return t.s; });
      if (ltxt.length) {
        // find time token
        var ti = -1;
        for (var k = 0; k < ltxt.length; k++) if (/^-?\d\d:\d\d$/.test(ltxt[k])) { ti = k; break; }
        var row = null;
        if (ti >= 0) {
          row = { label: ltxt.slice(0, ti).join(' '), time: ltxt[ti], min: hm(ltxt[ti]), fuel: num(ltxt[ltxt.length - 1]) };
        } else if (ltxt.length >= 2 && /^-?\d+$/.test(ltxt[ltxt.length - 1])) {
          row = { label: ltxt.slice(0, -1).join(' '), time: '', min: null, fuel: num(ltxt[ltxt.length - 1]) };
        }
        if (row) ladder.push(row);
      }
      if (rt2.length) rightRows.push(rt2.join(' '));
      idx++;
    }
    // right-hand block: LCL APT table & captain block
    var cIdx = -1;
    rightRows.forEach(function (rr, k) {
      var q;
      if ((q = /^([A-Z0-9]{4})\s+(\d+)\s+(\d\d:\d\d)\s+(\d+)$/.exec(rr))) lcl.push({ apt: q[1], dist: +q[2], time: q[3], fuel: +q[4] });
      else if (/^CAPT$/.test(rr) && cIdx < 0) cIdx = k;
      else if ((q = /^DOM\s*(.*)$/.exec(rr))) capt.dom = q[1];
      else if ((q = /^MIN\s*(.*)$/.exec(rr))) capt.min = q[1];
    });
    if (cIdx >= 0) {
      var nx = rightRows[cIdx + 1];
      if (nx && !/^(DOM|MIN|SIGNED)/.test(nx) && !/^[A-Z0-9]{4}\s+\d+\s+\d\d:\d\d/.test(nx)) capt.name = nx;
    }
    out.ladder = ladder;
    if (interX != null) {
      var ladderMid = [];
      midRows.forEach(function (mt) {
        var ti2 = -1;
        for (var k2 = 0; k2 < mt.length; k2++) if (/^-?\d\d:\d\d$/.test(mt[k2])) { ti2 = k2; break; }
        if (ti2 >= 0) ladderMid.push({ label: mt.slice(0, ti2).join(' '), time: mt[ti2], min: hm(mt[ti2]), fuel: num(mt[mt.length - 1]) });
      });
      out.ladderIntermediate = ladderMid;
      var rq = /POINT OF RDSP\s+(\S+)\s+MINF AT RDSP\s+(\d+)\s+PLNF AT RDSP\s+(\d+)/.exec(fms.redispatch || '');
      out.redispatch = { point: rq ? rq[1] : '', minf: rq ? +rq[2] : null, plnf: rq ? +rq[3] : null, intermediate: ladderMid.length ? ladderMid[0].label : '' };
    }
    out.lclApt = lcl;
    out.captain = capt;
    out.fuel = {};
    ladder.forEach(function (rw) {
      var key = rw.label;
      if (/^MIN T\/O/.test(key)) out.fuel.minTO = rw;
      else if (/^PLAN T\/O/.test(key)) out.fuel.planTO = rw;
      else if (/^PLAN GATE/.test(key)) out.fuel.planGate = rw;
      else if (/^REMF/.test(key)) out.fuel.remf = rw;
      else if (/^TAXI/.test(key)) out.fuel.taxi = rw;
      else if (/^(EXTRA|FERRY)/.test(key)) out.fuel.extra = rw;
    });

    /* ---- ATC filing ---- */
    var fpl = null;
    while (idx < S.length && !/^\(FPL/.test(S[idx].text) && !/^TKOF ALTN/.test(S[idx].text) && !/^ARWY POSITION/.test(S[idx].text)) {
      if (/^DEP INFO/.test(S[idx].text)) { /* skip */ }
      idx++;
    }
    if (idx < S.length && /^\(FPL/.test(S[idx].text)) {
      var raw = [];
      while (idx < S.length) {
        raw.push(S[idx].text);
        var done = /\)\s*$/.test(S[idx].text);
        idx++;
        if (done) break;
      }
      fpl = parseFpl(raw);
    }
    out.atc = fpl;

    /* ---- TKOF ALTN ---- */
    var toalt = null;
    if (idx < S.length && /^TKOF ALTN/.test(S[idx].text)) {
      idx++;
      if (idx < S.length && (r = /^([A-Z0-9]{4})\s+(\d+)\s+(\d\d:\d\d)\s+(\d+)/.exec(S[idx].text))) {
        toalt = { apt: r[1], dist: +r[2], time: r[3], fuel: +r[4] };
        idx++;
      }
    }
    out.takeoffAlternate = toalt;

    /* ---- nav logs ---- */
    var logs = [];
    var cur = { kind: 'main', from: h.dep.icao, to: h.arr.icao, label: h.dep.icao + ' \u2192 ' + h.arr.icao, events: [] };
    logs.push(cur);
    var wp = null, state = null, lastEvent = null;
    var navEnd = false;
    function flushWp() { if (wp) { cur.events.push(wp); wp = null; state = null; } }
    function pushEvent(ev) { flushWp(); cur.events.push(ev); lastEvent = ev; return ev; }
    var tail = [];

    for (; idx < S.length; idx++) {
      var line = S[idx], T = line.text, q;
      if (navEnd) { tail.push(line); continue; }

      if ((q = /^RTNG TO (\S+)/.exec(T))) {
        flushWp();
        var to = q[1].split('/')[0];
        cur = { kind: 'alternate', from: logs[0].to, to: to, label: 'Routing to ' + q[1], events: [] };
        logs.push(cur); lastEvent = null; continue;
      }
      if (/^LDG INFO/.test(T)) { flushWp(); navEnd = true; continue; }

      // waypoint row 1
      var cols = pageCols[line.page] || { arwy: 32.4, pos: 75.6 };
      var tk = line.toks.map(function (x) { return x.s; });
      if (tk.length >= 9 && isRow1(tk)) {
        flushWp();
        var f = tk.slice(-8);
        var nameToks = tk.slice(0, -8), airway = '';
        if (nameToks.length && line.toks[0].x < cols.pos - 8) { airway = nameToks[0]; nameToks = nameToks.slice(1); }
        wp = {
          type: 'wp', airway: airway, ident: nameToks[0] || '', extra: nameToks.slice(1).join(' '),
          mc: f[0], zoneDist: num(f[1]), zoneMin: num(f[2]), mor: f[3], fl: f[4], mach: f[5], gs: null, tas: null, zbo: num(f[7])
        };
        var gt = f[6].split('/');
        if (gt.length === 2) { wp.gs = num(gt[0]); wp.tas = num(gt[1]); }
        wp.mach = f[5] === '---' ? null : parseInt(f[5].slice(1), 10) / 1000;
        wp.pseudo = /^\((T\/C|T\/D)\)$/.test(wp.ident) ? wp.ident.slice(1, -1) : '';
        state = 'r2'; lastEvent = null;
        continue;
      }
      if (wp && state === 'r2' && tk.length >= 4 && RE_COORD_LAT.test(tk[0]) && RE_COORD_LON.test(tk[1])) {
        wp.latStr = tk[0]; wp.lonStr = tk[1]; wp.lat = lat(tk[0]); wp.lon = lon(tk[1]);
        var rest = tk.slice(2);
        wp.mh = rest[0];
        wp.remDist = num(rest[1]);
        wp.et = rest[2]; wp.etMin = hm(rest[2]);
        wp.fuel = num(rest[rest.length - 1]);
        var mid = rest.slice(3, -1);
        wp.trop = ''; wp.sat = ''; wp.wind = '';
        mid.forEach(function (x) {
          if (/^F\d{3}$/.test(x)) wp.trop = x;
          else if (/^(---|[MP]\d+)$/.test(x) && !wp.sat) wp.sat = x;
          else if (/^(\d{3}\/\d{2,3}|---\/---)$/.test(x)) wp.wind = x;
        });
        state = 'r3';
        continue;
      }
      if (wp && state === 'r3' && tk.length && RE_TCTH.test(tk[tk.length - 1])) {
        var th = tk[tk.length - 1].split('/');
        wp.tc = th[0]; wp.th = th[1];
        wp.desc = tk.slice(0, -1).join(' ');
        state = 'done';
        continue;
      }

      // special lines
      if ((q = /^ENTERING FIR:\s*(\S+)\s+(.*?)\s*\((.*)\)\s*$/.exec(T))) {
        pushEvent({ type: 'fir', icao: q[1], name: q[2], region: q[3] }); continue;
      }
      if ((q = /^ETOPS (ENTRY|EXIT)\s+(\S+)\s+(\d+:\d\d)\s+(\d+)NM\s+(\S+)\s+(\S+)\s+(\d+)\s*$/.exec(T))) {
        pushEvent({ type: 'etops', kind: q[1].toLowerCase(), apt: q[2], et: q[3], etMin: hm(q[3]), distRem: +q[4],
          latStr: q[5], lonStr: q[6], lat: lat(q[5]), lon: lon(q[6]), fuel: +q[7] });
        continue;
      }
      if ((q = /^CP-(\d+)\s+(\S+)\s+(\d+:\d\d)\s+(\S+)\s+(\S+)\s+(\d+)\/(\d+)\s*$/.exec(T))) {
        pushEvent({
          type: 'cp', n: +q[1], et: q[3], etMin: hm(q[3]), latStr: q[4], lonStr: q[5], lat: lat(q[4]), lon: lon(q[5]),
          fuelRem: +q[6], fuelReq: +q[7],
          alts: q[2].split('/').map(function (a) { var p = a.split('-'); return { apt: p[0], dist: +p[1] }; })
        });
        continue;
      }
      if (/^ENTERING CLASS II/.test(T)) { pushEvent({ type: 'class2', kind: 'enter', title: T, items: [] }); continue; }
      if (/^EXITING CLASS II/.test(T)) { pushEvent({ type: 'class2', kind: 'exit', title: T, items: [] }); continue; }
      if (/^ETOPS WX/.test(T)) { pushEvent({ type: 'check', text: T, etops: true }); continue; }
      if (/^(FMS POSN VERIFIED|RVSM ALTIMETER CHECK|RDSP MSSG)/.test(T)) { pushEvent({ type: 'check', text: T }); continue; }

      // class II checklist items
      if (lastEvent && lastEvent.type === 'class2' && !wp) { lastEvent.items.push(T); continue; }

      // anything else becomes a note, anchored in sequence
      if (wp && state === 'done') { /* stray text after a finished wp */ }
      pushEvent({ type: 'note', text: T });
    }
    flushWp();
    out.navlogs = logs;

    /* ---- tail: critical terrain, remarks continued, ETOPS analysis ---- */
    parseTail(tail, out);

    /* ---- validations ---- */
    out.checks = validate(out);
    out.ok = true;
    return out;
  }

  function isRow1(tk) {
    var f = tk.slice(-8);
    return /^(\d{3}|---)$/.test(f[0]) && /^\d+$/.test(f[1]) && /^\d+$/.test(f[2]) && /^(\d{3}|---)$/.test(f[3]) &&
      /^(F\d{3}|CLB|DSC|---)$/.test(f[4]) && /^(M\d{3}|---)$/.test(f[5]) && /^(\d+\/\d+|---\/---)$/.test(f[6]) && /^\d+$/.test(f[7]);
  }

  /* ---- ICAO flight plan ---- */
  function parseFpl(lines) {
    var fields = [], cur2 = '';
    lines.forEach(function (ln, i) {
      if (i === 0) { cur2 = ln.replace(/^\(/, ''); return; }
      if (/^-/.test(ln)) { fields.push(cur2); cur2 = ln; }
      else cur2 += ' ' + ln;
    });
    fields.push(cur2.replace(/\)\s*$/, ''));
    var fpl = { raw: lines.join('\n'), fields: fields };
    // fields[0]= "FPL-UAL991-IS", [1]="-B764/H-SDE...", [2]="-LEBL0930", [3]="-route", [4]="-KIAD0856 KBWI", [5]="-PBN/..."
    var f0 = /^FPL-(\S+?)-(\w)(\w)$/.exec(fields[0] || '');
    if (f0) { fpl.callsign = f0[1]; fpl.rules = f0[2]; fpl.flightType = f0[3]; }
    var f1 = /^-(\w+)\/(\w)-(\S+)/.exec(fields[1] || '');
    if (f1) { fpl.acType = f1[1]; fpl.wake = f1[2]; fpl.equip = f1[3]; }
    var f2 = /^-([A-Z0-9]{4})(\d{4})/.exec(fields[2] || '');
    if (f2) { fpl.dep = f2[1]; fpl.etd = f2[2]; }
    if (fields[3]) {
      var rs = fields[3].replace(/^-/, '').trim();
      fpl.route = rs;
    }
    var f4 = /^-([A-Z0-9]{4})(\d{4})\s*(.*)$/.exec(fields[4] || '');
    if (f4) { fpl.dest = f4[1]; fpl.eet = f4[2]; fpl.alternates = f4[3] ? f4[3].split(/\s+/) : []; }
    fpl.field18 = (fields[5] || '').replace(/^-/, '');
    return fpl;
  }

  /* ---- tail sections ---- */
  function parseTail(tail, out) {
    var i = 0, q;
    var texts = tail.map(function (l) { return l.text; });
    out.terrain = [];
    out.remarksContinued = [];
    out.etopsAnalysis = null;
    var mode = '';
    var etops = { entryAirport: '', exitAirport: '', windows: [], cps: [] };
    var curCP = null;
    for (i = 0; i < texts.length; i++) {
      var T = texts[i];
      if (/^CRITICAL TERRAIN SCENARIO/.test(T)) { mode = 'terrain'; continue; }
      if (/^DISPATCHER REMARKS \(continued/i.test(T)) { mode = 'remarks'; continue; }
      if ((q = /^ETOPS ENTRY AIRPORT\s+(\S+)/.exec(T))) { etops.entryAirport = q[1]; mode = 'etops'; continue; }
      if ((q = /^ETOPS EXIT AIRPORT\s+(\S+)/.exec(T))) { etops.exitAirport = q[1]; mode = 'etops'; continue; }
      if (/^EARLIEST\/LATEST ARRIVAL/.test(T)) { mode = 'etops'; continue; }
      if ((q = /^(\S+\/\S+)\s+(SUITABLE|UNSUITABLE|\S+)\s+(\d{4})Z\/(\d{4})Z$/.exec(T))) { etops.windows.push({ apt: q[1], status: q[2], from: q[3], to: q[4] }); continue; }
      if ((q = /^CP-(\d+)\s+(\S+)\s+(\S+)$/.exec(T)) && RE_COORD_LAT.test(q[2])) {
        curCP = { n: +q[1], latStr: q[2], lonStr: q[3], alts: [], rows: [], times: [] };
        etops.cps.push(curCP); mode = 'cp'; continue;
      }
      if (mode === 'terrain') { out.terrain.push(T); continue; }
      if (mode === 'remarks') { out.remarksContinued.push(T); continue; }
      if (mode === 'cp' && curCP) {
        if ((q = /^FUEL REMAINING\s+(\d+)\s+FUEL REQD\s+(\d+)/.exec(T))) { curCP.fuelRem = +q[1]; curCP.fuelReq = +q[2]; continue; }
        if (/^[12]ENG TIME FROM CP/.test(T)) { curCP.times.push(T); continue; }
        if (/^CP-\S+\/\S+(\s+CP-\S+\/\S+)*$/.test(T)) { curCP.alts = T.split(/\s+/).map(function (a) { return a.replace(/^CP-/, ''); }); continue; }
        if (/^FUEL\s+2ENG/.test(T)) { curCP.rows.push({ label: 'FUEL', header: T.replace(/^FUEL\s+/, '').split(/\s+/) }); continue; }
        var tk = T.split(/\s+/), j = tk.length;
        while (j > 0 && /^[MP]?\d+$/.test(tk[j - 1])) j--;
        if (j < tk.length && j > 0) { curCP.rows.push({ label: tk.slice(0, j).join(' '), values: tk.slice(j) }); }
        continue;
      }
    }
    if (etops.entryAirport || etops.exitAirport || etops.cps.length || etops.windows.length) out.etopsAnalysis = etops;
  }

  /* ---- sanity checks (shown to the pilot as "parse check") ---- */
  function validate(out) {
    var checks = [];
    var main = out.navlogs[0];
    var wps = main.events.filter(function (e) { return e.type === 'wp'; });
    checks.push({ name: 'Waypoints parsed', ok: wps.length > 1, detail: wps.length + ' (incl. T/C, T/D)' });
    var bad = wps.filter(function (w) { return w.fuel == null || w.etMin == null || w.lat == null; }).length;
    checks.push({ name: 'Every waypoint has position / ET / fuel', ok: bad === 0, detail: bad ? bad + ' incomplete' : 'all complete' });
    var first = wps[0], last = wps[wps.length - 1];
    if (first && out.fuel.planTO) checks.push({ name: 'Fuel at departure = PLAN T/O', ok: Math.abs(first.fuel - out.fuel.planTO.fuel) <= 1, detail: first.fuel + ' vs ' + out.fuel.planTO.fuel });
    if (last && out.fuel.remf) checks.push({ name: 'Fuel at destination = REMF', ok: Math.abs(last.fuel - out.fuel.remf.fuel) <= 1, detail: last.fuel + ' vs ' + out.fuel.remf.fuel });
    if (first && out.routing.dist != null) checks.push({ name: 'Route distance matches', ok: first.remDist === out.routing.dist, detail: first.remDist + ' vs ' + out.routing.dist + ' NM' });
    var sumD = 0; wps.forEach(function (w) { sumD += w.zoneDist || 0; });
    if (first) checks.push({ name: 'Leg distances add up', ok: Math.abs(sumD - first.remDist) <= Math.max(5, first.remDist * 0.005), detail: sumD + ' vs ' + first.remDist + ' NM' });
    var fuelBreaks = 0;
    for (var i = 1; i < wps.length; i++) if (Math.abs(wps[i - 1].fuel - wps[i].zbo - wps[i].fuel) > 2) fuelBreaks++;
    checks.push({ name: 'Fuel burn is continuous', ok: fuelBreaks === 0, detail: fuelBreaks ? fuelBreaks + ' legs off' : 'every leg ties out' });
    if (last && out.header.ete) checks.push({ name: 'Final ET = planned time en route', ok: Math.abs((last.etMin || 0) - hm(out.header.ete)) <= 1, detail: last.et + ' vs ' + out.header.ete });
    return checks;
  }

  return { itemsToLines: itemsToLines, parsePages: parsePages, parseLines: parseLines, fmtLat: fmtLat, fmtLon: fmtLon, hm: hm };
});
