# ORCA Checklist

Offline checklist PWA for the 757/767 ORCA Guide (FM 2602, 4.10.4, 17 APR 26).

- Two tabs: **Page 1** (4.10.4 checklist) and **Page 2** (4.10.5 General: Revised Clearance, Contingency Briefing, Redispatch, Pilot Change Brief, Weather Deviation)
- Tap to check items; progress is saved on the device (survives Safari closing or an iPad restart)
- **Reset All** (with confirm) for a new flight
- **NEXT WPT** clears only the Waypoint Procedures card and counts waypoints
- Each Page 2 card has its own **RESET** so it can be reused during a flight
- Works with no signal once installed

Reference aid only. Always verify against the current Flight Manual.

## Deploy on GitHub Pages

1. Create a repo (e.g. `orca-checklist`) and upload everything in this folder to the repo root.
2. Repo **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
3. After a minute the site is live at `https://<username>.github.io/orca-checklist/`.

## Install on iPad (do this on the ground, with internet)

1. Open the URL in Safari.
2. Wait for the footer to say **Offline ready.**
3. Share → **Add to Home Screen**.
4. Open it once from the Home Screen icon. After that it launches offline.

## Updating

Edit `index.html`, then bump `VERSION` in `sw.js` (e.g. `orca-v2`). Without the bump, devices keep the old cached copy.
Item order within a section should stay stable, or saved checks will shift to different items.

## Files

- `index.html`: app and checklist data (edit the `COLS` array to change items)
- `sw.js`: service worker (offline cache)
- `manifest.webmanifest`: install metadata
- `icons/`: app icons
