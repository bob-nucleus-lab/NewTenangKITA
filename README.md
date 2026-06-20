# NewTenangKITA v0.8.1

Stability hotfix release. This restores the working v0.7.2 citizen experience and adds only a small OpenDOSM micro-test, without changing the app structure.

## Product compass

NewTenangKITA is a trusted, empathetic and practical citizen support layer for Malaysians — including OKU, elderly citizens, caregivers and low-digital-literacy users — that helps people understand official information and take one useful action at a time.

## What this hotfix restores

- Working guest-first citizen flow
- OKU-friendly Akses tab
- Paparan Mudah, larger text, high contrast and read-aloud
- Caregiver mode and human-support routes
- MyDigital ID handoff simulation without passwords
- SARA, BUDI95, STR and PADU consent demo boundaries
- Amanah Data and Status Prototaip as secondary detail screens
- No citizen scoring, no fabricated prices and no false eligibility
- No database, no backend and no personal citizen data

## v0.8.1 update

- Restores the v0.7.2 file structure: `index.html`, `src/app.js`, `src/styles.css`, `manifest.webmanifest`, `sw.js`.
- Adds an OpenDOSM micro-test using `cpi_core` inside Amanah Data.
- Includes recovery files for users who may still have the v0.8 service worker cached.
- Keeps PriceCatcher as a future adapter/cache, not a direct mobile API.
- Keeps PADU as future consent-based readiness only.

## Deployment note

Upload all files in this package to the GitHub Pages repository root. Keep `service-worker.js` and root `app.js` for at least one deployment cycle because they help recover browsers that cached v0.8.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version is a static GitHub Pages prototype. It must not collect MyKad numbers, passwords, biometrics or real personal benefit data.
