# Mission Beacon landing page — design QA

Final result: passed

## Scope and visual truth

The user selected all three generated concepts as ingredients for one landing page and supplied a change/evidence screenshot with a specific in-place transition. The existing hero, gap section and footer are protected. The approved result combines the concepts rather than reproducing three alternative page layouts separately.

- Primary visual truth: `C:/Users/User/Documents/ChatGPT/AeroSpace Website/github-publish/documentation/change-evidence-reference.png` (1021 × 762 pixels).
- Concept sources: `C:/Users/User/.codex/generated_images/01a1872f-681b-76e0-b53f-954d1df60b86/exec-2085c196-2182-48a7-abb7-e2f5e31bda64.png`, `exec-7cffacfe-3b42-403b-908e-ddf5c35291e5.png` and `exec-709e38f6-fb4b-4f3b-bdbe-c56b758de623.png` in the same directory.
- Implementation: `http://127.0.0.1:4173/`, source checkout `github-publish`.
- Full comparison input: `C:/Users/User/Documents/ChatGPT/AeroSpace Website/mission-beacon-design-comparison.jpg`. The source's two stacked panels were cropped separately and compared with the matching change and evidence states. Aspect ratios are preserved, with letterboxing. The source is a stacked illustration; the implementation intentionally gives each state the same fixed desktop viewport.

## Captured implementation evidence

All following files are in `C:/Users/User/Documents/ChatGPT/AeroSpace Website/`.

| File | State | Capture pixels / CSS viewport |
| --- | --- | --- |
| mission-beacon-change-desktop.jpg | Change panel, Rev B with translucent Rev A | 1265 × 712 / 1280 × 720 |
| mission-beacon-evidence-desktop.jpg | Papers assembled and document text visible | 1265 × 712 / 1280 × 720 |
| mission-beacon-signal-desktop.jpg | Communications assembly, paths and record sheets | 1265 × 712 / 1280 × 720 |
| mission-beacon-method-desktop.jpg | Horizontal method guide | 1265 × 712 / 1280 × 720 |
| mission-beacon-capabilities-mobile-final.jpg | Entire spacecraft fits above two-column capabilities | 375 × 811 / 390 × 844 |
| mission-beacon-evidence-mobile.jpg | Sequential mobile evidence view | 375 × 811 / 390 × 844 |
| mission-beacon-tablet.jpg | Two-column capability list | 805 × 884 / 820 × 900 |
| mission-beacon-footer-final.jpg | Preserved footer, fully revealed | 1265 × 712 / 1280 × 720 |

The browser captures exclude viewport chrome/scrollbar pixels. Comparisons use the actual content image dimensions and preserve aspect ratio; this is a composition and interaction comparison, not a pixel-difference score. The paper capture was also inspected at full size for title, source, change, question and reviewer legibility. The source image itself was opened before implementation, and the source/implementation composite was opened before this report.

## Iteration history

1. **P1 — paper text remained hidden after assembly.** Browser observation showed the foreground disappearing and papers arriving while heading/document text stayed hidden. Explicit initial and final opacity/visibility states now reveal the heading, copy and document rows in sequence. The final evidence screenshot shows the corrected state; the reverse control was exercised.
2. **P2 — antenna isolation and framing.** Initial material-name extraction included solar array geometry and then loose foil patches. Filtering the actual supplied triangles to the central assembly and removing unused indexed vertices restored coherent bounds and a readable close-up. The final change screenshot shows a connected antenna/bus assembly and translucent baseline.
3. **P2 — mobile spacecraft crop.** Reduced the model fit at narrow widths. The final 390-pixel viewport capture shows all solar wings inside the scene. The document and capability layouts remain readable without page-width overflow.
4. **P2 — method anchor entered partway through its pin.** Aligned anchor navigation with the 64-pixel header and provided direct stage controls plus horizontal touch scrolling on mobile.
5. **P1 — upstream pins displaced the preserved contact pin.** A browser check exposed the contact section being fixed below the viewport. Explicit refresh priorities now refresh change and method pins before the footer pin, followed by a sorted refresh. The contact form was visibly reachable, its required-field validation was activated by keyboard, and the final footer screenshot matches the retained footer layout.

## Final checks

- Typography: existing self-hosted Space Grotesk, DM Sans and Geist Mono retained. Heading hierarchy, line wrapping, paper headings and source labels inspected on desktop and mobile.
- Spacing: open paper sections, four capability columns on desktop and two on mobile; no overlapping headline or document stack. Scene controls sit outside the paper content.
- Colour: existing paper/graphite/teal tokens retained, navy for the records interlude and restrained amber for proposed-change edges. No compliance scores, official seals or approval verdicts added.
- Imagery: real NASA Juno geometry is used, with documented runtime presentation changes. The original GLB is unchanged. The render differs from the concept's generated gold spacecraft, while retaining the existing site's credited NASA reference.
- Copy: the four exact service names and deliverable names are retained. Evidence sheets use selectable HTML and are labelled illustrative. The review question remains a question for authorised parties.
- Interaction: capability selection and its selected state, motion pause/play, baseline/proposed selection, forward and reverse change/evidence transition, method navigation, mobile navigation and mobile method navigation checked. The contact CTA reaches the form; required-field validation and focus on the first invalid field were checked. No test inquiry was sent.
- Responsive: desktop 1280 × 720, tablet 820 × 900 and mobile 390 × 844. No page-width overflow observed. Temporary browser viewport overrides were reset.
- Motion/accessibility: ambient rendering stops outside visible scenes and when paused/hidden. Reduced-motion branches remove the cinematic pin and auto-motion; this branch was inspected in code, not tested through an emulated OS preference. Buttons retain keyboard focus indicators. Static/WebGL-failure illustrations remain available.
- Preservation: compared the opening two sections and complete footer HTML against GitHub HEAD `d102cc5`; both unchanged. Base stylesheet and hero scene code are unchanged.
- Runtime: no console errors or warnings observed in the new scenes. `npm run check`, local asset resolution, unique HTML IDs and `git diff --check` passed.

## Remaining limits

The contact and notes forms retain their existing preview-only behaviour and have no connected delivery service. Reduced-motion and WebGL-failure branches were checked in source, without browser emulation of those conditions. Further 3D material refinement is optional polish.

No actionable P0/P1/P2 findings remain within the selected build scope.
