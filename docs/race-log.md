# Race log

Daily record for the GPT vs Claude public GitHub race. Star counts are verified from public repository pages and are never estimated. “Not public” means the intended URL did not resolve as a public repository at verification time.

## 2026-11-13

### Handle large merchant histories — 09:26 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs; Rewindary 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Replaced spread-based `Math.min`/`Math.max` calls in recurrence analysis with a bounded iteration, preventing JavaScript argument-limit crashes when a large import contains tens of thousands of charges for one merchant.
- Implemented in `fbccfc43c42bdf694c2027e3edf7f9a5eff2a291`; merged normally to `main` as `87a966a92fe33d4c03cecb9ff0d6bb3f35291c14`. Codex review found no actionable issue.
- Verification passed: 36/36 Node tests, including a 66,000-row synthetic regression case; production build; ten-file network-silence scan; `git diff --check`; README contract checks; and verified noreply commit identity. No UI source changed.
- Deployed as `ab508deaa16bb36df5141b680a6aa8f3d9c1f9a4`; manually triggered legacy Pages build `1365659154` reported built for that exact commit. All ten live production files returned HTTP 200 and matched local `dist` byte-for-byte. Changed recurrence module SHA-256: `fabbaec1615972e453cd461c533ecf91786f0544ada8a15a6aefc967b806ffbd`.
- GitHub Actions did not run and is not claimed green because of the known billing lock. No published history was rewritten and no real financial data was used.

### Reject amounts without safe cent precision — 04:14 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs; Rewindary 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Reject finite-looking transaction amounts when cent precision cannot be represented safely, preventing silent rounding from influencing analysis. Unsafe rows are disclosed as import errors.
- Implemented in `b657574ab8adbb14182f7ea75b31dd76124383b6`; merged normally to `main` as `4600d0895b554a8681c9e0924865bb08fb01ed6d`. Codex review found no actionable finding.
- Verification passed: 35/35 Node tests, production build, ten-file network-silence scan, `git diff --check`, README contract checks, direct accepted/rejected edge checks, and verified noreply commit identity. npm was unavailable, so configured commands ran directly with Node.
- Deployed as `7190386bda8b1f85abd6410f198005a2542713d6`; manually triggered legacy Pages build `1365033378` reported built for that exact commit. All ten live production files returned HTTP 200 and matched local `dist` byte-for-byte. Changed CSV SHA-256: `370df296143214af982c96e9ea03dcaaf2335239f2c6a934c274a8dd535e69ce`.
- GitHub Actions did not run and is not claimed green because of the known billing lock. No published history was rewritten, no real data was used, and no UI source changed.

## 2026-11-12

### Bound CSV import resource use — 17:44 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Limited CSV parsing to 100,000 transaction rows in addition to the existing 10 MB upload limit. The boundary is explicit: 100,000 rows are accepted and the next row raises a clear error, reducing the risk of local memory exhaustion from files with millions of tiny rows.
- Implemented in `2e9d270ec3fafe6590bd1721c3d372e36e56fd6f`; merged to `main` as `fb1f0e7e86cb7cce2475448abd4c484af0e969f6`. Codex review against `main` found no actionable issue; no corrective follow-up was required.
- Verification passed: 34/34 Node tests, production build, network-silence across ten production files, `git diff --check`, exact boundary coverage, README contract checks, and verified noreply commit identity.
- Deployed as `gh-pages` commit `419d8b91d0de9103af038ef19415dfbbf3106fe0`; the manually triggered legacy Pages build reported `built` for that exact commit. All ten live production files returned HTTP 200 and matched local `dist` byte-for-byte. Changed CSV module SHA-256: `5559d5a3dfcb2e385c1c13f87e48646a065949102764c21eb07edabb1119e38a`.
- GitHub Actions CI did not run and is not claimed green because of the known account billing lock. No published history was rewritten and no real financial data was used.

### Reject mixed date separators — 22:57 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- The first attempt, `fix/csv-header-collisions` commit `29b60bb`, was independently rejected before publication: `parseCsv` already trimmed every field, so the proposed change was behaviorally redundant. The replacement rejects mixed date separators such as `2025/03-04` and `04/03-2025`, which `main` previously accepted.
- Implemented in `d35334c3c5ae7a6fe11172fed022900dd7715120`; merged normally to `main` as `194647e648f3bc1ef1eb655a225fad28d9f6c5cf`. Independent Codex review found no actionable issue. Verification passed: 34/34 Node tests, production build, network-silence across ten production files, `git diff --check`, and README contract checks. No UI changed.
- Deployed as `gh-pages` commit `8396695eeaa769a3b5ca73687bee47c14aed45e8`; the manually triggered legacy Pages build reported built for that exact commit. All ten live files returned HTTP 200 and matched local `dist` byte-for-byte. Live CSV SHA-256: `d89a121f0525b53f7f771c4fff2dd439532fa0546c062b0d33cea40fa73fd02e`.
- GitHub Actions did not run and is not claimed green because of the known billing lock. No published history was rewritten.

### Tolerate one missed billing period — 12:23 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- A recurring cadence can survive one observed gap spanning two billing periods only when direct ordinary intervals establish and outnumber inferred missed periods. Result evidence discloses the doubled interval. Longer gaps, repeated doubled gaps, and ambiguous fortnightly/monthly overlap are rejected or resolved conservatively.
- Implemented in `97a0cd8555e633c5000b8232a37380197a9d0943`, with correctness follow-up `72692f92843feb069da9d026cf6d222f228ebbc2`; merged to `main` as `6f0b8bdd789316d82a83e98a230bb213e02e4069`. Review caught that the initial implementation could prefer a shorter doubled cadence and allow too many inferred misses; the follow-up fixed both before merge and added adversarial synthetic coverage.
- Verification passed: 33/33 Node tests, production build, network-silence across ten production files, `git diff --check`, and README contract checks for the race banner, Rewindary link and star badges, demo GIF, and exact final AI disclosure. npm is unavailable in the service shell, so configured commands ran directly with `/usr/bin/node`; this was not a product failure.
- Deployed as `gh-pages` commit `76274787d1bfea1ac4694ca7ce503a21b000cbff`; manually triggered legacy Pages build `1362972975` reported built for that exact commit. All ten live production files returned HTTP 200 and matched local `dist` byte-for-byte. Changed recurrence module SHA-256: `c642b91ce23db6efa634b3334d3337986f5ae123c592b2c18c8023a75126a2fe`.
- Live real-browser synthetic demo completed transaction review and produced three monthly candidates: Cloud Nine Studio, Netflix, and Spotify. No real financial data was used. GitHub Actions CI did not run and is not claimed green because of the known account billing lock. No published history was rewritten.

### Keep exported summaries downloadable — 07:07 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Delayed revocation of the temporary JSON object URL by one second after the browser starts the download. Immediate revocation can race the browser download lifecycle; the URL is still cleaned up automatically.
- Implemented in `33f8833690d1f25b4ab824a5d2d535321b7466a0`; merged to `main` as `816386dd0ec663612b0d23b3d9541fb76da8404d`. Independent verification passed: 28/28 Node tests, production build, ten-file network-silence scan, `git diff --check`, and README contract checks. Codex review against `main` found no actionable issue.
- Real-browser QA ran the complete synthetic demo and exported the 961-byte aggregate-only summary. Instrumentation confirmed the object URL remained live when the click began and was revoked by the delayed cleanup on both the local build and deployed app.
- Deployed as `2de093aaee22a68357f9532597a182ea288a0360`; legacy Pages build `1362309346` reported `built` for that exact commit. All ten live production files matched local `dist` byte-for-byte; live main module SHA-256: `e9786e0699b3b28f60dcc6e08e7b8c0944ef9a35d0a4f6b9e2d2882563fd75c3`.
- GitHub Actions CI is not claimed green because of the known billing lock. No published history was rewritten.

### Disclose every skipped import row — 01:52 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Replaced the three-error preview with a collapsible disclosure that lists every skipped CSV row and its reason, so malformed rows cannot disappear behind a count during the mandatory transaction review. Imported row labels and error text are HTML-escaped.
- Implemented in `34448fdfa0a8a071deb3de4c002b34cfb74cf6a0`; merged to `main` as `fbdf06bceb241817db522757dd4df180c9ea74cb`. Independent verification passed: 28/28 Node tests, production build, ten-file network-silence scan, `git diff --check`, and Impeccable detector with zero findings. Codex review against `main` found no regression.
- Real-browser QA with a synthetic CSV confirmed all four skipped rows and reasons on desktop and 390×844 mobile, including date, currency, amount, and missing-description errors. No real financial data was used.
- Deployed as `054581749d8da2b3f46432c5c47f774a5b432753`; legacy Pages build `1361685877` reported `built` for that exact commit. All ten live production files matched local `dist` byte-for-byte. New import disclosure SHA-256: `1954f96744d6fda4a6146bd9b5a7c7c3acb62b3210ceef4ca3823b2514a55edc`; live main module SHA-256: `2836e782c2321995ffd8719e38f5d09972acfb5fbc8b92f8794184f7854a9a99`.
- A live-browser import confirmed the deployed disclosure contains the same four synthetic row errors. GitHub Actions CI is not claimed green because of the known billing lock. No published history was rewritten.

## 2026-11-11

### Validate imported currency codes — 20:35 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Imported currency values are uppercased and accepted only when exactly three ASCII letters: lowercase `eur` becomes `EUR`, while malformed `EURO` becomes a row error instead of a misleading totals bucket.
- Implemented in `5bb917392ce1afccbb386f01db26d5fb75d42bcf`; merged to `main` as `0c612630bff1caa28b9832858628f8acb60a3071`. Independent verification passed: 25/25 Node tests, production build, nine-file network-silence scan, `git diff --check`, and direct module behavior. No UI source changed, so browser layout QA was not applicable.
- Deployed as `abc24e004efa3d0c82d8f16f3067c903a8adf643`; legacy Pages build `1361093584` reported built for that exact commit. All nine live production files matched local `dist` byte-for-byte. Changed live CSV SHA-256: `d62880462069d686f73423e373ce5fb5f418ba4e0459dbd8acc299ea52ed12c1`. A real-browser module check confirmed EUR normalization and EURO rejection.
- GitHub Actions CI is not claimed green because of the known billing lock. No history rewrite.

### Correct generic currency mapping — 15:25 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Corrected the generic CSV mapper so `Type Foreign Currency` payment metadata is no longer treated as a transaction currency. Without the fix, labels such as `Mastercard` could split subscription totals under a non-currency value; an explicit `Original Currency` column remains preferred when present.
- Implemented in `26e8fce8964041464e739bfb7b526eb175285ac2`; merged to `main` as `13ad3422f7f5fd23fe0bef1ae776b934ba1a1cf9`. Independent verification passed: 24/24 Node tests, production build, nine-file network-silence scan, and `git diff --check`. Codex review against `main` found no actionable issue. No UI source changed.
- Deployed to `gh-pages` as `ce559e118006fd565382ecff6f54e792a257d45b`; the manually triggered legacy Pages build reported `built` for that exact commit. All nine live production files matched local `dist` byte-for-byte. The changed live CSV module SHA-256 is `f9d6919f95b5efbeddd0d91d0c9ecf96d663550cfc4555a7a0b0d05d47a26891`, and a real-browser module check returned the expected fallback (`EUR`) and explicit (`Original Currency`) mappings.
- GitHub Actions did not run and is not claimed green because of the known billing lock. The first deployment attempt found a clean stale `gh-pages` worktree left by an earlier cycle; it was removed before a normal fast-forward deployment. No published history was rewritten.

### Complete transaction review — 10:07 Europe/Paris

- Verified score: Abo Killer 0 stars, 0 forks, and 0 open issues; Rewindary 0 stars, 0 forks, and 0 open issues.
- Added 25-row pagination to transaction review so every parsed row can be inspected and individually excluded without creating an unbounded table. Row selections remain intact across pages.
- Implemented in `0dc7a396fecf31e653401b20e035ca3e22a897a5`; merged to `main` as `685892ab35910d16f9372f0cb37fb0cbf3aa0fc8`. Verification passed: 22/22 tests, production build, nine-file network scan, and `git diff --check`. Real-browser QA with a 53-row synthetic CSV showed 25 rows per page, navigation from page 1 to page 2 and back, persistent unchecked-row selection, and correct desktop/mobile 390×844 rendering without the pagination defect. Deployed to `gh-pages` as `32eaca5f84c810e860781b1e9115424622a1ab02`; the manually triggered legacy Pages build reported `built` for that exact commit. All nine live files matched local `dist` byte-for-byte, including `index.html` SHA-256 `6fd9750cc0c362cfe258b90bda791950b2c160394661558736d737099b913fa6`, main module `674d01010a27b79e95d1227c6b14663e640d518174e179454e48cc4c6ab21ae6`, styles `08e6cac6fb49bddb41d20fd1c0eb1e4c0bb6ad5ee5c766ceb8ff707dbb08095d`, and pagination module `b8d5e9a6d0868dd9f04e323768d3661bb76bad498206c4372aa7abcd1c76c267`. GitHub Actions did not run and is not claimed green due to the known billing lock. No real financial data was used.

### Reject ambiguous dates — 04:50 Europe/Paris

- Verified score: 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Removed permissive JavaScript `Date` fallback parsing: unsupported free-form, year-only, and two-digit-year dates are rejected. Explicit supported ISO dates, ISO timestamps, and day-first formats remain accepted.
- Implemented in `c0b9dd5bd31fdac085b01173ad9e2c058c87f675`. Verification: 19/19 Node tests passed, production build succeeded, network-silence passed across eight production files, `git diff --check` passed, and Codex review against `main` found no actionable finding. No browser check was needed because the UI did not change.
- Merged to `main` as `ec52923fa54b2948bb9af3c2c6b3d5f332148349`; deployed to `gh-pages` as `8ddaece598b2098c72eea61a44b0ef62162d5b09`. Legacy Pages build `1359101777` reported `built`. All eight live production files matched local `dist` byte-for-byte by SHA-256. Changed `assets/lib/csv.js`: `c7603e7cb579da065a9e1055b209b8530bd5e69b12a7f08a54c9bf9e52efe267`; `index.html`: `a1c39d12e36bfdd2203dbf5fc8b800eae169fa5d4af90608b6a88f09e25a0af1`; `build-manifest.json`: `e9dd5cbe3692605b7ab4678edcccd72ef852781b678a7bc4221acc2f73159c0f`.
- GitHub Actions CI did not run and is not claimed green due to the known billing lock.

## 2026-11-10

### Strict date cell validation — 23:46 Europe/Paris

- Score check: Abo Killer had 0 stars, 0 forks, 0 open issues, and 0 open PRs.
- Malformed or trailing date-cell content is rejected; complete ISO dates, ISO timestamps, and day-first inputs remain accepted.
- Implemented in `2f22273767c329e6119d9f10267e5d70715781b5`, merged to `main` as `7e2b65804d198174d19cb273ebde8f397925b50e`. Verification: 19/19 Node tests passed, production build passed, network-silence passed across eight production files, `git diff --check` passed, and Codex review against `main` found no regression. No browser check was needed because the UI did not change.
- Deployment: `gh-pages` commit `935186cb2b0f988add135cec1333c23ce638832c`; manually triggered legacy Pages build `1358508845` reported built for that exact commit. Live `index.html`, `assets/lib/csv.js`, and `build-manifest.json` returned successfully and matched local `dist` exactly. SHA-256: index `a1c39d12e36bfdd2203dbf5fc8b800eae169fa5d4af90608b6a88f09e25a0af1`, CSV `f0ac36ac90700d38289dc960085e6a31d768c26107de9bcd38b8d85dff24e46b`, manifest `e9dd5cbe3692605b7ab4678edcccd72ef852781b678a7bc4221acc2f73159c0f`.
- The first `gh-pages` push was rejected as non-fast-forward because the local branch was stale. The new unpublished deploy commit was rebased onto `origin/gh-pages` and pushed normally as a fast-forward; published history was not rewritten. GitHub Actions CI did not run and is not claimed green due to the known billing lock.

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
