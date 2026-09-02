/**
 * Surface's inline var set. A string `padding`/`radius` retunes the
 * instance's token var — the same var the stylesheet's fallback chain reads
 * (`--djui-surface-padding` / `--djui-surface-radius`), so the retune
 * cascades to the instance's own cells and nested surfaces exactly like the
 * global token would. Boolean forms (`false` = flush/square) ride the BEM
 * modifiers instead; `true`/`undefined` mean "the token".
 */
export function surfaceStyle(
  padding?: boolean | string,
  radius?: boolean | string
): Record<string, string> {
  const style: Record<string, string> = {};
  if (typeof padding === 'string' && padding !== 'inherit')
    style['--djui-surface-padding'] = padding;
  // `'inherit'` is the corner vocabulary's segment opt-in and has its own
  // mechanism (the `--radius-inherit` modifier); writing it into the token too
  // would bet the result on how a CSS-wide keyword survives `var()`.
  if (typeof radius === 'string' && radius !== 'inherit')
    style['--djui-surface-radius'] = radius;
  return style;
}

/**
 * Pin an element (and its subtree) to an absolute surface level. Returns the
 * `data-djui-set-surface` attribute record — spread it into any props seam that
 * forwards attributes onto a surface-carrying element (a table's per-region
 * cell props, a template region's props). Where a surface normally *steps* from
 * its surrounding context, `setSurface(n)` fixes it at level `n` instead, so a
 * region reads a designed absolute tone rather than one relative to wherever it
 * lands.
 *
 * On an element that also stamps its own context step, the pin wins: a
 * same-element set-surface beats the relative next-surface stamp, so pinning a
 * cell that already steps its context lands the cell (and its descendants) on
 * the pinned level cleanly.
 */
export function setSurface(level: number): Record<string, string> {
  return { 'data-djui-set-surface': String(level) };
}

// The stylesheet ladder's bounds, mirroring the generated surface selectors:
// pinned levels exist for `data-djui-set-surface="1"` through `"8"`, and a
// nesting chain of `data-djui-next-surface` stamps steps at most four levels
// past its base before the emitted chains run out.
const SURFACE_LEVEL_COUNT = 8;
const SURFACE_STEP_LOOKAHEAD = 4;

/**
 * The slice of `Element` the surface walk reads — attribute access plus the
 * parent chain. A DOM element satisfies it structurally; the walk itself is
 * DOM-free so it can run against any tree shaped like this.
 */
export interface SurfaceContextNode {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  readonly parentElement: SurfaceContextNode | null;
}

/** A `data-djui-set-surface` value the stylesheet has a rule for — an integer
 *  within the ladder. Anything else matches no selector, so the walk treats it
 *  as absent, exactly as the CSS does. */
function parseSurfaceLevel(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const level = Number(value);
  return level >= 1 && level <= SURFACE_LEVEL_COUNT ? level : undefined;
}

/**
 * The surface level an element actually reads — the runtime twin of the
 * stylesheet's context cascade. Walks the ancestor chain (the element
 * included): the nearest `data-djui-set-surface` pin is the absolute base
 * (the page root, with no pin above, is base level 1), and each
 * `data-djui-next-surface` stamp between the element and that base steps the
 * level up one. Matches the generated selectors' bounds: a step chain runs at
 * most four deep past its base, an element pinned *and* stamped resolves to
 * the pin, and nothing exceeds the ladder's top level.
 *
 * The stylesheet expresses this walk exactly through its per-pin `@scope`
 * section (each pin's reach limited at any descendant pin — nearest pin
 * wins); keep the two in step. A browser without `@scope` falls back to the
 * flat rules, which disagree with this walk only below nested *disagreeing*
 * pins — the outer pin wins there — and below a top-of-ladder pin.
 */
export function effectiveSurfaceLevel(element: SurfaceContextNode | null): number {
  let stepCount = 0;
  for (let node = element; node !== null; node = node.parentElement) {
    const pinnedLevel = parseSurfaceLevel(node.getAttribute('data-djui-set-surface'));
    if (pinnedLevel !== undefined) {
      return Math.min(
        pinnedLevel + Math.min(stepCount, SURFACE_STEP_LOOKAHEAD),
        SURFACE_LEVEL_COUNT
      );
    }
    if (node.hasAttribute('data-djui-next-surface')) {
      stepCount += 1;
    }
  }
  return Math.min(1 + Math.min(stepCount, SURFACE_STEP_LOOKAHEAD), SURFACE_LEVEL_COUNT);
}

/**
 * The surface level a portaled overlay should pin, measured from its trigger:
 * the trigger's effective level plus one. Portaling to `<body>` severs the
 * surface cascade, so an overlay panel cannot read its trigger's context the
 * way an inline surface would — this helper re-derives it by walking the
 * trigger's ancestor chain at render time. Returns `undefined` on the server
 * and whenever the trigger element is not in the document, so a caller's own
 * fallback (the configured overlay default) still decides those cases.
 */
export function overlaySurfaceForTrigger(
  triggerElementId: string | undefined
): number | undefined {
  if (typeof document === 'undefined' || triggerElementId === undefined) return undefined;
  const triggerElement = document.getElementById(triggerElementId);
  if (triggerElement === null) return undefined;
  return Math.min(effectiveSurfaceLevel(triggerElement) + 1, SURFACE_LEVEL_COUNT);
}
