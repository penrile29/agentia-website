# Oakbase V2 — operational-memory preview

The GitHub Pages preview is published at https://penrile29.github.io/agentia-website/. See `GITHUB-PAGES.md` for the build and publication process.

## Open the preview

From any terminal:

```sh
cd /Users/penrile/Documents/Oakbase/oakbase-memory-preview
python3 tools/preview_v2.py
```

- Current homepage: http://127.0.0.1:4176/
- New V2 homepage: http://127.0.0.1:4176/v2/

The server is loopback-only. If the default port is busy, use `python3 tools/preview_v2.py --port 4177` and substitute that port in both URLs. Stop with Ctrl+C.

Use this preview server for comparison: it blocks outbound connections and form submissions on both routes. The existing production form normally sends real leads; the preview server disables it in the response without changing its source. V2's form simulates the request entirely in browser memory and sends/saves nothing.

## Validate

```sh
python3 tools/validate_v2.py
```

Python 3 and Node.js are the only validation prerequisites. The original marketing site is static HTML/CSS/JavaScript: no package installation, bundler or production build step is required. The unrelated CRM application is not run or changed.

## Source and isolation

Confirmed source: `penrile29/agentia-website`, current main baseline `69355aa87c7865c96f2cdf96318ae141a7eb9dd1`. The live homepage, styles, JavaScript and favicon matched the repository. Current deployment is static nginx behind Traefik on Hostinger, configured in the original compose file; that configuration was not modified.

This is a separate local checkout on `codex/operational-memory-v2`. All changes are additive. The original homepage, assets, scripts, metadata, legal policies and deployment configuration remain byte-identical to baseline. A separate `gh-pages` branch serves the generated V2 preview.

## Product story

Oakbase turns the expertise, relationships and decisions captured in professional work into a lasting firm asset. Persistent Firm Memory is connected, searchable and usable by people and agents. Prebuilt agents run Managed Operations that reduce administration and keep the firm's records current. Visibility covers information relationships, use and actions; the firm controls human and agent access. The full positioning and language decisions are recorded in `V2-MESSAGING.md`.

The visible “Website concept” footer, illustrative labels and “About this preview” dialog identify the messaging preview. The prototype is not connected to a firm's systems and does not demonstrate live access enforcement or agent execution. Product positioning follows the user's description; it is separate from an implementation audit.

## Lean revision — 17 September 2026

The revised page follows the user’s request for the restraint and pacing of Legora. The latest version has four main sections: a short hero, the brain architecture, Managed Operations with a concrete Time Capture example, and a closing invitation. Supporting explanations and the wider operation catalogue open on demand. The earlier draft is preserved under `docs/archive/v2-initial/` and is not served publicly.

## What to try

1. Select **Explore Oakbase**, then scroll through **Work Signals → Firm Memory → Agents → Managed Operations**. A brain of work-signal dots becomes a connected memory network. Agents approach the network and connect to it; two operation contours then gather four agents each. The active explanation follows the phase being constructed. Selecting a stage name jumps to that point, and arrow keys/Home/End work. There is no playback control or automatic sequence. Reduced motion shows the complete diagram without the pinned scroll sequence. Short windows retain the construction with a compact responsive layout.
2. Two examples appear automatically at every stage: a client meeting develops into the CRM Health / Lead to Matter story, and a client call into Time Capture / Work to Invoice. Hover or tap any point for the full detail: Work Signals shows a source event; Firm Memory shows its connected context; Agents shows the responsible agent; Managed Operations shows its four-agent group. Use arrow keys from a focused point to explore, and Escape to dismiss. **Lead to Matter** groups CRM Health, Client Intake, Conflict Review and Matter Opening; **Work to Invoice** groups Matter Activity, Time Capture, Billing Review and Invoice. Examples are explicitly illustrative.
3. Open **Explore Firm Memory** for matter, relationship and evidence details, then use Escape or the close button to return.
4. In **Managed Operations**, follow the open Time Capture timeline: Firm Memory → proposed hours → professional review → logged hours. Clients/matters, documents, calendars and email feed the brain. The illustrative week shows 38.5 hours proposed, 34.0 logged and 4.5 awaiting review. All four stages are visible together, with a horizontal desktop timeline and a vertical mobile sequence. The action opens Work to Invoice in the local enquiry.
5. Open **Explore more operations**, switch law/wealth and expand an operation. Three are initially shown; **More operations** reveals the rest. **Explore this operation → Assess this operation** carries the selection into the local enquiry.
6. Open **Explore your controls** for information relationships, use visibility and human/agent boundaries. **About this preview** explains the local scope and release alignment.
7. Try the mock enquiry with example details. Nothing is transmitted, saved or booked.
8. Use **Compare current** in the footer. The original page keeps its EN/ES behavior; V2 is English-only.

## Design and reuse

Reuses the actual SVG marks, favicon, local Inter Tight and IBM Plex Mono fonts, Material Symbols and existing CSS tokens. Paper, forest and copper retain the Oakbase identity. Larger headings, quiet spacing and selective disclosure reduce reading load.

The central SVG uses the user’s brain metaphor: 176 signal dots, 219 memory connections, eight agents and two operation groups. Earlier elements remain visible as each new phase develops. Fine green lines, copper agent nodes and softly shaded operation contours distinguish the roles. Brief copy stays outside the graphic. A time-based easing follows scroll position in both directions over 180svh of added scroll distance; strokes draw and agents approach in staggered order. The SVG is original; Legora’s homepage was inspected earlier as a reference for scroll-driven pacing. The Time Capture example carries forward the source website’s timeline approach, consolidating its information inputs into Firm Memory and showing the proposal, review and recording stages together. Two prominent, explicitly illustrative KPIs distinguish proposed from logged hours. A static copy of the same projected brain provides the input visual without additional animation or interactive targets. Native HTML/CSS, native dialogs and a small JavaScript controller provide the interactions. No frontend framework, animation package, CMS or generated imagery was added.

Content remains static English in the additive route; examples are structured in `v2.js`. Existing i18n files are untouched. A complete reviewed Spanish V2 dictionary remains a follow-up.

## Files

- `v2/index.html`: complete narrative and semantic controls.
- `v2/v2.css`: scoped responsive composition, transitions, reduced-motion layout.
- `v2/v2.js`: scroll phases, dialogs and local operation/enquiry state.
- `v2/brain-explorer.js`: linked illustrative signal/memory/agent/operation content and pointer, touch and keyboard exploration. Neither script makes network calls or stores data.
- `v2/brain-volume.js`: SVG projection of the 3D point model, depth lighting and restrained pointer/scroll perspective; aligned hit targets and fixed reduced-motion view. No network calls or storage.
- `v2/time-journey.js`: independent miniature of the 3D brain for the open Time Capture timeline.
- `tools/build_pages.py`: isolated GitHub Pages artifact with portable resource paths.
- `tools/preview_v2.py`: protected loopback server for both versions.
- `tools/validate_v2.py`: local asset/fragment checks, duplicate IDs, remote-asset rejection and JS syntax.
- `docs/V2-NOTES.md`: baseline/design working notes.
- `docs/V2-MESSAGING.md`: core positioning, three value pillars and English copy choices.
- `docs/V2-CLAIMS-REVIEW.md`: security/legal evidence, contradictions and assumptions.
- `docs/V2-QA.md`: verification results.

## Before production

Read `V2-CLAIMS-REVIEW.md`. Current policies explicitly commit to transient handling of connected content/AI outputs. Persistent source or derived memory requires a reviewed data model, retention/deletion/correction lifecycle, source-access revocation and cross-operation authorisation. GitHub Pages hosts a website concept; the preview does not connect to production systems.

## Highest-value next iterations

1. Test the memory → agents → Managed Operations explanation with a managing partner and CIO.
2. Confirm which memory capabilities are available and which are roadmap; align copy accordingly.
3. Validate one real operation's source evidence, permissions, review and context-reuse journey.
4. Resolve persistent-memory policy and contract language before any release.
5. Translate and review the complete Spanish V2 narrative.
