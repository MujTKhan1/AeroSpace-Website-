# Mission Beacon — landing page

A single-page landing site built from the client's Website Architecture and 3D Direction brief. The existing space hero, engineering-to-regulatory gap and footer are retained. The middle combines interactive spacecraft views, a cinematic change-to-evidence transition and a source-to-records scene, with an off-white editorial layout and a navy interlude.

## Run locally

Run `npm run dev`, then open http://127.0.0.1:4173/ . There is no build step or dependency installation. The deployable site is in `dist/` and all fonts, models and libraries are served locally.

## Page structure

Hero, engineering-to-regulatory gap, four interactive capabilities, baseline/proposed antenna assembly, illustrative evidence package, communications record dependencies and contact. The page prepares evidence and questions for authorised human reviewers; it does not make legal, classification or agency determinations.

## Typography

Space Grotesk (headings, numbers and the wordmark), DM Sans (body text) and Geist Mono (labels and technical metadata). All three are SIL OFL fonts, self-hosted: Space Grotesk and DM Sans from `dist/assets/font-*.ttf`, Geist Mono from `dist/assets/fonts/`. Heading accents change colour, not typeface.

## Motion

- Lenis smooth scrolling, synchronised with GSAP ScrollTrigger.
- Hero entrance with masked line reveals; the light page slides up over the pinned hero while the globe zooms and dims.
- In the gap section, the SSL-1300 satellite starts as a line drawing and becomes solid hardware part by part (reflectors, bus, fittings, then solar arrays) as the engineering record fills from Rev A to Rev B. On desktop (at least 900 × 640) the section holds still, sized to fit one screen, until this has played. The gap text then clears and the finished satellite flies (on a fixed overlay canvas) to its place in Capabilities, whose heading, orbit rings, labels and service cards build around it once it lands; scrolling back reverses this. During the flight the paper fades into space: a navy gradient with drifting stars and NASA's Earth horizon photograph rising into place, which stays behind the light-on-dark Capabilities section and ends at its lower edge. Phones and short screens keep the two sections separate, with the same space background on Capabilities.
- Capability selection turns the NASA SSL-1300 communications satellite and briefly separates its side reflectors; mouse dragging rotates it. A shared pause control stops ambient motion in the new 3D scenes.
- On desktop, the change/evidence stage stays in place. The old foreground dissolves, document sheets assemble, then the new heading and document text reveal independently. Scrolling back reverses the sequence; explicit forward/back controls are also provided.
- The navy scene draws 3D connections from an illustrative communications assembly to classification, spectrum and licence records, with travelling light pulses and document reveals.
- On mobile the change/evidence panels stack vertically.
- WebGL exhibits load near the viewport, share one source-model request and stop ambient rendering when hidden or paused. The new cropped antenna geometry is derived at runtime from NASA's supplied SSL-1300 mesh (bus and reflectors, without the solar arrays).
- `prefers-reduced-motion` turns off smooth scrolling, scroll animations and automatic 3D motion. A CSS globe is shown if WebGL is unavailable.

## Contact form

The form validates required fields in the browser but is not connected to an inquiry service. It tells the visitor that nothing was sent. Connect a server endpoint with server-side validation, spam protection and the approved privacy notice before launch.

## Key files

- `dist/index.html` — page markup and copy
- `dist/styles.css` — design tokens, layout and responsive styles
- `dist/main.js` — Lenis, GSAP ScrollTrigger animations, navigation and form
- `dist/space.js` — Three.js hero scene
- `dist/experience.js` — new Three.js exhibits, cinematic transition
- `dist/experience.css` — layouts and responsive styles for those sections

Sources, licences and modifications are recorded in [ASSET-REGISTER.md](ASSET-REGISTER.md). `npm run check` verifies JavaScript syntax.
