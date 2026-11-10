# Race log

Daily record for the GPT vs Claude public GitHub race. Star counts are verified from public repository pages and are never estimated. “Not public” means the intended URL did not resolve as a public repository at verification time.

## 2026-11-10

### Strict amount syntax — 18:25 Europe/Paris

- Score check: Abo Killer had 0 stars, forks, open issues, and open PRs.
- Strict amount grouping and syntax validation was implemented in `3ec11145cc77358de4f19cfad7ca9f68d4b681d6` and merged as `74d0c9203a51eb9f7db54506bf642377d3e86ba7`. Verification: 18/18 tests passed, production build succeeded, network-silence passed across eight files, and review found no actionable issue. GitHub Actions did not run because of the known account billing lock.
- Deployment: `gh-pages` commit `7de29b5aeb65d4f787cb894df7b1545d03bbf71e`; manually triggered legacy Pages build `1357841345` reported `built`. Live index and JavaScript SHA-256 hashes matched local `dist`: `a1c39d12e36bfdd2203dbf5fc8b800eae169fa5d4af90608b6a88f09e25a0af1` and `ef1a60c6543bdd32b69799b36952113dec9fb681d480bb96553a718414f704b8`.

### Reject corrupted amount cells — current cycle

- `parseAmount` no longer strips arbitrary letters or punctuation and turns damaged values into plausible numbers. It accepts currency symbols and an optional three-letter currency code while preserving supported numeric formats.
- Added synthetic tests for accepted currency codes and rejected embedded text/punctuation.
- Verification: 18/18 Node tests passed; production build succeeded; network-silence scan passed across eight production files; `git diff --check` passed. Review against `main` found no actionable regression. Browser checks were not applicable because the UI did not change.
- Score check at 13:15 Europe/Paris: Abo Killer and Rewindary each had 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Publication: `main` commit `9c721cc72924337c83aab826ea89485cf94fa4a9`; `gh-pages` deployment `5091472be4ba670b8b5a352c966d529f7095e82f`. The manually triggered legacy Pages build status was `built` for that exact deploy. The live index and `assets/lib/csv.js` returned HTTP 200 and matched the deployed bytes; CSV SHA-256: `9da587469a07cd9ce78e32e4b171e419f8d23816fc629239885443255f3e36c4`.
- The automatic build initially errored under the known account lock; the manual legacy build succeeded. GitHub Actions CI is not claimed green.

### Decimal amount parsing — 08:06 Europe/Paris

- Score check: Abo Killer and Rewindary each had 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- `parseAmount` now handles one-decimal European comma values such as `42,9` and `1.234,5`, while preserving the intentional `1,234` → `1.234` interpretation.
- Verification: 17/17 Node tests passed; production build passed; network-silence scan passed across eight files. Codex review against `main` found no actionable regression.
- Publication: source commit `d4e165f`; `gh-pages` commit `ab76b1ea54a567c8de1d5606399923718ccf6f0e`. The legacy Pages build status was `built` for that exact commit. The live index and CSV asset returned HTTP 200 and matched the deployed branch byte for byte; CSV SHA-256: `4c6d096a82f56b16d77084dd66c6a8c28a1d01ef967b7b62d4a789e9df38809d`.
- GitHub Actions CI was not run and is not claimed green because of the known account lock.

### Recurrence duplicate-date hardening — 02:51 Europe/Paris

- Score check: Abo Killer had 0 stars, 0 forks, 0 open issues, and 0 open PRs; Rewindary had 0 stars, 0 forks, and 0 open issues.
- Same-day charges for one merchant are excluded as ambiguous recurrence evidence, preventing duplicates from inflating confidence or cost. Recurrence remains detectable when enough other distinct dates support it.
- Verification: 17/17 Node tests passed; production build succeeded; network-silence scan passed across eight production files. Codex review found no actionable defect after an initial review caught and corrected an overly broad whole-group rejection.
- Publication: `main` at `7a0b2f475ddcb397cc5082768f02b95517075aa7`; `gh-pages` at `46f0d9bc02e8919b3b5ad1c70b7945b7a2842435`. The live recurrence asset returned HTTP 200 and its SHA-256 exactly matched the deployed branch: `ef285bc09c7220eee8a79c462d31ddb717846327fe993f9ced8a68399c442101`.
- Failure: the manually triggered GitHub Pages legacy build endpoint returned `errored` / `Page build failed`, consistent with the known account lock. Branch-backed live content still updated and was byte-for-byte verified; CI is not reported green.

## 2026-11-09

### CSV correctness hardening — 21:38 Europe/Paris

- Fixed the CSV parser accepting quote characters inside unquoted fields and arbitrary text after a closing quote. Both cases could silently change a merchant value while leaving the row apparently valid.
- Added strict row-width validation so missing or extra cells stop the import instead of being padded or ignored.
- Added a synthetic European fixture with a UTF-8 BOM, CRLF records, semicolon delimiter, delimiters inside quoted merchant names, escaped quotes, an embedded line break, and a parenthesized European amount. Added rejection checks for malformed quoting and inconsistent row widths.
- Verification: all 15 `node --test` cases pass; production build succeeds; network-silence scan passes across eight production files.
- The `npm run verify` wrapper could not run because npm is absent in this environment. Its three configured commands were run directly and passed. Browser-level QA was unavailable because no browser binary or browser automation package is installed; this parser-only change did not alter the interface.
- No real statements or personal data were used. Nothing was pushed or published.

### Score check — 16:36 Europe/Paris

| Entry | Repository | Verified stars |
| --- | --- | ---: |
| GPT — Abo Killer | [ArthurRavel/abo-killer](https://github.com/ArthurRavel/abo-killer) | Not public |
| Claude — Rewindary | [ArthurRavel/rewindary](https://github.com/ArthurRavel/rewindary) | Not public |

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


## Public launch — 2026-11-09 22:38 Europe/Paris

- Repository: https://github.com/ArthurRavel/abo-killer — **0 stars**, 0 forks, 0 open issues at verification.
- Live app: https://arthurravel.github.io/abo-killer/ — HTTP 200 verified.
- Opponent: https://github.com/ArthurRavel/rewindary — **0 stars** at verification.
- The GitHub Actions job could not start because the account is locked for a billing issue. No security control was bypassed: the locally verified `dist/` was committed to a dedicated `gh-pages` branch and GitHub Pages legacy deployment completed successfully.
- Future commits use the verified GitHub noreply identity. Published history was not rewritten.
