# NewTenangKITA v0.4

Clean BM-first citizen prototype implementing:

- Guest-first access
- Primary-concern selection
- Empathetic weekly actions without family scoring
- MyDigital ID mobile handoff mock (no password collected by TenangKITA)
- Granular consent per connected benefit source
- Demo SARA, BUDI95 and STR views clearly labelled as simulated data
- Official-source links and freshness labels
- Privacy controls and local data reset
- Installable/offline-capable PWA shell
- Neutral guest mode without assumed location or household data
- Urgent-help route without authentication
- Browser Back/history support
- MyDigital ID success, cancellation and unavailable mock outcomes
- Session-scoped verification with logout and automatic expiry
- Six plain-language need areas for daily life
- No fabricated price figures; direct PriceCatcher check for current prices
- Direct official Jualan Rahmah schedule check without fabricated events
- Local monthly travel-cost calculator
- Expanded public benefit discovery without eligibility claims
- Source and transparency screen explaining method and limitations
- Concern-specific primary actions and tappable weekly recommendations
- Preparation checklists before citizens enter official portals
- Paparan Mudah and device-based Malay read-aloud support
- Plain-language MyDigital ID explanation, helpdesk and kiosk route
- Talian Kasih telephone and WhatsApp actions

- Inclusive Access tab for OKU, elderly, caregivers, screen-reader users and low-literacy citizens
- Optional Keperluan Akses Saya without requiring disability disclosure
- High-contrast mode and caregiver mode
- OKU and caregiver support journey with preparation checklist
- Accessibility statement for prototype governance

## Run locally

Serve this directory with any static HTTP server. Example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version does not connect to MyDigital ID or agency APIs. It must not accept real identity numbers, passwords or personal benefit data.
