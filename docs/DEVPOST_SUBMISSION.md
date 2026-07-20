# Devpost submission — final copy

## Project name

NAFAS — Postpartum Recovery, Shared

## Elevator pitch

An Arabic-first AI companion that turns one honest postpartum story into a safety check, a six-dimension recovery map, a focused 24-hour plan, and one clear task for her care circle.

## Category

Apps for Your Life

## About the project

### Inspiration

After birth, a mother rarely experiences one isolated problem. Pain, fragmented sleep, feeding demands, nutrition, emotional distress, and inadequate practical support can arrive together. Yet she is often expected to identify, organize, explain, and solve each issue while exhausted.

As a clinical pharmacist, maternal-health creator, and mother, I wanted to build a different kind of postpartum tool: one that does not give an overwhelmed mother another library of advice. NAFAS starts with her unfiltered story, reduces decisions, protects safety boundaries, and makes recovery a shared responsibility.

### What it does

NAFAS accepts a fictional or de-identified voice or text check-in in Arabic or English and turns it into four connected outputs:

1. a deterministic safety priority that runs before the model;
2. a visual recovery-load map across physical recovery, sleep, mood, nutrition, infant feeding, and support;
3. a focused 24-hour plan with no more than four actions and a clear owner for every step; and
4. one ready-to-share task for the mother’s care circle, plus a clinician-ready summary that separates her own words from organized concerns and missing information.

Judge Mode includes three fictional scenarios—routine, same-day review, and emergency—so reviewers can see how the product changes its response as risk changes. An emergency phrase bypasses GPT completely and returns immediate human-help steps.

### How we built it

The product uses a layered pipeline rather than asking one model to do everything:

- a privacy gate rejects common direct identifiers before analysis;
- deterministic Arabic and English red-flag rules establish routine, urgent, or emergency priority;
- GPT-5.6 Terra uses the Responses API with low reasoning effort, `store: false`, and strict JSON Schema Structured Outputs;
- a responsive bilingual interface renders the output as a recovery fingerprint, shared 24-hour plan, care-circle handoff, and provider summary;
- a timeout-bounded safe fallback preserves a complete, explicit experience if the API is unavailable; and
- 20 automated Arabic/English safety and privacy evaluations check priority preservation and key prototype boundaries.

Codex helped transform my domain framing into a working public product: it scaffolded the implementation, converted safety decisions into deterministic tests, designed the strict output schema, built the bilingual mobile experience, iterated on latency and failure handling, and prepared the deployment and documentation.

### Challenges we ran into

The hardest challenge was preventing AI from appearing to be the source of clinical truth. We separated deterministic safety from generative personalization, required unknown information to stay visible, prohibited diagnosis and prescribing, and created an emergency path that does not call the model.

Arabic-first design added another challenge: the product had to accept natural Arabic while remaining immediately understandable to international judges. We built a full RTL/LTR Judge Mode and forced every structured output field into the selected language.

We also balanced quality with live-demo latency. GPT-5.6 Terra, low reasoning effort, lean prompts, strict output limits, progressive loading stages, and a bounded fallback created a fast and resilient judge experience.

### Accomplishments that we're proud of

- A public end-to-end product, not a static mockup.
- One mother check-in becomes a safety check, six-dimension recovery map, action plan, care task, and provider summary.
- Emergency language bypasses the model in approximately one millisecond inside the application pipeline.
- The interface exposes the execution path, latency, privacy gate, structured output, and no-storage status to judges.
- Twenty automated Arabic and English safety/privacy evaluations pass.
- The product remains simple for an exhausted mother while revealing technical depth in Judge Mode.

### What we learned

The most useful role for AI in postpartum recovery may not be generating more health information. It may be reducing cognitive load, preserving uncertainty, and coordinating one next action across the mother, her support network, and her healthcare professional.

We also learned that safety improves when model capability is bounded by deterministic gates, strict data structures, visible uncertainty, and clear human escalation paths.

### What's next for NAFAS

- evidence-reviewed pathways with qualified maternal-health professionals;
- broader Arabic dialect and adversarial safety evaluation;
- consent-led authenticated care-circle collaboration;
- longitudinal recovery-load trends;
- usability research with postpartum mothers and families; and
- privacy, security, clinical, and regulatory review before any real-world clinical use.

## Built with

Codex, OpenAI, GPT-5.6 Terra, Responses API, Structured Outputs, JavaScript, Web Speech API, JSON Schema, Node.js, ChatGPT Sites, HTML, CSS, RTL, Accessibility, Automated Testing

## Try it out

- Live demo: https://nafas-postpartum-2026.amiraabdalrazig.chatgpt.site
- Source repository: https://github.com/amira-noor-health/nafas-postpartum

## Testing instructions

1. Open the live demo on mobile or desktop.
2. Select **EN • JUDGE MODE**.
3. Choose **Same-day review** to see a live GPT-5.6 structured response, recovery map, 24-hour plan, care-circle handoff, and clinician summary.
4. Return home and choose **Immediate action** to see the deterministic emergency path bypass the model.
5. Please use only the supplied fictional, de-identified scenarios. Do not enter real personal or health information.

## Final submission checklist

- [ ] Select **Apps for Your Life**
- [ ] Add the live demo URL
- [ ] Add the public GitHub repository and MIT license
- [ ] Add the public YouTube demo under three minutes
- [ ] Add the Codex `/feedback` Session ID from the core build thread
- [ ] Upload 3:2 gallery images
- [ ] Confirm all text, video narration, captions, and testing instructions are available in English
- [ ] Test every link in a signed-out browser
- [ ] Submit before the deadline; do not leave the project as a draft
