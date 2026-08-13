# VEGA — CCSD Local AI

VEGA is a competition-ready concept for private, district-run educational AI, beginning with a proposed South Career and Technical Academy pilot.

## Included

- Responsive campaign site and product prototype
- Student, teacher, family, and staff modes
- Simulated, policy-aware chat flows with citations
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

## Demo-model integration

The current UI deliberately uses simulated responses. To connect an external model for a pitch, add a server-only chat route that prepends `VEGA_SYSTEM_PROMPT.md` to every new conversation. Keep API credentials server-side, use synthetic data only, disclose the external provider before message one, rate-limit requests, log safety events without retaining raw student prompts, and keep the visible “prototype” label.

For a true local pilot, replace the external adapter with a district-hosted inference endpoint after CCSD security, privacy, legal, accessibility, and curriculum review.

## Prototype capabilities

The `/prototype` route includes device-local conversation history, multiple threads, role workspaces, synthetic-data privacy checks, CCSD resource routing, tutoring behavior, Spanish-family support, citations, conversation export, and responsive mobile navigation. No account or real student record is connected.

## Photo credits

- Classroom collaboration: [algoleague on Unsplash](https://unsplash.com/photos/Pg9gyIv5Oo0), used under the Unsplash License.
- Laptop team: [Redmind Studio on Unsplash](https://unsplash.com/photos/pfkknbsGuIc), used under the Unsplash License.

## Important status

VEGA is an independent student concept. It is not an official CCSD product, deployment, or endorsement. Controls marked “proposed” are design requirements, not implemented district guarantees.
