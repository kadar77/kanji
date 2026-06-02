# Contributing

Thanks for your interest in improving Kanji! This is a small project; issues and
PRs are welcome.

## Getting started

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build (the correctness gate)
npm run lint
```

There is no separate test runner — verify UI changes by running `npm run dev`
and exercising the affected page. To run the multiplayer game end-to-end, also
run [hayaoshi-server](https://github.com/kadar77/hayaoshi-server) locally and
set `VITE_HAYAOSHI_API`.

## Workflow

`dev` is the integration branch; `main` is production (auto-deployed).

1. Open an issue first for anything non-trivial so we can align on the approach.
2. Branch off `dev` and open your PR **against `dev`**. Keep PRs focused.
3. Make sure `npm run build` passes before pushing.
4. Match the surrounding code style (TypeScript, existing component patterns).

### Releases (maintainer)

Releases happen by promoting `dev` → `main`:

1. On `dev`, bump the version: `npm version <patch|minor|major> --no-git-tag-version`, commit.
2. Open a `dev` → `main` PR and merge it.
3. On merge, `main` deploys and CI tags `vX.Y.Z` + publishes a GitHub Release
   with auto-generated notes.

## Project conventions

- **State:** progress lives in a versioned Zustand store
  (`src/lib/progress.ts`). If you change the persisted shape, **bump `version`
  and extend `migrate`** — silent shape changes corrupt existing users' data.
- **Curriculum:** features that filter kanji take a `CurriculumRef`
  (`{ system, level }`), not a JLPT string.
- **Bilingual UI:** keep Mongolian behind `settings.showMongolian` and furigana
  behind `settings.showFurigana`; UI strings live in `src/lib/i18n.ts`.
- **Data:** the dataset (`public/data/`) is built by `scripts/*.mjs`. Re-running
  the pipeline preserves Mongolian via the translation cache — see `CLAUDE.md`.

See [CLAUDE.md](CLAUDE.md) for a deeper architecture overview.

## License

By contributing, you agree your contributions are licensed under the project's
[MIT License](LICENSE). Note the bundled dataset retains its own licenses (see
[ATTRIBUTION.md](ATTRIBUTION.md)).
