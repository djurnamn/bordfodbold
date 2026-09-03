# bordfodbold - notes for the review

The reasoning behind the prototype, for the people evaluating it. The README
covers how to run it and how the code is arranged; this is why it is the way
it is.

## Reading the brief

Three things in the brief shaped everything else.

The example data does not reconcile. The grid fills both cells of each
pairing with different scores (A-B 4-10, B-A 10-8), which is what a double
round robin looks like. The leaderboard sums to three matches (C 2-0, A 1-1,
B 0-2), which is a single round robin, and no cell shows A beating B even
though A has a win. Treated as illustrative, not as a spec. The consequence
is a data model where matches are a list and the grid and leaderboard are
projections of it, and where the number of legs is a setting rather than a
guess baked into the schema.

"Structure your code so it could receive data from a back-end service"
reads as: the front end may run on mocked data, but the seam must be real. So
the seam is the deliverable. Views depend on a store interface; a local
adapter with cross-tab push exists for development and for the offline case,
and a hosted adapter on Convex exists to show the seam holds with a real
service behind it. Both apply the same domain functions.

"Not too easy to manipulate" together with "no users or passwords" reads as
friction, not security. A PIN checked server-side on the hosted adapter,
a second confirmation before replacing a result, an undo, and a visible log
of every change with what it replaced. The read-only views cannot write.

## Assumptions

- A game ends at a set goal count (ten by default); the winner has exactly
  that many, the loser fewer; no draws.
- Three points per win, none per loss, matching the brief's leaderboard.
- Tie-breakers: points, goal difference, goals scored, head-to-head, name.
- Up to eight teams, one to four members each.
- One tournament is shown at a time. The model carries a tournament id so
  several can coexist later.

## Stack

Next.js 16 on Vercel, React 19, TypeScript, SCSS. Convex for the hosted
store: a reactive query pushes every change to every subscribed screen with
no pub/sub plumbing, its free tier does not pause an idle project the way
Supabase's does after seven days (a real risk for a demo someone opens a week
later), and deployment is one command. Playwright for the
end-to-end tests, vitest for the rules.

The components come from djui, a design system of my own, copied into the
repo and owned there rather than installed, so the repository installs
cleanly without a private package. The PIN field is a component I added to
djui for this: a row of single-character cells on a state machine that
handles focus, backspace, paste and selection, posting one value through a
hidden input.

## What the tests cover

- The rules: schedule generation and reconciliation when teams or legs
  change, score validation, standings and every tie-breaker, applying and
  undoing changes with the audit trail, grid cell orientation.
- The local store: seeding, the PIN lock, cross-tab notification, domain
  errors leaving data untouched, clearing, loading the demo data, and undo
  walking back through the history.
- End to end: a wrong PIN refused and a right one accepted; a result entered
  in the admin appearing on the board in another tab; replacing a result
  needing a second confirmation; undo; adding a team; saving settings; and
  the info screen fitting eight teams on a 1080p display with nothing
  scrolling or clipped.

## What I would do next

- A tournament list, so past tournaments stay readable.
- A "now playing" state set from the table, so the screen shows the match in
  progress.
- Optimistic updates in the provider; not needed at Convex's latency, but the
  seam is there.
- The design system's open items the review surfaced: a description seam on
  the Modal, a switch whose name does not swallow its description, a mode
  switch that says which mode is on.
- The PIN sits in the tab's session storage in plain text for the tab's
  lifetime. Fine for four digits and a demo; a real deployment would hold a
  session token instead.
