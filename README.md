# NAFAS — Postpartum Recovery, Shared

> One honest postpartum story becomes a safety check, a six-dimension recovery map, a focused 24-hour plan, and one clear task for the care circle.

**Live judge demo:** https://nafas-postpartum-2026.amiraabdalrazig.chatgpt.site

NAFAS (نَفَس) is an Arabic-first, bilingual working prototype built during **OpenAI Build Week 2026** for the **Apps for Your Life** track.

## The problem

Postpartum recovery is not one symptom. A mother may say “I am tired” while carrying pain, fragmented sleep, feeding demands, low food intake, emotional distress, and inadequate practical support at the same time.

Most tools respond with more information for the mother to process. NAFAS takes the opposite approach: it reduces decisions, surfaces safety signals, and transfers one concrete piece of work to her care circle.

## The end-to-end experience

1. **Unfiltered check-in** — speak or type naturally in Arabic or English.
2. **Privacy gate** — direct identifiers such as emails and phone-like numbers are rejected before analysis.
3. **Deterministic safety path** — selected explicit red-flag phrases are checked before GPT is called.
4. **GPT-5.6 structured analysis** — strict JSON Schema returns exactly six recovery-load dimensions, up to three follow-up questions, and three or four actions.
5. **Recovery fingerprint** — a visual map shows physical recovery, sleep, mood, nutrition, infant feeding, and support together.
6. **Shared 24-hour plan** — every action has a time, owner, and low-cognitive-load instruction.
7. **Care-circle handoff** — the app turns “support her” into one ready-to-share task and previews the caregiver experience.
8. **Clinician-ready summary** — mother-reported information, organized concerns, and unknown facts remain visibly separated.

## Judge Mode

Select **EN • JUDGE MODE** in the live product, then choose one of three fictional, de-identified scenarios:

- **Routine recovery:** GPT-5.6 creates a focused shared plan.
- **Same-day review:** deterministic rules preserve an urgent signal while GPT organizes the next actions.
- **Immediate action:** the deterministic emergency path bypasses the model completely and returns immediate human-help steps.

The interface shows the active execution path, response time, privacy gate, deterministic safety check, structured output, and `store: false` status.

## What makes NAFAS different

- **Arabic-first, not translated later.** It is designed around natural Arabic postpartum language and can switch to a complete English judge experience.
- **Safety before personalization.** GPT is not asked to carry the whole safety burden.
- **Recovery as a system.** Six interacting dimensions replace isolated symptom tracking.
- **Less work for the mother.** The output is deliberately capped at four actions.
- **Support becomes observable.** One specific task is handed to the care circle instead of another suggestion being added to the mother.
- **Source is separated from inference.** The provider view preserves what was reported and labels what remains unknown.

## Technical architecture

NAFAS ships as a dependency-light JavaScript Worker with a server-rendered, responsive application and JSON API in one deployable artifact.

- OpenAI Responses API
- GPT-5.6 Terra
- `reasoning.effort: low` for a latency-sensitive workflow
- strict JSON Schema Structured Outputs
- server-only API key and `store: false`
- bilingual RTL/LTR interface
- browser Web Speech API
- deterministic safety and PII gates
- timeout-bounded safe fallback
- Node test runner with 20 Arabic/English safety and privacy evaluations
- ChatGPT Sites deployment

### Request flow

```text
Voice/text
   ↓
PII gate
   ↓
Deterministic red-flag check ── emergency → immediate human-help path
   ↓ routine / urgent
GPT-5.6 Terra + strict schema
   ↓
Recovery map + 24h plan + care task + provider summary
```

## Safety boundaries

NAFAS is a competition prototype for recovery navigation and communication support. It does **not** diagnose, prescribe, change medication, establish that someone is safe, or replace professional or emergency care.

- An emergency match returns without a model call.
- The model receives the deterministic priority and may not downgrade it.
- Missing safety findings must be represented as unknowns.
- The model may not invent a reassuring negative finding.
- Sharing requires an explicit user action.
- The prototype rejects common direct identifiers and does not store the model response.
- Real-world use would require clinical governance, broader Arabic-dialect evaluation, privacy engineering, human-factors testing, and regulatory review.

See [docs/SAFETY.md](docs/SAFETY.md) for the prototype threat model and limitations.

## Validate the source

Requirements: Node.js 20+.

```bash
npm test
npm run lint
npm run build
npm run validate
```

The OpenAI key is configured only in the hosted runtime. Never commit `.env` or an API key.

## How I collaborated with Codex

I am a clinical pharmacist, maternal-health creator, and non-technical founder. I brought the clinical framing, lived postpartum context, Arabic-language nuance, recovery dimensions, and the product principle that AI should remove work from the mother rather than add more advice.

Codex turned those decisions into a tested, public product during Build Week. It accelerated:

- product decomposition from an unstructured idea into a bounded end-to-end journey;
- the bilingual Arabic RTL and English judge experience;
- deterministic safety and privacy gates;
- the GPT-5.6 strict output schema and server-only integration;
- the recovery visualization, care-circle handoff, provider summary, and sharing interactions;
- automated Arabic/English safety evaluations;
- responsive mobile design, failure handling, documentation, and deployment.

The most important human decisions remained mine: the audience, unmet problem, clinical boundaries, cultural context, visual tone, what the model must never do, and the definition of meaningful support.

## Repository guide

- `worker/index.js` — complete UI, API, safety gate, GPT integration, and safe fallback
- `test/safety.test.js` — Arabic/English safety and privacy evaluation suite
- `docs/SAFETY.md` — threat model, mitigations, and known limitations
- `scripts/build.sh` — creates the deployable Worker artifact
- `scripts/validate-artifact.mjs` — validates the final artifact entrypoint

## Roadmap

- evidence-reviewed pathways with qualified maternal-health professionals
- broader Arabic dialect and adversarial safety evaluations
- consent-led, authenticated care-circle collaboration
- longitudinal recovery-load trends
- usability research with postpartum mothers and families
- privacy, security, clinical, and regulatory review before real-world deployment

## License

Source code is available under the [MIT License](LICENSE). The NAFAS name, clinical content, and visual identity are prototype materials and do not constitute medical advice.
