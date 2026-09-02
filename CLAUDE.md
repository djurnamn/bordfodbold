# bordfodbold

Foosball tournament scoreboard, built for a Signifly case assignment. pnpm
workspace, three packages:

- `packages/domain` (`@bordfodbold/domain`) - the tournament rules as pure
  functions (schedule, validation, standings, applying a change, grid cells).
  No React, no I/O. Every rule has a test in `tests/`.
- `packages/ui` (`@bordfodbold/ui`) - djui components copied and owned via
  `npx djui add` (run from the local djui checkout), plus the Bordfodbold
  theme in `src/themes/bordfodbold.ts`. `pnpm theme:generate` writes the
  tokens to `src/styles/generated/`. Component files are a snapshot; change
  their SCSS rather than overriding it from the app.
- `packages/app` (`@bordfodbold/app`) - Next.js app router. Board, screen
  mode, admin. Convex functions live in `convex/`.

## Conventions

- No abbreviations in names; spell words out.
- Semantic BEM classes via `use-bem`; djui owns visual treatment, app SCSS
  owns layout. Component = `Name/index.tsx` + `Name/styles.scss`.
- Only `@use "styles/mixins"` (non-emitting) in component SCSS; the emitting
  layers are imported exactly once in the root layout.
- The data layer is a `TournamentStore` interface with swappable adapters;
  views never talk to Convex or storage directly.
- Writes are validated by the domain package on both sides of the wire.

## Commands

- `pnpm dev` - the app on http://localhost:3000
- `pnpm test` - domain tests
- `pnpm type-check` / `pnpm lint` / `pnpm build`
- `pnpm theme:generate` - regenerate the design tokens

## Commits

Björn commits himself. One line, imperative, no body, no trailers.
