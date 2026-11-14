# Outstanding content and assets

Kept up to date every phase (spec §16.11). Nothing below is invented in the app; missing items render as
"Details coming soon." / "Detalles próximamente."

## Content (owner)

- [x] Display name: **Javier Carrillo** (provisional, approved; change in `src/content/shared/owner.ts`).
- [ ] Photo (optional).
- [ ] Contact details / social links to show (old site had email, LinkedIn, GitHub).
- [x] Personal projects go in the MacBook (writingfree, necktimer, PROOF, Swift courses) — data in `src/content/shared/projects.ts`.
- [ ] Review the project descriptions (EN + ES), paraphrased from the previous site.
- [ ] Confirm the Swift course names: "Swift Concurrency Explained", "Swift Security Course" (inferred from their URLs).
- [ ] Banc Sabadell, Misfits Studio, Inditex, Banco Santander — descriptions (EN + ES).
- [ ] Specific Apple-platform projects.
- [ ] Nissan responsibilities + additional skills.
- [ ] SEAT detailed responsibilities + additional skills.
- [ ] Exact automotive projects.
- [ ] Review the Spanish translations of the SEAT and RFEDA descriptions and the Spanish welcome note (`src/content/es/index.ts`). Not final until approved.
- [ ] More books.
- [x] Sapiens author: Yuval Noah Harari (confirmed).
- [ ] Final domain (custom domain → `public/CNAME`).

## Assets (owner / sourcing)

- [ ] Official logos: Banc Sabadell, Misfits Studio, Inditex, Banco Santander, Nissan, SEAT, RFEA → `public/logos/`, then set `logo` in `src/content/shared/companies.ts`.
- [ ] Book cover images → `public/books/`, then set `cover` in `src/content/shared/books.ts`. Approval needed on the source (publisher covers via Open Library, or owner photos of their own copies).
- [ ] Optional per-book description / personal reflection (owner-written only).
- [ ] Think Different poster reference image.
- [ ] Tesla Model 3: model year/version; then a licensed 3D model.
- [ ] OBD port location / diagnostic setup for that version.
- [ ] Decision on purchased vs. custom models (MacBook, iPad, Tesla, Vomero Plus). No purchases without approval.
- [ ] Tesla: licensed model with separate driver door + usable interior (needs approval of source/cost).
- [ ] Network access to a CC0 texture source (e.g. Poly Haven) — currently blocked in the build environment, so the prototype uses generated materials.

## Repository settings (owner)

- [ ] GitHub → Settings → Pages → Source: **GitHub Actions** (required before merging to `main`; otherwise the old branch-based deploy would publish the raw source).
