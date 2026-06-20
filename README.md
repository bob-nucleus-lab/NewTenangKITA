# NewTenangKITA v0.8.2 — Final Presentation Polish

This release keeps the stable v0.8.1 hotfix structure and applies only presentation-safe UX polish. It does not add a database, backend, real identity integration or personal citizen data.

## Product compass

NewTenangKITA is a trusted, empathetic and practical citizen support layer for Malaysians — including OKU, elderly citizens, caregivers and low-digital-literacy users — that helps people understand official information and take one useful action at a time.

## What changed in v0.8.2

- Kept citizen-facing brand as **TenangKITA**.
- Kept prototype/version label in documentation and Status Prototaip only.
- Removed numeric demo balances and demo subsidy values.
- Made SARA, BUDI95 and STR cards show that official connection is required for real balances/status.
- Made PriceCatcher wording safer: update time must be checked through the official portal or future adapter/cache.
- Made OpenDOSM results easier to understand, with raw technical data hidden under details.
- Added real **Butang besar** accessibility mode.
- Preserved recovery files for browsers that may still cache the broken v0.8 assets.

## What remains unchanged

- Guest-first flow.
- OKU-friendly Akses tab.
- Paparan Mudah, larger text, high contrast and read-aloud.
- Caregiver mode and human-support routes.
- MyDigital ID handoff simulation without passwords.
- PADU readiness only.
- OpenDOSM as public context only.
- PriceCatcher as future adapter/cache, not fake live price.
- No citizen scoring, false eligibility or fabricated prices.
- No database, no backend and no personal citizen data.

## Deployment note

Upload all files in this package to the GitHub Pages repository root. Keep `service-worker.js`, root `app.js`, root `styles.css` and `manifest.json` for one more deployment cycle to help browsers recover from v0.8 cache.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version is a static GitHub Pages prototype. It must not collect MyKad numbers, passwords, biometrics or real personal benefit data.
