# The Engineer's Garage — Implementation Plan

Companion to the Master Project Specification v1.0. The spec is the source of truth; this file records
how it is being built and the trade-offs taken.

## 1. Repository findings (before Phase 1)

- `jcentercreation.github.io` is a GitHub **user site**, served at the domain root → Vite `base: '/'`.
- It held a single hand-written page (`index.html` + `styles.css` + favicons) and an unused `secondary.html`.
  The page is preserved verbatim at **`/legacy/`** (`public/legacy/`); `secondary.html` was a template leftover and was removed.
- Sibling project sites (`/misfitsStudio/`, `/PROOF-Image_Verification/`, `/SwiftSecurityCourse/`) are separate repos
  and are unaffected by this one.

## 2. Architecture

| Concern | Choice | Notes |
|---|---|---|
| App | React 19 + TypeScript (strict) + Vite 8 | |
| 3D | three r187, React Three Fiber 9, Drei 10 | Lazy chunk (~245 KB gz), never downloaded by the 2D fallback |
| Animation | GSAP (camera rigs, door hinge, book extraction) | From Phase 3 |
| State | Zustand (`src/app/store.ts`) | `locale` and `shot` are independent → switching language never moves the camera |
| Styling | CSS Modules + global tokens (`src/styles/global.css`) | |
| Content | `src/content/{en,es}` + `src/content/shared` | Typed schema; a test fails if ES/EN shapes diverge |
| Tests | Vitest (content integrity), Playwright for visual checks | |
| Deploy | GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`) | Builds on `main` only |

```
src/
  app/        store, content hooks
  content/    types.ts, shared/ (dates, logos, book slots), en/, es/
  lib/        capability tiering, storage, formatting
  scene/      GarageCanvas (renderer), GarageScene (+ future areas)
  ui/         Loader, Hud (language + back), Fallback (2D content page)
```

Planned scene modules (spec §12.1): `GarageScene`, `Lighting`, `Weather` (rain + lightning), `Window`,
`DeskArea`, `MacBook`, `IPad`, `Bookshelf`, `Book`, `Tesla`, `DriverDoor`, `DiagnosticLaptop`, `Poster`,
`RunningShoes`, `CameraController` + `cameraShots.ts` (one data record per cinematic shot).

### Device tiers (decided once at boot, `?tier=` overrides for testing)

- **full** — desktop: DPR up to 2, shadows, all effects.
- **reduced** — touch / small screen / ≤4 GB RAM: DPR ≤1.5, baked shadows only, lighter rain, no DoF.
- **fallback** — no WebGL2: content-first 2D page (`ui/Fallback.tsx`), with an opt-in "try 3D anyway".

### Device screens (MacBook, iPad, diagnostic laptop) — key trade-off

The three screens are real React DOM UIs (Notes, iPad portfolio, Windows-style window), not textures.
Proposed approach:
- **At a distance**: the screen shows a cheap static texture/glow (no live DOM in 3D).
- **When the camera arrives**: the React UI is mounted with Drei `<Html transform>` aligned to the screen plane,
  so it is crisp, selectable, accessible and keyboard-navigable.
Rendering live DOM into textures on every frame is avoided — it is slow and blurry and breaks accessibility.

## 3. 3D assets required

| Asset | Source options | Risk |
|---|---|---|
| Garage shell (walls, floor, window, ceiling) | Custom Blender model, lightmaps baked | Main visual-quality driver |
| Wooden desk, lamp, chair, notebook | Blender / CC0 (Poly Haven) | Low |
| MacBook Pro 14", iPad Pro, Apple Pencil, iPhone | Licensed models (Sketchfab / TurboSquid) or custom | Product-likeness; licence must allow web use |
| Floor-to-ceiling bookshelf + procedural books | Blender shelf; books generated in code from `books.ts` | Low |
| **Tesla Model 3**, dark metallic grey, **openable driver door as a separate node with correct hinge pivot**, interior with driver seat + steering column | Licensed model, re-rigged in Blender | **Highest risk**: size, licence, trademark, interior quality |
| Diagnostic laptop + OBD cable | Blender | Depends on confirmed vehicle version |
| Workshop tools, diagnostic cart, cables, chargers, headphones | CC0 / Blender | Low |
| Think Different (Einstein) poster | Owner-supplied reference image | Apple/Einstein image rights — personal use; owner's decision |
| Nike Vomero Plus (orange) | Licensed or custom model | Accuracy; trademark |
| Sea / rain / lightning | Shaders (no models) | Performance |
| HDRI / environment map | Poly Haven (CC0), night | Low |

Asset pipeline: Blender → glTF → `gltf-transform` (Meshopt or Draco geometry, KTX2/Basis textures,
texture resize) → `public/models/`. Target: **≤ 8 MB** for the initial overview, everything else lazy.

## 4. Technical risks

1. **Tesla model** — weight and licence. Must budget ~1.5–2.5 MB after compression; interior only detailed where the camera goes.
2. **Lighting cost** — real-time shadows from many lights is the usual frame-rate killer. Plan: baked lightmaps for the static
   room + 1 shadow-casting light (desk lamp) + lightning as a brief global intensity pulse (no extra shadow pass).
3. **Rain/sea** — one instanced/shader rain system outside the window only; sea as a single animated shader plane.
4. **DOM-in-3D screens** — `<Html transform>` must be mounted only when focused (see §2).
5. **Mobile** — GPU memory limits on iOS Safari; mitigated by the `reduced` tier (smaller textures, lower DPR).
6. **GitHub Pages** —
   - Pages source must be switched to **"GitHub Actions"** (repo Settings → Pages) before the first deploy.
   - No server-side routing → the app is single-URL with state in memory; `404.html` = `index.html` as a fallback.
   - No custom headers → can't set long-lived cache headers; Vite hashes filenames, which is enough.
   - Large GLBs are fine (100 MB per file limit) but should stay small for load time; Git LFS is **not** served by Pages.
   - Custom domain later = add `public/CNAME`; base path stays `/`.
7. **Trademarks/logos** — company logos must be official files supplied by the owner, stored as replaceable images.

## 5. Phases

| # | Phase | Status |
|---|---|---|
| 1 | Foundation: scaffold, Pages workflow, bilingual content system, loader, HUD, fallback | **Done, approved** |
| 2 | Visual prototype: room, materials, lighting, storm, desk, bookshelf, Tesla, workshop, decor + camera shots, transitions, welcome sequence | **Prototype done — awaiting review** |
| 3 | Final modelling / textures (Blender + licensed assets), visual polish | After review |
| 4 | MacBook interactive Notes portfolio (welcome, experience, skills, leadership, startups, personal projects) | |
| 5 | iPad Apple portfolio | |
| 6 | Tesla door + diagnostic laptop + Windows-style automotive portfolio | |
| 7 | Bookshelf interaction | |
| 8 | Poster, shoes, workshop details | |
| 9 | Optimisation, accessibility, cross-browser, publish | |

Owner decision (Phase 2): **no grey-box**. Go straight to an early visual prototype with approximate but
reasonably realistic provisional models, then replace modules with final assets after review.

## 6. Phase 2 prototype — what is provisional

Every area is its own module positioned from `src/scene/layout.ts` (which also derives every camera shot),
so a provisional model can be swapped for a GLB without touching the rest.

| Element | Module | Prototype | Intended final |
|---|---|---|---|
| Room shell, window, beams | `environment/Room.tsx` | Code-built, procedural brick / concrete / cement | Blender model with baked lightmaps |
| Materials | `materials/proceduralTextures.ts` | Generated at load (no downloads) | Scanned CC0 / authored PBR sets, KTX2 |
| Storm: sky, sea, rain, rain on glass, lightning | `environment/Outside.tsx`, `WindowGlass.tsx`, `storm.ts` | Shaders | **Intended final** (tuning only) |
| Lighting + reflections | `Lighting.tsx`, `Effects.tsx` | Real-time, 2 shadow casters, bloom/vignette | Mostly final; baked GI added later |
| Desk, chair, lamp, rug, mug, notebook, headphones | `desk/DeskArea.tsx` | Code-built | Blender |
| MacBook Pro 14", iPad Pro, iPhone, Pencil | `desk/*` | Code-built approximations | Licensed or custom models (approval) |
| Screen contents (Notes, iPad portfolio, Windows-style laptop) | `screens/screenTextures.ts` | Canvas previews from the content layer | Interactive DOM UIs when focused (Phases 4–6); previews stay for distance |
| Bookshelf frame + books | `bookshelf/*` | Code-built; seeded, stable arrangement; real books data-driven | Frame in Blender; arrangement logic **intended final** |
| Tesla Model 3 | `tesla/carGeometry.ts`, `Tesla.tsx` | Procedural body with real door opening, hinge, interior, laptop, OBD cable | **Licensed model** (approval), same door/interior contract |
| Workshop (tool chest, pegboard, cart, tyres, wall charger) | `tesla/Workshop.tsx` | Code-built | Blender / CC0 |
| Think different. poster | `decor/Poster.tsx` | **Neutral placeholder** (no Apple marks, no photo) | Owner-supplied image they may use |
| Orange running shoes | `decor/RunningShoes.tsx` | Code-built silhouette, no logos | Licensed / custom model (approval) |
| Camera director, intro, hover, door sequence | `camera/*`, `Interactive.tsx`, store | Implemented | **Intended final** (timing tuning only) |

Review helpers: `?shot=overview|desk|macbook|ipad|bookshelf|tesla|teslaLaptop`, `?intro=1`, `?lang=es`,
`?tier=full|reduced|fallback`.

## 7. Refinement pass (after the first prototype review)

- **Finishes:** window wall = board-formed concrete panels; brick only on the workshop wall (muted, reclaimed);
  limewash plaster behind the bookshelf; oak slat acoustic panel; exposed concrete soffit; polished concrete floor
  with saw-cut joints.
- **Lighting:** the ceiling batten is gone. Workshop = ceiling track with three small warm-neutral spots aimed at the
  car; indirect warm bounce from the soffit (cove); desk lamp + MacBook screen glow; arc floor lamp in the reading
  corner; shelf LEDs. Storm/window light unchanged.
- **Centre floor:** reading corner (lounge chair + ottoman, side table, arc lamp, fiddle-leaf fig, rug).
- **Desk:** MacBook keyboard deck + notch + screen glow; iPhone with dim lock screen; notebook + pen; AirPods case;
  charger; MagSafe, iPad USB-C and charger leads; single non-repeating 3-board oak top.
- **Bookshelf:** wider size spread, leaning books, flat stacks, bookends, muted palette, non-legible spine
  typography on anonymous books (no invented titles), catalogue books at fixed eye-level `place`s with titled spines.
- **Laptop UI:** full-width 2010–2020 timeline, three larger cards (most recent first), confirmed skills/events as
  chips, logo slots that render official files from `public/logos/` (placeholder until supplied).
- **Shoes:** real-size max-cushion silhouette (rocker midsole, orange knit upper, collar, laces), no logos.

## 8. Tesla Model 3 — asset investigation

Target contract (already implemented by the provisional car): separate driver door hinged at its front edge, usable
interior (driver seat, steering wheel, dashboard), room for the laptop on the seat and the OBD cable, dark metallic grey.

Findings (Nov 2026; model pages could not be opened from the build environment — sketchfab.com / turbosquid.com are
blocked by its network policy — so details come from search listings and must be verified on the pages):

| Option | Licence / cost | Interior | Driver door separate? | Notes |
|---|---|---|---|---|
| Sketchfab "2024 Tesla Model 3 + Interior" (tonielpro520) | Free, CC BY (credit required) | Yes (per title) | Unknown — inspect | ~168k triangles: OK for web after compression |
| Sketchfab "Tesla model 3 2024" (brandonleong28) | Free, CC BY | Unknown | Unknown | ~180k triangles |
| Sketchfab "Tesla Model 3 2020" (ItsDiyor) | Free, CC BY (to verify) | Unknown | Unknown | Pre-facelift body |
| Sketchfab "Tesla 2018 Model 3" (Ameer Studio) | Free, CC BY | Unknown | Unknown | ~684k triangles: needs heavy decimation |
| RenderHub "2024 Tesla Model 3" (MantangCG) | Listed as free (verify licence) | Listed "with interior" | Unknown | |
| TurboSquid "Tesla Model 3 2024 with HQ interior" (Nex3D) | ~$139 standard; Blender/FBX/OBJ variants from ~$79 | HQ interior | Yes — doors, hood, trunk, charge cap functional | **Editorial-use only** licence |
| CGTrader Model 3 listings (several sellers) | ~$59–$149, royalty-free | With interior | Some listed "rigged" / separate | Formats mostly BLEND/FBX/OBJ |

Assessment:
- **Door animation:** feasible with any of them. If the driver door is a separate object we animate it directly;
  if not, it can be split in Blender (cut along panel lines, set the pivot on the front hinge axis). Blender is not
  installed here, but `bpy` (Blender as a Python module) can be installed from PyPI for scripted, headless processing.
- **Interior:** free models vary; "+ Interior" listings normally include seats, wheel and dashboard, but quality and
  triangle budget must be checked in the file. Paid "HQ interior" models are reliably detailed.
- **Web budget:** target ≤ 2–3 MB GLB after Draco/Meshopt + KTX2; a 150–200k-triangle source is the sweet spot.
- **Licensing:** CC BY needs a visible credit (an attribution line in the site's footer/credits). Editorial-only licences
  (common for branded cars on TurboSquid) are generally acceptable for a personal, non-commercial portfolio but must be
  confirmed. Tesla's name and design are trademarks; we show the car as a personal object, without Tesla logos.
- **Recommended path (no cost):** the owner downloads 1–2 of the free CC BY candidates (a free Sketchfab account is
  required) and commits the GLB/zip to `assets-source/tesla/`; I inspect hierarchy, door separation, interior and
  triangle count, then split/rig/compress and swap it into `tesla/Tesla.tsx`. Alternatively the owner can allow
  `sketchfab.com` in this environment's network settings and provide a Sketchfab API token so I can fetch candidates.
- **Paid fallback (needs explicit approval):** the Nex3D model (functional doors + HQ interior), after confirming the
  editorial licence fits.

## 9. Tesla candidate verification (preferred: "2024 Tesla Model 3 + Interior")

Verified from the public Sketchfab page (download itself needs a free account, so the file has not been inspected yet):

| Check | Result |
|---|---|
| Licence | **CC Attribution 4.0** ("Author must be credited. Commercial use is allowed.") |
| Attribution required | "2024 Tesla Model 3 + Interior" by **tonielpro520** (sketchfab.com/tonielpro520), CC BY 4.0, link to licence, note that it was modified |
| Size | 167,747 triangles / 100,509 vertices — fine for the web after compression |
| Materials / textures | 46 materials, 37 textures (source: DDS, incl. 4K `EXT_skin`, `INT_OCC`, `INT_Screen`) — needs merging and conversion to KTX2/WebP at 1–2K |
| Formats | Source OBJ (23 MB) + MTL + DDS; Sketchfab also provides auto-converted **glTF and GLB** |
| Rig / animation | Not rigged, 0 animations (doors are not pre-animated) |
| Interior | Present: textures for occlusion, leather ×3, fabric, carpet, plastics, a screen + icons atlas → a modelled cockpit (seats, wheel, dashboard), likely game-quality — good for our camera distances |
| Driver door | **Unknown until the file is inspected.** OBJ groups decide whether it is a separate object; if merged it must be split |
| Camera compatibility | Depends on the door split and the interior behind it; to be checked with the inspection script + test renders |
| **Provenance risk** | The texture naming (`DAMAGE_GLASS`, `Rim_Blur`, `DISK_blur`, `EXT_skin`, `TEssuto`, `iconstesla`, `jw_` file prefix, DDS format) matches models extracted from racing games/mods, and the page credits no original author. If so, the uploader may not hold the rights to grant CC BY. **Recommendation: do not ship it without clearer provenance.** |

Alternatives checked the same way (all free downloads need a Sketchfab account):

| Model | Licence | Triangles | Materials | Notes |
|---|---|---|---|---|
| "Tesla model 3 2024" — brandonleong28 | CC BY | 179,692 | 17 | Source is a GLB (8.7 MB); compact material set; interior not stated; no provenance red flags in the metadata |
| "Tesla Model 3 2020" — ItsDiyor | CC BY | 176,714 | 5 | Pre-facelift body; source file `MDL14252_reversed.glb` resembles a stock-site product ID → provenance to check |
| "Tesla model 3" — dannzjs | CC BY | 684,315 | 37 | Too heavy; source named `tesla_model_x.glb` and description copied from Tesla marketing |
| "Tesla Model 3 – Ultra Detailed" — VTX_car | **CC BY-NC-SA** | 153,106 | 65 | Marked **rigged**; non-commercial + share-alike: acceptable for a personal non-commercial site, but our modified model would have to be offered under the same licence |

Next step (no cost, no token): the owner downloads the GLB of the preferred candidate and of brandonleong28's model and
supplies them; `node scripts/inspect-model.mjs <file>` then reports door nodes, interior parts, triangle/material/texture
budget and real-world size, followed by test renders of the door-open and laptop camera shots.

## 10. Tesla investigation — round 2 (owner: no tonielpro520 until provenance is clear)

Checked from the public model pages (sketchfab.com). The downloads themselves require a Sketchfab account, so
**door separation and interior detail cannot be confirmed without the file**; `scripts/inspect-model.mjs` is ready.

| | brandonleong28 "Tesla model 3 2024" | wintrez "Tesla M3 model" |
|---|---|---|
| Page | https://sketchfab.com/3d-models/tesla-model-3-2024-36c52f3f89f6439c90310f14e8ff33f2 | https://sketchfab.com/3d-models/tesla-m3-model-3a602469d7874d1397efa67182198705 |
| Licence | CC BY 4.0 (credit required, commercial use allowed) | CC BY 4.0 |
| Body | 2024 "Highland" refresh | Pre-facelift (2017–2023) |
| Triangles / vertices | 179,692 / 102,586 | 247,368 / 136,524 |
| Materials / textures | 17 / 7 | 23 / 0 (pure materials, no textures) |
| Source file | `2024_tesla_model_3.glb`, 8.7 MB | `teslaMSFullSketchfab001.blend`, 19 MB (Blender 2.82) |
| Rig / animations | none | none |
| Interior | not stated; 7 textures for a whole car suggests a simplified cabin | not stated |
| Description / credits | none | "Built in blender, no textures, pure materials" |
| Author history | account with a single published model, no bio | 4,759 downloads, published 2021 |
| Provenance | **Unclear** — no evidence of a rip, but no evidence of authorship either (single upload, GLB-only source, no notes) | **Best signal found** — native .blend authoring file + the author's own build note |
| Web budget (estimate) | GLB ~8.7 MB → ~2–3 MB after Draco/Meshopt + WebP/KTX2 | ~247k tris → decimate to ~150k; no textures → small GLB (~2–4 MB) |

Assessment:
- **brandonleong28:** a credible refresh-era body at a good size, but provenance cannot be established from the page;
  under the owner's rule (no questionable provenance) it should only proceed if the file itself carries authoring
  evidence (e.g. sensible object names, original materials) — to be checked on inspection.
- **wintrez:** best provenance of the free options; body is the pre-2024 Model 3 (the owner's model year is still to be
  confirmed — if the real car is pre-2024 this is the more accurate one). Being a Blender file, door separation is likely
  but must be verified.
- BlendKit "Tesla Model 3" (7K Studio) is listed as free, royalty-free, with interior — needs the BlendKit add-on and
  account to download; licence text not verifiable from here.
- Paid options are excluded per the owner.

Preview images: the 3D viewers on the two pages above are the previews. (Downloading the thumbnails into this
environment was blocked by the session's safety policy, so they are linked rather than embedded.)

Requested from the owner: download both GLBs (Sketchfab "Download 3D model" → glTF/GLB; free account) and push them to a
separate branch, e.g. `assets-tesla`, never to `main`. Then: inspection report, door split if needed, and test renders
of the door-open and laptop shots — before any integration.

## 11. Desk — Apple workstation (provisional)

- Studio Display 27" (`desk/StudioDisplay.tsx`): real proportions (623 × 362 × 30 mm, tilt stand, 478 mm overall), silver,
  behind the MacBook; dark Xcode-like editor with neutral sample Swift (`screens/screenTextures.ts`, kind `xcode`), drawn
  dimmer than the MacBook so it frames rather than competes.
- MacBook Pro 14" stays front and centre (welcome note; intro close-up unchanged); Thunderbolt cable to the display.
- Magic Keyboard + Magic Trackpad (`desk/Peripherals.tsx`) to the MacBook's right; iPad moved to the back right with its
  Pencil and USB-C cable; notebook + pen, iPhone, AirPods case, charger, lamp, mug. Headphones removed to avoid clutter.
- All positions live in `layout.ts` (`STUDIO_DISPLAY`, `KEYBOARD`, `TRACKPAD`, `IPAD`); camera shots follow automatically.

## 12. Direction change — modern American timber garage (owner, Nov 2026)

Implemented as a provisional prototype within the existing modules (no rebuild):

| Element | Module | Status |
|---|---|---|
| White-oak horizontal cladding (per-board tone variation, shadow gaps) on all walls | `environment/Room.tsx`, `woodCladding()` | Provisional (generated texture) |
| Oak tongue-and-groove ceiling | `ceilingPlanks()` | Provisional |
| Exposed glulam beams spanning the room + joists, black steel hangers, timber corner posts | `TimberStructure` (`TIMBER` in layout.ts) | Provisional geometry, layout intended final |
| Carriage-style double garage doors (vertical oak boards, glass lites, black steel strap hinges, pulls, steel lintel/jambs) behind the car | `environment/GarageDoors.tsx` (`GARAGE_DOOR`) | Provisional |
| Slim board-formed concrete plinth | `Plinth` | Provisional |
| Polished concrete floor, black steel window, storm/sea/rain/lightning | unchanged | Storm intended final |
| Brick wall, limewash, oak slat panel | removed (superseded by timber) | — |
| Poster | moved right of the window, still placeholder | Placeholder |
| Wall charger | between garage doors and window | Provisional |
| Ceiling bounce light so the timber structure reads at night | `Lighting.tsx` | Tuning |

Guard-rails for "contemporary, not rustic": pale, low-saturation white oak; straight, tight boards; glulam (not
rough-sawn) beams; black steel details; no X-bracing, no barn hardware patterns, no distressing.

Tesla: the in-scene car is still the **temporary code-built approximation**, now with slimmer 2024+-style light
signatures — it is not a Highland model and is not presented as one. Highland candidates (free): brandonleong28
(provenance unclear) and MantangCG on RenderHub (commercial studio offering a free 2024 Model 3 with interior; licence
not readable from this environment). wintrez (pre-2024) is a fallback only and would not be presented as a Highland.
Review helper: `?door=open` holds the driver door open.

## 13. Reference-render pass (owner's concept render, Nov 2026)

Goal: bring the live 3D scene close to the owner's concept render with real geometry/lighting (no image
backdrops), without changing functionality.

**Diagnosis before the change**
- Depth: the room was 10.6 × 9.3 m with the overview camera 8.8 m from the window wall → large, empty, deep.
- Brightness: hemisphere 0.6 + soffit cove bounce + floor bounce + 3 × 26 cd track spots + shelf wash rect +
  shelf LED strips + driver-side fill + arc floor lamp + environment 0.7 on every material.

**Composition** (all in `layout.ts`)
- Compact room 8.6 × 7.8 m, 3.3 m ceiling. Window (2.9 m, 4 × 2 lites) centred on the back wall with a timber
  casing and header; the desk set sits directly beneath it and is placed as one unit via `DESK_OFFSET` (desk-
  related shots follow automatically).
- Car on the left, backed in through narrower carriage doors (two rows of glazed panes) on the left of the back
  wall, nose to the viewer; wall charger between doors and window.
- Bookshelf (3 bays) on the right wall; framed B/W photograph of a trail runner between window and bookshelf.
- Heavy timber beams run front-to-back on black steel hangers at the back wall; plank ceiling above.
- Overview: longer lens (vertical FOV 42°), eye height 1.55 m, desk/window as the centre, car nose cropped left.
- Removed: reading corner (armchair, side table, arc lamp, plant, rug), Think-different placeholder (component kept,
  unmounted), diagnostic cart, tyre stack, ceiling track lights. Added: desk drawer pedestals, cognac leather chair,
  jute rug, desk plant, dark steel tool wall.

**Lighting** (`Lighting.tsx`, desk lamp in `DeskArea.tsx`)
- Key: desk lamp (warm, shadowed) + its soft spill. Cool fill: window rect light + storm directional with lightning.
- Faint cool rim spot on the car from the window side; Studio Display and MacBook screen glows.
- Ambient hemisphere 0.32 (was 0.6); environment 0.34, reflections only (window strip + faint lamp glow).
- Removed: shelf LEDs and wash light, all ceiling lights over the car, soffit and floor bounce cards, driver fill.
- Atmospheric fog for depth; deeper vignette; rain outside thinned so the sea reads.

**Still provisional:** all models/textures (procedural), the Tesla (temporary approximation, not a Highland model),
the photograph (procedural stand-in, needs a real image with rights), Misfits/RFEDA logos.

## 14. Phase 2 — interactive MacBook portfolio

How it works:
- Clicking the MacBook (or the "MacBook" keyboard place) flies the camera to the `macbook` shot. When the
  camera *arrives* (`arrivedShot` in the store, set by `CameraController`), a real DOM interface is mounted on the
  display with drei `<Html transform>` inside the lid group (`scene/desk/MacBookScreen.tsx`) — 1280 × 841 CSS px,
  scaled to the 298.5 × 196 mm display. Before arrival, and from a distance, the screen shows the matching canvas
  texture, so the hand-off is seamless.
- Phones / portrait screens (`lib/useViewport.ts`): the same interface opens as a full-screen sheet
  (`ui/macbook/PortfolioSheet.tsx`) and 3D rendering pauses while it is open.
- UI (`ui/macbook/Portfolio.tsx`, `notes.tsx`, `Portfolio.module.css`): a Notes-style app — folders · notes list ·
  note. Notes: Welcome (existing welcome note + "Explore my portfolio"), About me, Experience (timeline 2020 → today,
  expandable company entries with logos, anonymised startups card), Skills (4 groups), Side projects (cards →
  detail with status and external links).
- State (`app/store.ts`): `portfolio.{section, project, company}`. Independent of locale, so switching language keeps
  the open note/project and the camera. Entering the MacBook from the garage always starts on Welcome.
- Content (`content/{en,es}`, `content/shared/projects.ts`): `macbook.notes`, `labels`, `about`, `experience`,
  `skills`, `projectsHeading`, `projects`. The canvas texture uses the same notes list.
- Controls: mouse/touch; Tab; ↑/↓ in the notes list; Escape is layered (project → list, otherwise back to the
  garage); red traffic light / ✕ = close; "Back to the welcome note" in the toolbar. External links open in a new tab.
- Validation: scripted browser run (desktop 1440 × 810 + phone 390 × 844): 26 checks, all passing.
