# NewTenangKITA v0.8.1 — Stability Hotfix

## Purpose

Recover from the v0.8 regression by restoring the proven v0.7.2 citizen experience and applying OpenDOSM as a small, contained micro-test only.

## Fixes

- Restored previous app structure and navigation.
- Restored cleaner citizen screens.
- Restored OKU/accessibility, caregiver, Paparan Mudah and human-support flows.
- Restored Amanah Data and Status Prototaip as secondary screens.
- Prevented OpenDOSM work from replacing the main app experience.
- Added recovery service-worker handling for browsers that cached v0.8.

## Data and trust

- OpenDOSM micro-test uses `cpi_core` only as public context.
- PriceCatcher remains future adapter/cache.
- PADU remains future consent-based integration.
- No database, backend, personal data, real balance retrieval or official eligibility decision is added.

## Not changed

- No real MyDigital ID login.
- No real PADU integration.
- No real SARA, STR or BUDI95 retrieval.
- No direct PriceCatcher live API.
- No scoring, false eligibility or fabricated prices.
