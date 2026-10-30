# Mission Beacon — landing page

A single-page landing site built from the client's Website Architecture and 3D Direction brief. The existing space hero, engineering-to-regulatory gap and footer are retained. The middle combines interactive spacecraft views, a cinematic change-to-evidence transition and a source-to-records scene, with an off-white editorial layout and a navy interlude.

## Run locally

Run `npm run dev`, then open http://127.0.0.1:4173/ . There is no build step or dependency installation. The deployable site is in `dist/` and all fonts, models and libraries are served locally.

## Page structure

Hero, engineering-to-regulatory gap, four interactive capabilities, baseline/proposed antenna assembly, illustrative evidence package, communications record dependencies, audiences, six-stage method, principles and contact. The page prepares evidence and questions for authorised human reviewers; it does not make legal, classification or agency determinations.

## Typography

Space Grotesk (headings, numbers and the wordmark), DM Sans (body text) and Geist Mono (labels and technical metadata). All three are SIL OFL fonts, self-hosted: Space Grotesk and DM Sans from `dist/assets/font-*.ttf`, Geist Mono from `dist/assets/fonts/`. Heading accents change colour, not typeface.

## Motion

- Lenis smooth scrolling, synchronised with GSAP ScrollTrigger.
- Hero entrance with masked line reveals; the light page slides up over the pinned hero while the globe zooms and dims.
- Capability selection turns the NASA Juno reference and briefly separates its dish; mouse dragging rotates it. A shared pause control stops ambient motion in the new 3D scenes.
- On desktop, the change/evidence stage stays in place. The old foreground dissolves, document sheets assemble, then the new heading and document text reveal independently. Scrolling back reverses the sequence; explicit forward/back controls are also provided.
- The navy scene draws 3D connections from an illustrative communications assembly to classification, spectrum and licence records, with travelling light pulses and document reveals.
- The six-stage method travels horizontally on desktop, with direct stage navigation. On mobile it becomes a touch-scrollable guide, and the change/evidence panels stack vertically.
- WebGL exhibits load near the viewport, share one source-model request and stop ambient rendering when hidden or paused. The new cropped antenna geometry is derived at runtime from NASA's supplied Juno mesh.
- `prefers-reduced-motion` turns off smooth scrolling, scroll animations and automatic 3D motion. A CSS globe is shown if WebGL is unavailable.

## Contact form

The form validates required fields in the browser but is not connected to an inquiry service. It tells the visitor that nothing was sent. Connect a server endpoint with server-side validation, spam protection and the approved privacy notice before launch.

## Key files

- `dist/index.html` — page markup and copy
- `dist/styles.css` — design tokens, layout and responsive styles
- `dist/main.js` — Lenis, GSAP ScrollTrigger animations, navigation and form
- `dist/space.js` — Three.js hero scene
- `dist/experience.js` — new Three.js exhibits, cinematic transition and horizontal method
- `dist/experience.css` — layouts and responsive styles for those sections
- `dist/assets/satellite-kit/` — selected modular GLB parts

Sources, licences and modifications are recorded in [ASSET-REGISTER.md](ASSET-REGISTER.md). `npm run check` verifies JavaScript syntax.
