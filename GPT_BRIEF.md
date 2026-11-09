# GPT project — Abo Killer

## Product
Build a launch-quality, fully client-side web application that accepts European bank statement CSV/PDF files, detects recurring subscriptions, estimates monthly and annual cost, and provides a reviewed cancellation link for each recognized provider.

## Target wedge
- Zero install: static browser app.
- European bank exports, initially a small set of explicit adapters plus a transparent generic column mapper.
- Deterministic detection with confidence and explainability; never invent subscriptions.
- Cancellation links are curated provider help/account pages, never automatic cancellation.
- Financial data must remain in browser memory. Do not persist raw transactions by default.

## Competition already verified on 2026-11-09
- `Sumama-Jameel/subzero`: exact local statement/subscription concept, 2 stars, requires clone/npm development flow, broad vendor database.
- `andreolf/refund-radar`: local-first bank statement auditor, 0 stars.
- `automationsmanufaktur-labs/waskostetmich`: exact 100% browser concept for German bank CSVs, 1 star.
- `devmarissa/unsub`: local finder/canceller through Claude Code, 0 stars.
- `AJ/FinSight`: local finance dashboard with recurring-payment detection, 23 stars.

The category is occupied. Differentiate honestly through a polished zero-install European adapter system, explainable detection, cancellation-link review and a demonstrably network-silent build. Do not claim to be first.

## MVP acceptance
- Static production build that can be hosted on GitHub Pages.
- Tested CSV parser and recurring-payment engine with synthetic fixtures; no real financial data.
- PDF import only if robustly implemented client-side with tested text-layer fixtures. If scanned PDFs are unsupported, say so clearly.
- Review screen before totals are accepted.
- Annualized total, frequency, confidence, evidence and cancellation link.
- Export a privacy-safe summary without raw transactions.
- Automated tests for merchant normalization, false positives, cadence, variable prices and privacy/no-network constraints.
- README includes competition matrix, threat model, screenshots/GIF plan, install/use instructions, race banner and exact final AI disclosure.
- Daily public race log.

## Opponent
Claude project repository target: `https://github.com/ArthurRavel/claude-unwrapped` (may redirect if renamed).
