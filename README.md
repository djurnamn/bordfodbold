# bordfodbold

A scoreboard for table foosball tournaments. A round-robin plan, a live
leaderboard, an info-screen view, and an admin that pushes every result to
every screen the moment it is entered.

Built for a Signifly case assignment. Built with AI tools, and I'm up front
about that; the design decisions and the review of what came out are mine.

## What it does

- **Board** (`/`) - the leaderboard and the tournament plan side by side, the
  teams with their members, and the latest results. Works on a phone.
- **Screen** (`/screen`) - the same data with nothing to tap: one 16:9 screen,
  type that scales with the display, a clock, and the next matches to play.
  Fits eight teams on a 1080p display without scrolling.
- **Admin** (`/admin`) - behind a PIN. Tap a cell to enter a result, replace
  one (with a second confirmation), clear one, or undo the last change. Add,
  edit and remove teams; rename the tournament; set goals to win, points per
  win, and whether each pairing plays once or twice.

Every change is logged with what it replaced, and the log is on the board.

## Run it

```
pnpm install
pnpm dev
```

Open http://localhost:3000. With no Convex deployment configured the app runs
on a local store: the tournament lives in the browser's storage and changes
reach the browser's other tabs instantly. The admin PIN is `1234`
(`NEXT_PUBLIC_ADMIN_PIN` changes it).

To run on Convex, so every device shares one tournament:

```
cd packages/app
npx convex dev          # creates the deployment and writes .env.local
npx convex env set ADMIN_PIN 1234
```

The app picks Convex whenever `NEXT_PUBLIC_CONVEX_URL` is set;
`NEXT_PUBLIC_STORE=local` forces the local store. `.env.example` lists every
variable.

Other commands: `pnpm test` (the domain and store tests), `pnpm e2e` (the
Playwright suite against the dev server), `pnpm type-check`, `pnpm build`.

## Deploy

The app is a Next.js project in a pnpm workspace; on Vercel, set the root
directory to `packages/app`. Two environment variables make a deployment:

- `NEXT_PUBLIC_CONVEX_URL` - the production deployment's URL, printed by
  `npx convex deploy` (run in `packages/app`); set `ADMIN_PIN` on that
  deployment with `npx convex env set ADMIN_PIN <pin> --prod`.
- `NEXT_PUBLIC_ADMIN_PIN_HINT` - optional, shown under the PIN field. Set it
  on a demo, not on a real one.

Functions are pushed with `npx convex deploy` whenever `convex/` changes; the
Vercel build itself only builds the app.

## How it is put together

A pnpm workspace with three packages.

`packages/domain` is the rules, as pure functions with no React and no I/O:
generating and reconciling the schedule, validating a score, computing the
standings, applying and undoing a change, reading a grid cell from a team's
side. Matches are the source of truth; the grid and the leaderboard are both
projections of the match list. Every rule has a test.

`packages/app` is the Next.js app. Views talk to a `TournamentStore`
interface - load, subscribe, and the commands - and never to storage or
Convex directly. Two adapters implement it: a local one over localStorage and
a BroadcastChannel, and a Convex one whose server functions check the PIN and
run the same domain functions before writing. Swapping the adapter changes
nothing above it.

`packages/ui` is the design-system layer: components copied out of
[djui](https://github.com/djurnamn/djui) and owned here, with the app's own
theme generated into tokens. App stylesheets read those tokens and author
only layout.

## Decisions worth knowing

The brief's example data does not reconcile: the grid has two different
results for each pairing, which reads as each pair playing twice, while the
leaderboard adds up to three matches, which reads as once. So "legs" is a
tournament setting, once by default. With one leg the two mirrored cells show
the same match from each side; with two, a cell shows the match its row team
hosted.

A game is played to a set number of goals, ten by default; the winner has
exactly that many and there are no draws. Three points per win. Ties break on
goal difference, then goals scored, then the head-to-head result, then name.

Access control is out of scope, but the brief asks that scores are not too
easy to manipulate. So: writes need a PIN that the server checks, replacing a
result asks twice, every change is logged with what it replaced, and the
board and screen views have no way to write at all.

## Limitations

One tournament per deployment; the data model carries a tournament id so a
list is a routing change, not a data change. The local store has no server to
check the PIN against, so it checks in the browser; the Convex store checks it
on the deployment. Optimistic updates are not implemented; Convex round trips
are fast enough that the lag is not visible in practice.

## Next

A tournament list and archive, a "now playing" state driven from the table,
and the design pass this prototype has not had yet.
