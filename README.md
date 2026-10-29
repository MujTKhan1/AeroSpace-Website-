# Mission Beacon — hero concept

A hero-only aerospace design based on the client's Website Architecture and 3D Direction brief. Off-white editorial typography, a navy studio backdrop and restrained amber details frame one modular, interactive satellite.

## Run locally

Run `npm run dev`, then open http://127.0.0.1:4173/ . There is no build step or dependency installation. The deployable site is in `dist/` and all fonts, models, libraries and decoders are served locally.

## Hero interactions

- GSAP reveals the heading and introductory copy.
- Baseline and Proposed change buttons select two illustrative communications-module configurations on the same spacecraft assembly.
- Mouse drag or the Rotate view button changes the model's orientation.
- Pause stops automatic model motion. Reduced-motion preferences disable automatic movement and entrance animation.
- A matching static SVG is available when WebGL or model loading fails.
- Navigation opens concise prototype panels; no additional site pages are built.
- The high-level briefing form downloads a local note. It does not send an inquiry or store user submissions.

## Source and requirements

The hero communicates technical-regulatory intelligence and advisory support for qualified human reviewers. It makes no agency, NASA partnership, autonomous compliance, legal-determination or approval claim.

NASA/Ames Satellite Kit parts were inspected and assembled for the hero. Source credits, original file names, usage notes, modifications and fallbacks are recorded in [ASSET-REGISTER.md](ASSET-REGISTER.md). The original source-asset reference image is retained under `documentation/` and is not used as the hero image.

## Key files

- `dist/index.html` — hero, selectable HTML labels and prototype panels
- `dist/hero.css` — editorial composition and responsive styles
- `dist/app.js` — GSAP entrance, panels and briefing-note download
- `dist/scene.js` — studio lighting, spacecraft assembly and configuration interaction
- `dist/assets/satellite-kit/` — selected modular GLB parts
- `dist/assets/licenses/` — local licence files

`npm run check` verifies application JavaScript syntax. Desktop, phone, configuration switching and navigation are also checked in the browser.
