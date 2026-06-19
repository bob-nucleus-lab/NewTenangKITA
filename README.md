# NewTenangKITA v0.5

BM-first, empathy-led citizen prototype for Malaysia. This release strengthens the trust layer: OpenDOSM readiness, verified resource registry, PADU-readiness, OKU-friendly support, practical checklists and clear truth labels.

## Core features

- Guest-first access with no assumed location, income or household profile
- Concern-led citizen flow with practical weekly actions
- OKU-friendly Akses tab, high contrast, larger text, Paparan Mudah and read-aloud
- Caregiver mode and human-support route
- MyDigital ID handoff simulation without collecting passwords
- Separate consent for SARA, BUDI95 and STR demo views
- Public benefit discovery with preparation checklists
- No family scoring and no fabricated price figures
- PriceCatcher and Jualan Rahmah official handoff
- Local travel-cost calculator
- Amanah Data screen with OpenDOSM readiness and verified resource registry
- PADU-readiness panel as a future consent-based integration, not open data
- Installable/offline-capable PWA shell

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version does not perform real MyDigital ID login, PADU connection, agency API retrieval or benefit eligibility checks. It must not accept real identity numbers, passwords or personal benefit data.
