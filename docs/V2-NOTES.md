# Oakbase operational memory homepage — local concept

## Before implementation
- Current stack: static HTML/CSS/vanilla JS; no root build dependencies. Nginx on Hostinger behind Traefik. Separate CRM React/Vite application is outside this work.
- Source: penrile29/agentia-website, main at 69355aa87c7865c96f2cdf96318ae141a7eb9dd1. Homepage, styles and script verified byte-identical to oakbase.ai on 2026-09-17.
- Current homepage: persistent side navigation, managed-operations hero and illustrative chat, manifesto, industries, two types of agents, time capture sequence, four-week method, trust, lead form, legal links.
- Reusable components: real Oakbase marks, locally hosted fonts and Material Symbols, button treatments, numbered sections, fine rules, form labels, operating journey.
- Design primitives worth keeping: Inter Tight; IBM Plex Mono annotations; paper #f3f0e8, ink #111512, forest #10251d, copper #bb694a; quiet precise motion.
- What changes: memory becomes the platform; agents execute against it; complete Managed Operations remain the commercial offer. Replace hero chat with a system diagram. Separate source evidence from interpretation. Keep controls around all layers.
- Interaction reference: Legora homepage and aOS progressive system reveal, studied for the progressive-disclosure principle only; no assets, copy, layout or source reused.
- English-first, translation-ready V2 using the existing data-i18n key convention. No V2 language switch until the complete Spanish narrative is reviewed. Existing EN/ES homepage remains intact.
- Safety: isolated checkout, additive /v2 route, loopback preview with no network connections or form submissions, no analytics, no production changes.

## Claims and assumptions
This is a proposed product architecture, not a statement that persistent firm memory is shipped. Every person, matter, relationship and source excerpt in the visualisations is illustrative. Source permissions and permission to act are distinct. Cross-operation reuse must always remain scoped to authorised operations.

Current legal pages describe transient processing and do not establish a persistent memory implementation. Retention, derived records, source revocation, deletion propagation, permissions and audit policy require explicit product/legal/security review before release. No privilege, certification, guaranteed confidentiality, residency, private deployment or customer-key claims are made.


## Lean revision — 2026-09-17

After direct feedback that the first draft was too long and busy, V2 was reduced to five sections. The central architecture replaces the six-stage scroll sequence; memory, relationships, evidence reasoning and governance details are available through native dialogs. Operation choices use short accordions, showing three at a time. The earlier draft is archived in `docs/archive/v2-initial/`. The original site remains untouched. See `LOCAL-V2.md` for the current interaction map and `V2-QA.md` for fresh verification.


## Four-layer graphic — 2026-09-17

The user requested Work Signals as the base, then Firm Memory, Agents and Managed Operations. After inspecting Legora’s live architecture interaction, the graphic now assembles in response to scrolling, with layer labels jumping to scroll positions. The user explicitly rejected a Play flow button; all playback controls, timers and automatic sequences were removed. The added scroll runway is limited to 80svh. Reduced motion and short viewports retain a complete static stack with manual highlighting.


## Compact stacking refinement — 2026-09-17

The user clarified that layers must physically superimpose, rather than remain exploded. All four SVG plates now share the same footprint and have 20-unit sides. Settled vertical offsets of 0/-20/-40/-60 put each plate directly on the previous one. Each arriving plate descends from above using smoothstep easing; scroll response is smoothed with a 90ms time constant and the animation loop stops once settled. Reverse scroll reverses the same movement. No play control or independent playback was added.


## Clearer construction and cleaner surfaces — 2026-09-17

After further user feedback, the component was redesigned with rounded thin plates, soft gradients and shadows, no text or illustrative icons on the plate faces, compact external navigation and one short sentence per layer. The scroll runway increased to 180svh so the three arrivals are easier to perceive. The height-based static fallback was removed: normal short desktop windows now retain the requested construction, with CSS adapting the scene. Only reduced motion disables the pinned animation. The handoff must start at Work Signals, rather than preserve the completed stack at the end of the sequence.


## Brain network — 2026-09-17

The user replaced the plate metaphor with a brain: first work-signal points, then memory connections, agents working on the brain, and operations grouping agents. The central SVG now contains an original two-hemisphere network of 176 dots and 219 connections. Nine copper agent nodes approach and connect to the brain. Three softly shaded outlines each enclose three agents. All stages accumulate and reverse with scroll; external copy names the phase being built. No labels or explanatory cards sit within the graphic. The page’s other sections, local-only behavior and original site are unchanged. Reduced motion and JavaScript-disabled layouts show the complete SVG.


## Contextual brain exploration — 2026-09-17

All 176 points now support stage-specific detail on hover, tap or keyboard focus. The same point maps from a source signal to its connected memory, responsible agent and complete operation. Memory inspection highlights neighbouring connections; agent inspection highlights its source points; operation inspection highlights its four-agent group. One roving tab stop and spatial arrow navigation avoid adding hundreds of Tab stops. Cards close with Escape, outside interaction or a phase change. Touch input also resolves taps near a point.

The graphic now has two groups of four agents: Lead to Matter (CRM Health, Client Intake, Conflict Review, Matter Opening) and Work to Invoice (Matter Activity, Time Capture, Billing Review, Invoice). Ten illustrative events use ACME/Atlas for intake and Northbridge/Cedar for billing. Invoice sent is evidence of issue, not payment; conflict review routes evidence to professionals. Lower law-operation cards and enquiry options use the same hierarchy. The original site remains untouched.

## Larger brain and exploration cue — 2026-09-18

The brain has more horizontal room, with a narrower desktop control column and controls above the diagram at widths up to 900px. A small “Client meeting” callout connects to its real signal point and invites hover or tap. It stays outside the network, does not intercept input, and disappears while a detail is open or another stage is active. Short windows omit the callout and retain the existing exploration hint.

## Concrete Managed Operations example — 2026-09-18

Removed the abstract “A clearer picture” / Project Atlas section and the repeated operation orbit. Managed Operations now leads with the current oakbase.ai “04 / EXAMPLE” Time Capture journey, verified against the live page. All six original step descriptions and integration marks are retained, with one selected step and a consistent illustrative Cedar output. The example is explicitly the Time Capture part of Work to Invoice; it ends in professional review, without implying that the example sends an invoice. The wider law/wealth catalogue opens under “Explore more operations”. Navigation is manual, with keyboard support and all six panels readable without JavaScript.

## Messaging pivot — 2026-09-18

The user clarified the three core values: persist the firm's expertise and relationship knowledge as a queryable, actionable asset; run Managed Operations through prebuilt agents to improve professional productivity and records; provide visibility and control over information access and actions by people and agents. The hero now leads with “Your firm’s knowledge. A lasting asset.” The brain explains retained knowledge and connections; operations lead with “Less admin. More reliable records.”; control names information use and access boundaries explicitly. Time Capture remains the concrete example. The closing invitation now centres on putting firm knowledge to work rather than the previous four-week delivery offer. Design and interaction structure are preserved, with small text-layout adjustments. See `V2-MESSAGING.md` for the positioning map.

## Brain in 3D — 2026-09-21

The existing 176 signal points now sit on a deterministic three-dimensional model of the two brain lobes. A small SVG renderer projects depth, perspective and lighting into the existing diagram, with faint volume contours and a ground shadow. Scroll changes the viewing angle slightly; fine-pointer movement adds restrained parallax. Inspection freezes the camera, reduced motion keeps a fixed view, and the animation loop stops at rest. No new graphics dependency or automatic playback was added.

Original signal meanings, eight agents and two operations remain. Projected points and hit targets share coordinates; memory topology is cached before projection, and agent connections follow their projected signal endpoints. The callout, tooltip, focus ring and spatial keyboard navigation use the updated geometry. The original flat SVG remains the no-JavaScript fallback.
