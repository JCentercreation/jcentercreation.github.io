# Asset register

Every third-party asset used by the site: source, terms and attribution. Nothing here was purchased.

## Company logos (`public/logos/`)

All files come from Wikimedia Commons, where they are tagged **public domain** (simple geometry/text below
the threshold of originality) and **trademarked**. Copyright does not restrict use; trademark law does: they
are used only nominatively — to identify the companies the owner worked for — unmodified, in original
colours and proportions, with no implied endorsement. No attribution is legally required; sources recorded
for traceability.

| Company | File | Commons page | Upstream source stated on Commons |
|---|---|---|---|
| Banc Sabadell | `sabadell.svg` | [File:BSabadell Logo.svg](https://commons.wikimedia.org/wiki/File:BSabadell_Logo.svg) | bancsabadell.com official SVG |
| Banco Santander | `santander.svg` | [File:Banco Santander Logotipo.svg](https://commons.wikimedia.org/wiki/File:Banco_Santander_Logotipo.svg) | brand.santander.com official asset |
| Inditex | `inditex.svg` | [File:Inditex logo black.svg](https://commons.wikimedia.org/wiki/File:Inditex_logo_black.svg) | inditex.com (retrieved 2022-08-01) |
| Nissan Motor Corporation | `nissan.svg` | [File:Nissan Motor Corporation 2020 logo.svg](https://commons.wikimedia.org/wiki/File:Nissan_Motor_Corporation_2020_logo.svg) | global.nissannews.com corporate logo (in use since 2020) |
| SEAT | `seat.svg` | [File:SEAT Logo from 2017.svg](https://commons.wikimedia.org/wiki/File:SEAT_Logo_from_2017.svg) | volkswagenag.com |

Notes:
- Nissan and SEAT: current corporate marks (Nissan 2020, SEAT 2017). The owner's tenure (2016–2019) partly
  predates the 2020 Nissan mark.
- **Nissan period logo (2001–2020):** found on Commons as
  [File:Nissan logo 2001.svg](https://commons.wikimedia.org/wiki/File:Nissan_logo_2001.svg) — tagged public domain,
  trademarked, "Nissan logo used between 2001 and 2020". Weaker provenance than the 2020 file: its stated source is a
  fan wiki (logos.fandom.com), not Nissan. Not downloaded yet: Wikimedia's file server answered HTTP 429 (rate limit)
  to every attempt from this environment. Awaiting the owner's choice of 2020 vs period mark.
- On dark interfaces (iPad) logos are placed on a white tile so their official colours stay legible.

**Still placeholders:**
- **Misfits Studio** — the owner's own studio; logo to be supplied by the owner (or read from the
  misfitsStudio repository with permission).
- **RFEDA** — not on Commons and no English/Spanish Wikipedia file found; the official site (rfeda.es) only serves raster
  images from its CDN (`back.ww-cdn.com`), which was not approved for this environment. No SVG exists publicly.
  Options: owner supplies the file, or approves that host for a raster (PNG/JPG) logo.

## Book covers (`public/books/`)

From the Open Library Covers API (covers are cover scans contributed to Open Library; publisher artwork is
copyright of the respective publishers). Used at small size to identify books the owner owns/has read —
customary practice; no endorsement implied. Verified title and author on each edition record.

| Book | File | Open Library edition | Cover ID |
|---|---|---|---|
| Sapiens: A Brief History of Humankind — Yuval Noah Harari | `sapiens.jpg` | [OL26234146M](https://openlibrary.org/books/OL26234146M) (Vintage, 2015, ISBN 9780099590088) | 15253569 |
| The Rise and Fall of the Dinosaurs: A New History of Their Lost World — Steve Brusatte | `dinosaurs.jpg` | [OL27333075M](https://openlibrary.org/books/OL27333075M) (William Morrow Paperbacks, 2019, ISBN 9780062490438) | 8797646 |
| The Emperor of All Maladies: A Biography of Cancer — Siddhartha Mukherjee | `emperor-maladies.jpg` | [OL26378019M](https://openlibrary.org/books/OL26378019M) (Scribner, 2011, ISBN 9781439181713) | 8068503 |

A library-copy scan (barcode + checkout sticker) was rejected for The Emperor of All Maladies in favour of the clean Scribner cover.
Open Library asks that heavy use of the Covers API be avoided; the files are stored locally, not hot-linked.

## Tesla Model 3 (pending)

Candidate: Sketchfab "2024 Tesla Model 3 + Interior" (tonielpro520), CC BY — see PLAN.md §8 and §9. To be supplied
manually by the owner; licence and attribution to be confirmed from the downloaded package's license file.

## Generated in code (no third-party rights)

Room and timber structure, garage doors, furniture, Apple workstation stand-ins (Studio Display, MacBook, iPad,
iPhone, Magic Keyboard/Trackpad), bookshelf, procedural Tesla stand-in, workshop, reading corner, running shoes,
poster placeholder, all textures (`src/scene/materials/proceduralTextures.ts`), storm shaders.
