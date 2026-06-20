# NewTenangKITA v0.7

BM-first, empathy-led citizen prototype for Malaysia. This release adds the Practical Malaysia Service Layer: a broader assistance catalogue, clearer preparation checklists, safer state-programme handling and an EA-aligned service trust view.

## Core features

- Guest-first access with no assumed location, income or household profile
- Concern-led citizen flow with practical weekly actions
- OKU-friendly Akses tab, high contrast, larger text, Paparan Mudah and read-aloud
- Caregiver mode and human-support route
- MyDigital ID handoff simulation without collecting passwords
- Separate consent for SARA, BUDI95 and STR demo views
- Expanded Malaysia assistance catalogue with owner, category, checklist and human-support notes
- Downloadable checklist per assistance item
- State and sector programme readiness rules to prevent unverified claims
- No family scoring and no fabricated price figures
- PriceCatcher and Jualan Rahmah official handoff
- Local travel-cost calculator
- Amanah Data screen with OpenDOSM readiness, verified resource registry and EA service layer
- PADU-readiness panel as a future consent-based integration, not open data
- Installable/offline-capable PWA shell

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version does not perform real MyDigital ID login, PADU connection, agency API retrieval or benefit eligibility checks. It must not accept real identity numbers, passwords or personal benefit data.

## v0.7 presentation-safe boundary

NewTenangKITA v0.7 keeps the prototype GitHub-only and database-free for management presentation. It adds a clearer prototype status banner, product compass, static architecture boundary and presentation-readiness cues.

Current state:

- GitHub Pages only
- No database
- No backend
- No real login
- No real PADU, SARA, STR or BUDI95 retrieval
- No MyKad, password, biometric or personal benefit data collection
- Preferences stored locally on the user's browser only

Future state after approval:

- AWS/cloud POC
- API gateway
- Secure database
- Consent management
- Audit trail
- Official agency adapters
- Controlled pilot with privacy and security assessment
