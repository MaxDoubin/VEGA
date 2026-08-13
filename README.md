# VEGA: CCSD Local AI

VEGA is Team Wònton's student-built concept for a private, district-operated educational AI for Clark County School District.

## Five-minute presentation

The homepage is one focused eight-slide presentation:

1. Team Wònton and VEGA
2. The AI slop problem
3. The working VEGA prototype
4. Air cooling and the student-designed identity
5. District-wide educator collaboration
6. Privacy and district control
7. The driving question and team strengths
8. The closing vision

Presentation controls:

- Click the slide, press Space, or use the right arrow to advance
- Use the left arrow to go back
- Click the timer button to start or pause the five-minute countdown
- The timer never changes slides automatically
- Press `N` to show the full speaker script
- Press `F` for fullscreen
- Press `R` to reset the deck and timer
- Swipe left or right on touchscreens

## Working prototype

The `/prototype` route demonstrates:

- Student, teacher, family, and staff views
- Tutor, Plan, Translate, and Navigate modes
- Device-local conversation history
- Privacy checks and sensitive-information boundaries
- CCSD trusted-resource links and source context
- Feedback, copy, export, theme, and guided-tour controls
- A secure server-side OpenAI adapter with a built-in local demonstration fallback

No account or real student record is connected.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm test
```

## Optional live-model connection

The server-side adapter is available at `/api/chat`. Add these values to `.env.local` and restart:

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5.6
```

The browser never receives the key. VEGA applies role, mode, privacy, academic-integrity, source, and under-18 rules before model requests. If the provider is unavailable, the interface uses the built-in demonstration engine.

A true local pilot would replace the external adapter with a district-hosted inference endpoint after CCSD security, privacy, legal, accessibility, and curriculum review.

## Important status

VEGA is an independent student concept. It is not an official CCSD product, deployment, or endorsement. Proposed safeguards and infrastructure are design requirements, not current district guarantees.
