# Local V2 verification

## Source validation

`python3 tools/validate_v2.py` passes: 38 asset/fragment references across three V2 source files; no duplicate IDs; JavaScript parses with Node. Static site needs no bundler/build. Original tracked site, assets, legal and deployment files have no diff against baseline `69355aa87c7865c96f2cdf96318ae141a7eb9dd1`.

## Interactive browser checks

Verified with the local page open in the Codex browser:
- Real fonts and every image load; one H1; full page and all twelve narrative sections render.
- Scroll changes system stages; direct stage selection reaches the shared-memory payoff. Fixed stage controls extending below a 1280×720 laptop viewport; the diagram now fits below the sticky header.
- Memory tabs respond to click and keyboard arrows, update selected state and expose the correct panel.
- Project Atlas reasoning disclosure separates observed signals from a signing conclusion.
- Selecting Pedro updates current coordination/evidence without changing Juan's formal ownership.
- Wealth operation selection changes the detail panel; Client Review Preparation carries the correct operation and industry to the form.
- Mock enquiry with example data displays explicit local-only success; no booking or transmission is claimed.
- Compounding controls progressively add commitments, deadlines, handoffs, decisions and priorities to existing context.
- Control disclosures open/close; legal links point to local original policies.
- No V2 console errors or warnings observed.

## Local server verification

Automated stdlib checks cover public GET/HEAD, blocked private paths and directory listings, traversal/symlink escape, foreign Host rejection, write-method rejection, CSP and in-memory legacy form protection. Validator fixtures confirm rejection of missing fragments, duplicate IDs, remote assets and invalid JavaScript.

Responsive/reduced-motion and baseline browser results are recorded below after the final browser pass.

## Responsive and accessibility pass

Playwright verified actual viewports 1440×1000, 1024×768, 390×844 and 375×812. Document/body width matched each viewport; no visible element crossed horizontal bounds. All six images and the used local Inter Tight, IBM Plex Mono and Material Symbols fonts loaded. Zero page errors, failed requests or external requests were observed.

Reduced-motion emulation verified `prefers-reduced-motion: reduce`, automatic (non-smooth) scroll and zero active animations/long transitions. With JavaScript disabled at 390px, all twelve narrative sections remain present with no overflow and an explicit fallback notice. All form controls are labeled; buttons have names; the page has one main and one H1.

Visual inspection additionally covered the 1440px desktop hero, 1024px laptop hero, 1280×720 sticky system, 390px hero/system/evidence panel. Mobile navigation opens and closes when a section is chosen; the system diagram is static and fully revealed. Detailed machine results are saved locally in `output/playwright/responsive-results.json`.

## Current-site comparison and submission safety

The original homepage passed actual 1024×768 and 390×844 width checks without horizontal overflow. Its English → Spanish → English switch updated both document language and H1 correctly. Required contact fields were filled with illustrative test details and **Send request** was selected: the injected local guard appeared, with zero subsequent requests and zero POST/other mutating requests. Offscreen original images use native lazy loading; they were not classified as missing assets. Evidence: `output/playwright/current-baseline-results.json`.

Playwright screenshots stalled waiting for browser rendering; visual review was completed through the Codex browser at the actual target viewports instead. This did not affect the successful Playwright geometry, assets, motion, language or submission checks.
