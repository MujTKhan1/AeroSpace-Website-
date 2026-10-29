# Mission Beacon

A focused, responsive aerospace hero concept with a custom Three.js satellite, procedural planet, orbital paths, and GSAP headline reveals.

## Preview

Run `npm run dev` and open `http://127.0.0.1:4173`.

The deployable website lives in `dist/`; no build or dependency installation is needed. Fonts, Three.js 0.170.0, and GSAP 3.12.5 are served locally.

## Interactions

- Drag the satellite with a mouse to adjust its orientation.
- Pause or play the orbital animation using the circular control.
- Reduced-motion preferences disable automatic motion and text reveals.
- Navigation and the main action open concise, keyboard-accessible content panels.
- The briefing form downloads a note locally. It does not send a message or collect submitted data.
- A static illustration remains visible when WebGL is unavailable.

## Design

Space-black and muted green surfaces, warm white typography, signal-lime accents, Space Grotesk display type, and DM Sans body type. The copy positions Mission Beacon as technical-regulatory intelligence and advisory support for qualified human reviewers.

The wordmark and satellite are original visual concepts for this prototype. No agency seals, fabricated credentials, clients, or performance claims are included.

## Files

- `dist/index.html`: hero, navigation and supporting panels
- `dist/style.css`: visual design and responsive layout
- `dist/app.js`: GSAP entrance, accessible panels and local briefing note
- `dist/scene.js`: custom 3D satellite, planet and orbit

`npm run check` validates the application JavaScript syntax.
