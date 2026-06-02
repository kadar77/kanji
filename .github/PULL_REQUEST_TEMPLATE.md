<!-- Thanks for contributing! -->

## What & why
Briefly describe the change and the motivation.

## How tested
- [ ] `npm run build` passes (tsc + vite)
- [ ] Exercised the affected screen(s) via `npm run dev`

## Notes
- If you changed persisted store shape, did you bump `version` + extend
  `migrate` in `src/lib/progress.ts`?
- If this touches `public/data/`, did you preserve Mongolian fields (see
  CLAUDE.md → Translation)?
