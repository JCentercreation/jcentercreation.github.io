# Outstanding content and assets

Kept up to date every phase (spec §16.11). Nothing below is invented in the app; missing items render as
"Details coming soon." / "Detalles próximamente."

## Content (owner)

- [ ] Confirm display name — currently **"Javier Carrillo"**, taken from the previous site (`/legacy/`).
- [ ] Photo (optional).
- [ ] Contact details / social links to show (old site had email, LinkedIn, GitHub).
- [ ] Should the side projects on the old site (writingfree, necktimer, PROOF, Swift Concurrency / Security courses) appear in the garage? They are not in the spec.
- [ ] Banc Sabadell, Misfits Studio, Inditex, Banco Santander — descriptions (EN + ES).
- [ ] Specific Apple-platform projects.
- [ ] Nissan responsibilities + additional skills.
- [ ] SEAT detailed responsibilities + additional skills.
- [ ] Exact automotive projects.
- [ ] Review the Spanish translations of the confirmed SEAT and RFEA descriptions (`src/content/es/index.ts`).
- [ ] More books.
- [ ] Book author check: spec says "Yuval Noah Arari"; site uses the published spelling **Yuval Noah Harari**.
- [ ] Final domain (custom domain → `public/CNAME`).

## Assets (owner / sourcing)

- [ ] Official logos: Banc Sabadell, Misfits Studio, Inditex, Banco Santander, Nissan, SEAT, RFEA → `public/logos/`, then set `logo` in `src/content/shared/companies.ts`.
- [ ] Book cover images → `public/books/`, then set `cover` in `src/content/shared/books.ts`.
- [ ] Think Different poster reference image.
- [ ] Tesla Model 3: model year/version; then a licensed 3D model.
- [ ] OBD port location / diagnostic setup for that version.
- [ ] Decision on purchased vs. custom models (MacBook, iPad, Tesla, Vomero Plus).

## Repository settings (owner)

- [ ] GitHub → Settings → Pages → Source: **GitHub Actions** (required before merging to `main`; otherwise the old branch-based deploy would publish the raw source).
