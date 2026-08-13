# VEGA — CCSD Local AI

VEGA is a student-built concept for district-operated educational AI, beginning with a proposed small, measured pilot.

## Presentation site

The homepage is now a complete 10-slide presentation system with two modes:

- **2:00 Pitch** — ten 12-second beats with competition-ready copy
- **10:00 Presentation** — the same visual story with expanded evidence and one minute per scene
- **Arrow keys / Page Up / Page Down** — change slides
- **Space** — start or pause the timed auto-advance
- **N** — reveal private speaker notes
- **F** — enter fullscreen
- **Swipe** — navigate on touchscreens
- **Try VEGA** — open the interactive product prototype

The deck includes speaker handoffs for Max, Mila, Sabrina, Rebekah, and Kaleb; a live timer; presenter notes; sourced photography; animated 3D graphics; an interactive mini-demo; and a rehearsable unison close.

## Product prototype

The `/prototype` route includes:

- Student, teacher, family, and staff workspaces
- Tutor, planning, translation, and navigation modes
- Device-local conversation history and multiple threads
- Sensitive-information checks and safety boundaries
- Official CCSD resource routing and answer citations
- Feedback, copy, export, themes, responsive navigation, and guided tour
- A secure server-side OpenAI adapter with automatic local demo fallback

See [FEATURES.md](FEATURES.md) for the full implementation checklist. No account or real student record is connected.

## Run locally

```bash
npm install
npm run dev
```

Then open the address printed by the development server.

## Production checks

```bash
npm run lint
npm test
```

## Optional live-model connection

The server-side adapter is at `/api/chat`. Copy `.env.example` to `.env.local`, add an API key, and restart:

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5.6
```

The browser never receives the key. Before every model request, the server applies VEGA's role, mode, privacy, academic-integrity, source, and under-18 rules. If the key is missing or the provider is unavailable, the interface falls back to the built-in demonstration engine.

A true local pilot would replace the external adapter with a district-hosted inference endpoint after CCSD security, privacy, legal, accessibility, and curriculum review.

## Research standard

The presentation intentionally does **not** claim that Google Workspace for Education uses school prompts to train outside-domain models. Google's current privacy documentation says it does not do so without permission. VEGA's case is instead about district-owned infrastructure, locally auditable controls, district-set retention, resilience, and a transparent pilot.

Primary references are linked directly inside the relevant slides:

- Merriam-Webster 2025 Word of the Year
- Google Gemini for Education documentation
- Google Workspace Generative AI Privacy Hub
- Southern Nevada Water Authority board materials
- CCSD Acceptable Use Policy

## Visual credits

- Von Tobel Middle School classroom — The Nevada Independent
- Lake Mead — Nikola Majksner / Unsplash
- Student collaboration — Unsplash
- Additional prototype photography — algoleague and Redmind Studio / Unsplash

## Important status

VEGA is an independent student concept. It is not an official CCSD product, deployment, or endorsement. Controls marked “proposed” are design requirements, not implemented district guarantees.
