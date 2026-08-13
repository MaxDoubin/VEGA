# VEGA — CCSD Local AI

VEGA is a competition-ready concept for private, district-run educational AI, beginning with a proposed South Career and Technical Academy pilot.

## Included

- Responsive campaign site and product prototype
- Student, teacher, family, and staff modes
- Policy-aware chat with a live OpenAI adapter and automatic local fallback
- Cinematic four-scene vision demo
- Original classroom and infrastructure imagery
- Licensed real-world classroom photography with creator attribution
- CCSD trusted-resource directory
- Safeguard architecture and phased pilot plan
- Research brief and reusable system policy prompt

## Run locally

```bash
npm install
npm run dev
```

Then open the port printed by the development server.

## Production check

```bash
npm run build
```

## Live OpenAI integration

The secure server-side adapter is implemented at `/api/chat`. Copy `.env.example` to `.env.local`, add an OpenAI API key, and restart the development server:

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5.6
```

The browser never receives the key. The endpoint applies VEGA’s role, mode, privacy, academic-integrity, source, and under-18 boundaries before every model request. If the key is missing, the API times out, or the provider returns an error, the interface automatically falls back to the built-in local demonstration engine.

For a true local pilot, replace the external adapter with a district-hosted inference endpoint after CCSD security, privacy, legal, accessibility, and curriculum review.

## Prototype capabilities

The `/prototype` route includes 50 implemented product features spanning four assistant modes, four audience workspaces, device-local conversation history, search, multiple threads, privacy checks, source routing, tutoring, lesson planning, Spanish-family support, citations, feedback, copy/export, theme controls, responsive navigation, and a guided tour. See [`FEATURES.md`](FEATURES.md) for the full checklist. No account or real student record is connected.

## Photo credits

- Classroom collaboration: [algoleague on Unsplash](https://unsplash.com/photos/Pg9gyIv5Oo0), used under the Unsplash License.
- Laptop team: [Redmind Studio on Unsplash](https://unsplash.com/photos/pfkknbsGuIc), used under the Unsplash License.

## Important status

VEGA is an independent student concept. It is not an official CCSD product, deployment, or endorsement. Controls marked “proposed” are design requirements, not implemented district guarantees.
