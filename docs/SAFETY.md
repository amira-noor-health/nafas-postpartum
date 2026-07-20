# NAFAS prototype safety note

## Intended use

NAFAS is a Build Week prototype for postpartum recovery navigation, care coordination, and communication support. It is not a diagnostic device, clinical decision-support system, emergency service, or substitute for a qualified healthcare professional.

## Layered approach

### 1. Input and privacy gate

The API accepts bounded text input and rejects common direct identifiers such as email addresses and phone-like long numbers before any model call. The prototype instructs judges to use fictional or de-identified cases only.

### 2. Deterministic safety gate

Selected explicit red-flag phrases are matched before the model call. The gate returns **routine**, **urgent**, or **emergency**, plus matched rule identifiers. Automated tests cover Arabic and English cases and priority preservation.

An emergency match bypasses GPT completely and returns immediate human-help steps. An urgent match is preserved and supplied to the model; it cannot be downgraded.

### 3. Structured model output

GPT-5.6 Terra must respond against a strict JSON schema. The server prompt prohibits diagnosis, prescribing, medication changes, invented negative findings, and risk downgrading. Responses are requested with `store: false`, low reasoning effort, and a bounded timeout.

### 4. Human-facing uncertainty

The provider summary separates direct reports from the mother, concerns organized by the system, and facts that are still unknown.

### 5. Consent

The prototype prepares support messages and provider summaries but does not transmit them. Sharing requires an explicit user action.

## Threats considered

| Risk | Prototype mitigation |
| --- | --- |
| Model misses urgent language | Independent deterministic gate |
| Model or network call stalls | Bounded timeout and explicit safe fallback |
| Model invents a reassuring negative finding | Unknowns required in provider summary |
| Long output overwhelms the mother | Maximum four plan actions |
| AI output presented as diagnosis | Clear scope language and prompt constraints |
| Private key exposed in the browser | Server-only environment variable |
| Direct identifiers entered in the demo | PII gate rejects common email/phone patterns before analysis |
| API outage breaks the demo | Explicit deterministic demo fallback |

## Evaluation coverage

The repository includes 20 automated checks spanning Arabic and English routine, urgent, and emergency phrases; priority preservation; PII rejection; and allowed de-identified clinical numbers. These are engineering tests for the prototype, not clinical validation.

## Known limitations

The phrase list is incomplete, dialect coverage is limited, and no rule in this prototype has been clinically validated. Absence of a detected phrase does not establish safety. Real-world use requires formal clinical governance, local emergency routing, privacy engineering, adversarial evaluation, human-factors testing, and regulatory assessment.
