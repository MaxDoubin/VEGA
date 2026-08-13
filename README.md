# VEGA — CCSD Local AI

VEGA is a competition-ready concept for private, district-run educational AI, beginning with a proposed South Career and Technical Academy pilot.

## Included

- Responsive campaign site and full-screen product prototype
- Student, teacher, family, and staff modes
- Policy-aware local demo engine with citations and privacy detection
- Persistent device-local conversations and exports
- Cinematic vision film and interactive Three.js 3D hero
- Licensed Unsplash classroom photography with attribution
- CCSD trusted-resource directory
- Safeguard architecture, pilot plan, research brief, and system prompt

## Run locally

```bash
npm install
npm run dev
```

## Production check

```bash
npm run build
```

## Demo-model integration

The UI deliberately uses a local deterministic demo engine. To connect an external model, add a server-only route that prepends `VEGA_SYSTEM_PROMPT.md` before every conversation. Keep credentials server-side, use synthetic data only, disclose the provider, rate-limit requests, and do not retain raw student prompts.

For a true local pilot, replace the adapter with district-hosted inference after security, privacy, legal, accessibility, and curriculum review.

## Photo credits

- [algoleague on Unsplash](https://unsplash.com/photos/Pg9gyIv5Oo0)
- [Redmind Studio on Unsplash](https://unsplash.com/photos/pfkknbsGuIc)

## Important status

VEGA is an independent student concept—not an official CCSD product, deployment, or endorsement. Proposed controls are design requirements, not district guarantees.
