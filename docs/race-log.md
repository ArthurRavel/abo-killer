# Race log

Daily record for the GPT vs Claude public GitHub race. Star counts are verified from public repository pages and are never estimated. “Not public” means the intended URL did not resolve as a public repository at verification time.

## 2026-11-09

### Score check — 16:36 Europe/Paris

| Entry | Repository | Verified stars |
| --- | --- | ---: |
| GPT — Abo Killer | [ArthurRavel/abo-killer](https://github.com/ArthurRavel/abo-killer) | Not public |
| Claude — Unwrapped | [ArthurRavel/claude-unwrapped](https://github.com/ArthurRavel/claude-unwrapped) | Not public |

Context check: [subzero](https://github.com/Sumama-Jameel/subzero) 2, [refund-radar](https://github.com/andreolf/refund-radar) 0, [waskostetmich](https://github.com/automationsmanufaktur-labs/waskostetmich) 1, [unsub](https://github.com/devmarissa/unsub) 0, and [FinSight](https://github.com/AJ/FinSight) 23. The exact browser-only statement-analyzer category already exists, so no “first” claim will be used.

### Decisions

- Chose a dependency-free static JavaScript architecture so the network-silence and data-flow claims are easy to audit.
- Chose N26, Revolut, and Wise as the first explicit adapters, backed by a generic mapper rather than pretending to support every European export.
- Required two human checkpoints: parsed rows first, proposed recurring charges second. Totals remain hidden until confirmation.
- Kept currencies separate. Automatic FX conversion would require stale bundled rates or a network request, and summing currencies directly would mislead.
- Allowed unknown recurring merchants only with stronger cadence, amount, and occurrence evidence. Only recognized providers receive cancellation links.
- Deferred PDF support. Untested text extraction would weaken the privacy and correctness story; scanned PDFs require a separate OCR decision.
- Used only synthetic transaction fixtures and a programmatically generated synthetic demo GIF.
- Kept eight provider cancellation destinations whose official help pages were verified on 2026-11-09. Updated stale Canva and Microsoft URLs and removed four entries that could not be verified reliably.
- Completed a name audit: unrelated products already use “Abo Killer,” and an unrelated public project uses “Claude Unwrapped.” The race names remain working labels; neither entry should claim name uniqueness.

### Failures and corrections

- The first test run caught a CSV parser defect: source row numbers were attached in a second `map` where the index was out of scope. Moved row metadata into the original mapping pass and reran the suite successfully.
- The initial local preview server was blocked by the filesystem/network sandbox. Re-ran the same loopback-only server with explicit permission, verified the page and all five representative production assets returned HTTP 200, then stopped it.
- The first GIF-generation run exceeded the JavaScript argument limit by spreading a large byte array. Changed the encoder to append bytes iteratively; the generated GIF then passed header, size, and animation-frame checks and was visually inspected.

### Verified baseline

- 14 synthetic automated test cases pass across parsing, end-to-end demo analysis, recurrence, false positives, privacy, provider-link policy, and demo validity.
- Production build succeeds with content-hashed CSS and JavaScript entry assets.
- Network-silence scan passes across eight production text assets.
- Production preview returns HTTP 200 for the entry page, stylesheet, main module, parser, recurrence engine, and bundled synthetic sample.
- Demo GIF is a valid GIF89a file at 720×405 and contains four animated frames.
- Git identity is configured as `ArthurRavel <41898282+ArthurRavel@users.noreply.github.com>`.
- No remote is configured and nothing has been pushed.

### Next

Add adversarial CSV fixtures from more documented bank export shapes, then perform browser-level keyboard and mobile layout QA before the repository becomes public.
