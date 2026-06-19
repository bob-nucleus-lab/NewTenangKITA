# NewTenangKITA v0.1

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

## Run locally

Serve this directory with any static HTTP server. Example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Prototype boundary

This version does not connect to MyDigital ID or agency APIs. It must not accept real identity numbers, passwords or personal benefit data.
