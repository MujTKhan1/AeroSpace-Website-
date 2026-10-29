# Mission Beacon — landing page

A single-page landing site built from the client's Website Architecture and 3D Direction brief. The hero is a dark space scene (dotted globe, atmosphere, orbit rings and the illustrative NASA Satellite Kit assembly on orbit). Everything below the hero is a light, editorial layout focused on the regulatory services.

## Run locally

Run `npm run dev`, then open http://127.0.0.1:4173/ . There is no build step or dependency installation. The deployable site is in `dist/` and all fonts, models and libraries are served locally.

## Page structure

Hero, the engineering-to-regulatory gap, four capabilities, baseline vs proposed (Rev A / Rev B), illustrative communications scenario, sample Regulatory Impact Assessment Digest (marked demo data), audiences, the six-stage method, principles, engagement models and the contact form with the information-security notice. Copy is taken from the client's Home, Capabilities, Method, Company and Contact tabs.

## Typography

Geist (body and headings), Instrument Serif italic (accent phrases) and Geist Mono (labels and technical metadata). All three are SIL OFL fonts, self-hosted from `dist/assets/fonts/`.

## Motion

- Lenis smooth scrolling, synchronised with GSAP ScrollTrigger.
- Hero entrance with masked line reveals; the light page slides up over the pinned hero while the globe zooms and dims.
- Word-by-word heading reveals, staggered card and row reveals.
- The gap connector draws in and breaks; the Rev A / Rev B view wipes with scroll; the digest document settles flat; the method stages scroll horizontally in a pinned section on desktop.
- `prefers-reduced-motion` turns off smooth scrolling, scroll animations and automatic 3D motion. A CSS globe is shown if WebGL is unavailable.

## Contact form

The form validates required fields in the browser but is not connected to an inquiry service. It tells the visitor that nothing was sent. Connect a server endpoint with server-side validation, spam protection and the approved privacy notice before launch.

## Key files

- `dist/index.html` — page markup and copy
- `dist/styles.css` — design tokens, layout and responsive styles
- `dist/main.js` — Lenis, GSAP ScrollTrigger animations, navigation and form
- `dist/space.js` — Three.js hero scene
- `dist/assets/satellite-kit/` — selected modular GLB parts

Sources, licences and modifications are recorded in [ASSET-REGISTER.md](ASSET-REGISTER.md). `npm run check` verifies JavaScript syntax.
