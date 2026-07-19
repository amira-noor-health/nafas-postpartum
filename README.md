# NAFAS — Postpartum Recovery, Shared

> An Arabic-first AI companion that turns a mother's unfiltered postpartum story into safety checks, a focused 24-hour plan, and clear support tasks for her care circle.

NAFAS (نَفَس) is a working prototype built for the **OpenAI Build Week Challenge 2026** in the **Apps for Your Life** track.

## The problem

After birth, a mother may say “I’m tired” while facing pain, sleep deprivation, feeding difficulties, emotional distress, inadequate nutrition, and a lack of practical support at the same time. Existing tools often add articles and checklists to an already overloaded person.

NAFAS reduces cognitive load. A mother speaks or types naturally; the product organizes her experience into a small, actionable recovery plan and makes support a shared responsibility.

## Core experience

1. **Unfiltered check-in** — Arabic speech recognition or text, with no need to organize symptoms.
2. **Deterministic safety gate** — explicit red-flag rules run before generative personalization.
3. **GPT-5.6 structured analysis** — six recovery-load dimensions, up to three follow-up questions, and no more than four actions.
4. **Shared-care task** — converts “support her” into one clear task for a chosen care-circle member.
5. **Provider summary** — separates direct reports, organized concerns, and unknown information.
6. **Resilient demo mode** — a complete judge-friendly flow remains available if the API is unavailable.

## Why it is different

- **Arabic-first, not translated later:** accepts natural Arabic and culturally specific descriptions of postpartum distress.
- **Less work for the mother:** the output is limited to a 24-hour plan with four actions maximum.
- **Recovery as a system:** physical recovery, sleep, mood, nutrition, feeding, and support are shown together.
- **Support coordination:** tasks are moved to the care circle instead of added to the mother.
- **Source separation:** the provider view distinguishes what the mother said, what the system organized, and what remains unknown.

## Safety architecture

NAFAS is a recovery-navigation prototype, not a diagnostic or treatment tool.

- Deterministic red-flag matching is evaluated independently of GPT-5.6.
- The model receives the rule-engine result and is instructed never to downgrade it.
- The model may not diagnose, prescribe, change medication, or reassure away risk.
- Missing findings are explicitly represented as unknowns.
- No information is shared without the mother’s action and consent.

See [docs/SAFETY.md](docs/SAFETY.md) for the prototype threat model and limitations.

## Technology

- React 19 + Vite
- Node.js + Express
- OpenAI Responses API
- GPT-5.6 with strict JSON Schema output
- Browser Web Speech API
- Node test runner
- Responsive, RTL-first CSS

## Run locally

Requirements: Node.js 20+ and an OpenAI API key with API billing enabled.

~~~bash
npm install
cp .env.example .env
~~~

Set **OPENAI_API_KEY** in .env, then:

~~~bash
npm run build
npm start
~~~

Open http://localhost:3000.

Run the deterministic safety tests:

~~~bash
npm test
~~~

Never commit .env or an API key. The application reads the key server-side only.

## Judge demo

Select **“جرّبي حالة أم بعد قيصرية”** for a deterministic end-to-end demo. To see a live GPT-5.6 response, type or dictate a new check-in and choose **“افهمي يومي”**.

Sample Arabic input:

~~~text
من أمس جرح القيصرية يوجعني أكثر، ونمت ثلاث ساعات فقط. أبكي بدون سبب وأشعر أني أم فاشلة. الطفل يرضع طول الوقت وما أكلت إلا مرة واحدة اليوم.
~~~

Expected safety gate: **urgent**, rule: **wound**.

## How Codex accelerated the build

The founder is a clinical pharmacist, maternal-health creator, and non-technical builder. Codex turned her domain knowledge and lived postpartum experience into a runnable product during Build Week by:

- scaffolding the React/Node application;
- implementing the Arabic RTL product experience;
- converting safety requirements into a deterministic gate and automated tests;
- designing the GPT-5.6 JSON schema and server-only integration;
- iterating on mobile UX, fallback behavior, documentation, and deployment readiness.

The key human decisions remained clinical framing, product scope, cultural context, safety boundaries, recovery dimensions, and the principle that AI should transfer work away from the mother.

## Current prototype limitations

- Red-flag phrase coverage is intentionally small and is not clinically validated.
- Browser speech recognition support varies by browser.
- The sample profile is fixed for the Build Week demo.
- No user account, database, or persistent health record is included.
- The prototype has not undergone clinical-device validation or regulatory review.

## Roadmap

- Evidence-reviewed safety pathways with qualified maternal-health professionals
- Broader Arabic dialect evaluation
- Consent-led care-circle collaboration
- Longitudinal Recovery Load trends
- Usability testing with postpartum mothers
- Privacy, security, clinical, and regulatory review before real-world deployment

## License

Code is available under the [MIT License](LICENSE). The product name, clinical content, and visual identity are prototype materials and do not constitute medical advice.

