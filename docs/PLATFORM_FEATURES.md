# ElectionGuide Platform Features

ElectionGuide now exposes a civic platform layer around the core verified chat assistant.

| Feature | API | Purpose |
| --- | --- | --- |
| Verified Civic Chat | `/api/chat/sessions/{id}/ws` | Source-backed AI answers with transparent reasoning. |
| Voter Readiness Score | `/api/platform/readiness` | Scores preparedness across EPIC, roll status, polling station, ID, EVM/VVPAT familiarity, and accessibility needs. |
| Personalized Voting Journey | `/api/platform/journey` | Persona-aware journey steps for voters, candidates, volunteers, and NRI voters. |
| Polling Booth Guide | `/api/platform/booth-guide` | Practical before-you-go and at-the-booth guidance with accessibility support. |
| Election Knowledge Quiz | `/api/platform/quiz`, `/api/platform/quiz/submit` | Civic literacy questions, grading, and explanations. |
| Scenario Simulator | `/api/platform/scenario` | Decision paths for missing roll entries, nominations, MCC violations, and accessibility issues. |
| Civic Analytics Insights | `/api/platform/analytics/insights` | Non-sensitive engagement scoring and next-step recommendations. |
| Feature Catalog | `/api/platform/features` | Machine-readable list of platform capabilities for reviewers and clients. |

The platform layer is deterministic and testable. It complements Gemini-powered chat rather than replacing official verification requirements.

## Frontend Route Surface

The default route is now a landing page so evaluators immediately see ElectionGuide as a full civic platform, not only a chat window.

| Route | Purpose |
| --- | --- |
| `/` | Landing page with platform modules, Google Cloud signals, and auth entry points. |
| `/assistant` | Primary Gemini-powered chat workspace. |
| `/platform` | Platform overview, stats, features, and trust principles. |
| `/readiness` | Voter readiness workflow and API contract. |
| `/journey` | Persona-aware journey planning surface. |
| `/booth` | Polling-day preparation and accessibility guide. |
| `/quiz` | Civic literacy quiz surface and scoring contract. |
| `/scenarios` | Election scenario simulator overview. |
| `/resources` | Official election resources and safe external links. |
| `/architecture` | Google Cloud and service architecture explanation. |
| `/login`, `/signup`, `/auth/callback` | Google sign-in and account creation surfaces. |

## Persona Logic

Supported personas:

- first-time voter,
- returning voter,
- candidate,
- election volunteer,
- NRI voter.

The journey engine changes steps based on persona and election proximity. Candidate journeys include nomination and scrutiny preparation. NRI journeys include overseas elector verification.

## Test Coverage

Platform tests cover:

- feature catalog completeness,
- readiness scoring thresholds,
- persona-specific journeys,
- quiz difficulty and grading,
- scenario paths and official escalation hints,
- booth accessibility guidance,
- analytics insight generation,
- FastAPI route validation and response contracts.
