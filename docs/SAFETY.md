# NAFAS prototype safety note

## Intended use

NAFAS is a Build Week prototype for postpartum recovery navigation, care coordination, and communication support. It is not a diagnostic device, clinical decision-support system, emergency service, or substitute for a qualified healthcare professional.

## Layered approach

### 1. Deterministic gate

Selected explicit red-flag phrases are matched before the model call. The gate returns **routine**, **urgent**, or **emergency**, plus matched rule identifiers. Automated tests cover Arabic and English cases and priority preservation.

### 2. Structured model output

GPT-5.6 must respond against a strict JSON schema. The server prompt prohibits diagnosis, prescribing, medication changes, invented negative findings, and risk downgrading.

### 3. Human-facing uncertainty

The provider summary separates direct reports from the mother, concerns organized by the system, and facts that are still unknown.

### 4. Consent

The prototype prepares support messages and provider summaries but does not transmit them. Sharing requires an explicit user action.

## Threats considered

| Risk | Prototype mitigation |
| --- | --- |
| Model misses urgent language | Independent deterministic gate |
| Model invents a reassuring negative finding | Unknowns required in provider summary |
| Long output overwhelms the mother | Maximum four plan actions |
| AI output presented as diagnosis | Clear scope language and prompt constraints |
| Private key exposed in the browser | Server-only environment variable |
| API outage breaks the demo | Explicit deterministic demo fallback |

## Known limitations

The phrase list is incomplete, dialect coverage is limited, and no rule in this prototype has been clinically validated. Absence of a detected phrase does not establish safety. Real-world use requires formal clinical governance, local emergency routing, privacy engineering, adversarial evaluation, human-factors testing, and regulatory assessment.

