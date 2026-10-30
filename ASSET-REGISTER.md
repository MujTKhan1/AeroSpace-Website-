# Landing page asset register

Target page for all entries: Home (hero orbit, baseline/proposed comparison, digest thumbnail and contact section). All configurations are illustrative visual assemblies, not flight designs or Mission Beacon client projects.

## NASA Satellite Kit — selected modular geometry

Source: https://science.nasa.gov/3d-resources/satellite-kit/

Repository: https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Satellite%20Kit

Source credit: NASA/Ames Research Center. Source terms reviewed at https://www.nasa.gov/nasa-brand-center/images-and-media/ and https://github.com/nasa/NASA-3D-Resources . Repository describes these assets as free and without copyright; NASA media use conditions apply. No NASA logo, seal, affiliation, endorsement, approval, or agency authority is represented.

| Original file | Local file | Role | Modifications |
|---|---|---|---|
| Satellite Kit body 3.glb | dist/assets/satellite-kit/body-3.glb | Common baseline and proposed spacecraft body | Recentered and rescaled; width/depth adjusted for a compact illustrative bus; neutral/gold thermal materials; structural fittings, radiator and antenna details added |
| Satellite Kit wings 2.glb | dist/assets/satellite-kit/wings-2.glb | Common paired solar arrays | Recentered and rescaled to a 6.35 scene-unit span; array orientation adjusted for the three-quarter presentation; locally authored solar-cell and metal materials |
| Satellite Kit radio 2.glb | dist/assets/satellite-kit/radio-2.glb | Baseline communication assembly | Recentered, rescaled and mounted on the common body; neutral materials; added smooth parabolic reflector, rim and feed struts |
| Satellite Kit radio 3.glb | dist/assets/satellite-kit/radio-3.glb (retained; not loaded by the current page) | Proposed communication assembly | Same presentation process; larger asymmetric module and reflector; restrained amber edges identify the illustrative changed assembly |

Parts were downloaded and their nodes, bounds, materials and reference assembly inspected before selection. They are modular source pieces, not a complete hero. The assembled three-quarter views were checked in-browser. Scene units and geometry are illustrative, with no claimed engineering dimensions or performance implications.

Reference image: documentation/satellite-kit-reference.png, from the same NASA repository. Used for assembly inspection only, not displayed as a hero asset.

Static illustrations: dist/assets/satellite-fallback.svg (baseline, Rev A) and dist/assets/satellite-proposed.svg (proposed, Rev B) are locally authored schematic illustrations of the assembled concept, used for the same-camera comparison, the digest thumbnail and the contact section. In the hero, the assembly (body 3, wings 2, radio 2) is shown small on an orbit around a procedurally generated dotted globe. Reduced motion renders a still frame; if WebGL is unavailable a CSS globe is shown.

## NASA Juno 3D model — engineering exhibits

Source: https://science.nasa.gov/resource/juno-3d-model/ (direct file: https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/j/Juno.glb, glTF dated Sep 9, 2023)

Source credit: NASA Visualization Technology Applications and Development (VTAD), as stated on the NASA page. Usage follows the NASA Images and Media Usage Guidelines linked from that page (https://www.nasa.gov/nasa-brand-center/images-and-media/): NASA media is generally not subject to copyright in the United States, may be used for informational purposes, and must not imply NASA endorsement. No NASA logo, insignia or endorsement is used.

| Original file | Local file | Role | Modifications |
|---|---|---|---|
| Juno.glb (9,185,648 bytes) | dist/assets/juno/Juno.glb | Interactive spacecraft, baseline/proposed illustration and signal-to-records scene (dist/experience.js) | Source file retained unmodified. At runtime the spacecraft is centred and scaled, dish nodes separate for the capability animation, and copies of the supplied geometry are filtered to isolate the central antenna/bus assembly. A translucent baseline copy and amber edge overlay distinguish the illustrative comparison. |

Presentation: Juno is an illustrative engineering reference, not a Mission Beacon project or flight-design comparison. The capability view carries a NASA Juno caption; the preserved footer credits NASA VTAD and states that NASA does not endorse Mission Beacon. Lighting uses Three.js RoomEnvironment and neutral studio lights. Capability selection and mouse dragging rotate the model without capturing touch scrolling. Desktop and mobile share one lazy model request; hidden views stop ambient rendering. Reduced motion initially shows still frames and removes pinned motion. If loading or WebGL fails, the existing supplied satellite SVGs remain visible. No engineering values or performance conclusions are inferred from the meshes.

The evidence sheets and record documents are selectable HTML content transformed in perspective. They are clearly illustrative, with no approval seals, fabricated numerical specifications or claims of regulatory determination. The connector tubes, scan rings and travelling light points are procedural Three.js presentation effects, not live telemetry.

## Locally authored materials and lighting

Solar-cell texture, foil texture, environment map, radiator, reflector refinements and structural fittings are created procedurally in dist/scene.js. The hero globe, stars and orbit rings are generated procedurally in dist/space.js. No external HDRI, stock texture, AI-generated raster image, or mission-specific spacecraft identity is used. Lighting is neutral studio illumination.

## Type and runtime assets

- Space Grotesk (400, 500) and DM Sans (400, 500, 600): SIL Open Font License; local TTF files served from dist/assets/ (font-5/6 and font-1/2/3). Geist Mono (Vercel, 400 and 500): @fontsource npm distribution; SIL Open Font License; local woff2 files served from dist/assets/fonts/.
- Three.js 0.170.0, GLTFLoader, DRACOLoader, BufferGeometryUtils, OrbitControls and RoomEnvironment: official Three.js distribution (the addons are from the three@0.170.0 npm package, with their `three` import rewritten to the local ./three.module.js); MIT licence.
- Draco decoder: distributed with Three.js, upstream Google Draco; Apache 2.0 licence.
- GSAP 3.12.5 and ScrollTrigger 3.12.5: official npm distribution; original licence headers retained.
- Lenis 1.1.13 (smooth scrolling): npm distribution; MIT licence.

Runtime licence/source notices are in dist/assets/THIRD-PARTY-NOTICES.md. No original NASA geometry is claimed as Mission Beacon intellectual property.
