# V2 claims review

## Security positioning — 21 September 2026

The user explicitly requested a visible security block for law firms covering encryption, EU residency and Zero Data Retention with AI. V2 now explains each in plain English and connects the safeguards to confidential matters, client relationships and accumulated expertise. These are user-supplied product commitments, not results of an infrastructure audit.

The preserved security policy describes TLS and encryption at rest (`security/index.html:44`), AI inference configured against durable provider retention and no model training (`security/index.html:50`). Privacy scopes Customer Data processing to the EU/EEA (`privacy/index.html:145`); the new homepage follows the user's narrower EU wording. No specific region, model route, encryption algorithm, certification, end-to-end encryption or customer-held-key claim has been inferred.

Zero Data Retention is expressly scoped to AI providers' requests/responses. Firm Memory persists in Oakbase under the firm's control. The existing policy conflict below remains unresolved: the original legal pages still describe transient Service content and were not rewritten as part of this marketing change. The public GitHub Pages site is a labelled website concept with simulated enquiries; oakbase.ai and its policies remain unchanged. This update supersedes historical statements below that the preview is local-only or has no residency/retention messaging.

## Messaging update — 18 September 2026

The user has explicitly supplied Oakbase's positioning: persistent firm knowledge and relationship memory, prebuilt agents delivering Managed Operations and healthier records, and visibility/access control for people and agents. Current V2 copy follows that direction; `V2-MESSAGING.md` records it. The copy does not independently verify implementation. The preview remains local and illustrative, with no connected systems or live permission enforcement. Existing policies and the production site are untouched.

The source review below is historical. Its references to the Atlas example, the four-week headline and the earlier product-direction wording in the governance dialog have been superseded. The current example is Time Capture; governance describes the user-supplied capabilities, and the preview dialog identifies the local scope and product/policy release alignment. Earlier findings about transient-processing language still require reconciliation for public release; no claim that this has been resolved is made.

## Historical source review — 17 September 2026

Reviewed 2026-09-17, including the simplified V2. References below are relative to this checkout; unchanged current-site files were also inspected in `oakbase-production-release`. Public privacy, security and terms pages were checked at oakbase.ai. This is a source/documentation review, not an audit of the deployed product or its infrastructure. V2 references use current section IDs and JavaScript object names so they remain useful as formatting changes; the initial design is archived under `docs/archive/v2-initial/`.

## Policy-documented claims

| Statement supported by current documentation | Evidence |
| --- | --- |
| Customers select connected sources, permissions, enabled actions and autonomy. | `terms/index.html:145`; `security/index.html:45` |
| Customer Data is not used to train or improve Oakbase or third-party models. | `terms/index.html:147`; `security/index.html:50` |
| Professional review is required before consequential use; solely automated decisions with legal or similar effects are prohibited. | `terms/index.html:147` |
| TLS, encryption at rest, minimum integration permissions and logical customer isolation are described. | `security/index.html:44` |
| Exceptional human access must be authorised, limited and audited. | `security/index.html:45`; `terms/index.html:148` |
| Connected-service permissions and tool policies limit sources and actions. | `security/index.html:50` |
| Customers retain rights in their data. | `terms/index.html:149` |

These are **documented policies, not independently verified implementation guarantees**. The security introduction describes intended controls (`security/index.html:39`); role assignment and independent penetration testing include future-tense commitments (`security/index.html:43`, `security/index.html:46`). Do not turn these into certification badges or claims of completed independent audits.

## Existing policy conflict with persistent memory

The current privacy policy says connected content and AI inputs/outputs are transient and are not retained as Service content history (`privacy/index.html:144`, `privacy/index.html:146`). Security repeats this (`security/index.html:44`). Logs, metrics, traces and audit records exclude customer content, AI outputs and summaries (`security/index.html:47`); they do not establish an existing persistent memory implementation.

The terms say Oakbase is not a system of record or archive (`terms/index.html:146`, `terms/index.html:152`). A governed operational memory could coexist with customer systems of record, but its storage, scope and lifecycle need explicit definition. Persistent facts, decisions and derived relationships must not be silently treated as exempt from the existing transient-processing language.

Exact EU/EEA and deletion/retention statements exist (`privacy/index.html:145`, `privacy/index.html:146`). Their suitability for a new memory architecture was not established. V2 deliberately makes no new residency, retention-period, private-deployment or customer-managed-key promises.

## Independently checked in website source

- The current form targets a production CRM endpoint (`index.html:565`) and the legacy handler POSTs form fields, page URL and language without a localhost guard (`site.js:610`, `site.js:620`, `site.js:635`). Do not test it through an unguarded generic server.
- V2 loads its own script (`v2/index.html`, script `v2.js`); its `#assessment-form` submit handler only validates and displays a simulation message (`v2/v2.js`, final form listeners). Closing the enquiry dialog resets the form. No enquiry storage or network request is implemented.
- V2 blocks connections and form submissions through its CSP (`v2/index.html`, `Content-Security-Policy` meta element). The supplied local server applies equivalent restrictions to the comparison homepage and injects a capture-phase submission guard without changing current-site files (`tools/preview_v2.py:33`, `tools/preview_v2.py:58`, `tools/preview_v2.py:169`). It binds to loopback (`tools/preview_v2.py:207`). These observations are source checks; browser/endpoint verification is reported separately.
- Existing fonts are local (`agentic.css:1`). No analytics integration was found in the public website source; the privacy policy also states no analytics/tracking cookies (`privacy/index.html:148`).
- Existing EN/ES selection uses URL preference, local storage and browser language (`index.html:66`); translation updates content and metadata (`site.js:512`, `site.js:526`). Legal pages support both languages independently (`legal/legal.js:3`). V2 declares English and does not expose an incomplete language switch.

## V2 narrative review

No serious hierarchy, evidence or claim-qualification loss was found in the simplified `v2/index.html` and `v2/v2.js`. The hero gives the three-part relationship; `#platform` now has four visual layers: Work Signals, Firm Memory, Agents and Managed Operations. Work Signals represents authorised input from external systems, not a claim that those external systems are owned or secured by Oakbase. `details.signals` explicitly preserves the existing systems of record and distinguishes signals from permission to act. `.lean-governed` surrounds this proposed input-to-operation flow. The `layers` object clarifies authorised memory and agreed permissions. `#operations` retains commercial prominence and a common Firm Memory foundation.

The visible Atlas example (`#example`) labels its data illustrative and its stage review suggested rather than assumed. The `details.evidence` dialog preserves recorded/observed/interpreted distinctions, states that neither source confirms completion, and requires separate action authorisation. The `details.memory` dialog keeps matter, relationship and evidence perspectives together; relationship examples distinguish ownership, coordination, past collaboration and external expertise without performance scoring. Operation dialogs are labelled “Illustrative Managed Operation” and render context, delivered work and human control. The `details.operations` dialog qualifies the feedback loop as reviewed outcomes enriching memory for the next authorised operation; the page makes no model-retraining claim.

Qualifications now use progressive disclosure:

- The visible footer says **“Local concept · About this preview”** (`.lean-preview`).
- **About this preview** (`details.preview`) identifies the proposed architecture and illustrative examples, requires product validation, explains the conflict with transient processing, and lists retention, deletion, derived-context and permission-revocation review. It distinguishes the documented no-training policy from an independent implementation audit.
- **Our approach** (`details.governance`, reached from `#control`) expressly says proposed memory controls are not a claim of current availability and links existing policies.
- **Operation examples** identify their illustrative status and approval controls. The enquiry dialog and completion message state that nothing is sent, saved or booked.

The proposal qualification is less prominent than in the initial design, but remains present and accessible in the local concept. Preserve the footer and dialogs while evaluating the present-tense product story. This review does not clear the copy for public release; availability, contracts and control implementation still require the review below.

## Assumptions and review before production

1. Confirm availability of persistent entity/relationship memory, provenance, reconciliation and reusable context across operations. This website repository does not prove those capabilities are deployed.
2. Define source versus derived content, authorisation at retrieval/reuse/action time, matter boundaries, source revocation, deletion propagation, correction and retention. Validate the enforcement before using absolute permission slogans as guarantees.
3. Reconcile the privacy policy, security policy, DPA and service description with the memory lifecycle. Preserve the existing pages during local prototyping.
4. Validate each proposed operation and its approval/exception paths. All people, sources, operational states and contributed context shown in V2 are illustrative. No quantified customer outcomes were verified or added.
5. Keep the four-week offer scoped: it is inherited current marketing (`index.html:449`), not independently substantiated delivery evidence. V2 qualifies it with “Scope and system access agreed together” (`v2/index.html`, `#contact`).

No SOC 2/ISO certification, customer-managed keys, private deployment, automatic model retraining or unconditional confidentiality guarantee was established by this review.
