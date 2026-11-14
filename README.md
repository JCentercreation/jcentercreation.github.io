# The Engineer's Garage

Interactive 3D personal site — React + TypeScript + Vite + React Three Fiber, deployed to GitHub Pages.

```bash
npm install
npm run dev        # http://localhost:5173  (?lang=es, ?tier=full|reduced|fallback)
npm test           # content integrity (EN/ES parity, ids, book slots)
npm run build      # type-check + production build into dist/
```

- Content lives in `src/content/` (`shared/` = language-neutral facts, `en/` and `es/` = text).
- Plan, architecture and risks: [`docs/PLAN.md`](docs/PLAN.md). Outstanding inputs: [`docs/OUTSTANDING.md`](docs/OUTSTANDING.md).
- The previous site is kept at `/legacy/`.
