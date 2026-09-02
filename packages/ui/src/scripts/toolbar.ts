/**
 * Toolbar's runtime behaviour — the bits the generated Visuals can't express,
 * relocated here (the `djui/scripts` convention, sibling of `nextSort`) so the
 * three `ToolbarFrame`/`ToolbarGroup`/`ToolbarButton` drivers compose one pure
 * implementation and the unit tests exercise it directly (the measurement /
 * wrap-row / reflow logic needs a laid-out DOM that server-rendered output
 * never produces, and the live preview can't observe pixel widths).
 *
 * The measurement maths is framework-agnostic (ResizeObserver +
 * layout effects), so it lives here and each driver only owns the per-framework
 * observer wiring around it.
 */
export type ToolbarOrientation = 'horizontal' | 'vertical';

/**
 * Frame height (px) below which a horizontal toolbar is forced to a single row
 * (the outer `__layout` scrolls horizontally instead of wrapping). Captures two
 * button rows (1.75rem each ≈ 28px) + 1px gap + the default frame margin
 * (0.5rem each side ≈ 16px) + ~10px headroom; at/above it a wrapped second row
 * fits without clipping.
 */
export const TOOLBAR_SINGLE_ROW_THRESHOLD_PX = 80;

/**
 * Hysteresis thresholds for `ToolbarButton`'s icon-on-top reflow. Enter compact
 * mode at/below 80px; exit only when growing back past 110px — switching to a
 * column flex makes the button narrower, so a single threshold would oscillate.
 */
export const TOOLBAR_COMPACT_ENTER_PX = 80;
export const TOOLBAR_COMPACT_EXIT_PX = 110;

export interface ToolbarFrameMeasurement {
  /** The effective orientation (the override when given, else detected). */
  orientation: ToolbarOrientation;
  /** Force single-row + horizontal scroll (short horizontal frames only). */
  singleRow: boolean;
}

/**
 * Resolve a frame's orientation + single-row flag from its measured box. The
 * frame is vertical when taller than 1.5× its width; an explicit
 * `orientationOverride` wins for the resulting orientation but the *detected*
 * aspect still feeds the single-row decision (the `effectivelyVertical` flag).
 * The caller guards `width === 0` before measuring.
 */
export function measureToolbarFrame(
  width: number,
  height: number,
  orientationOverride?: ToolbarOrientation
): ToolbarFrameMeasurement {
  const isVertical = height / width > 1.5;
  const orientation = orientationOverride ?? (isVertical ? 'vertical' : 'horizontal');
  const effectivelyVertical = orientationOverride === 'vertical' || isVertical;
  const singleRow = !effectivelyVertical && height < TOOLBAR_SINGLE_ROW_THRESHOLD_PX;
  return { orientation, singleRow };
}

/**
 * The next compact (icon-on-top) state for a button of the given pixel width,
 * given its current state. Enters at `≤ENTER`, exits at `≤EXIT` — the
 * hysteresis band that prevents the column-flex narrowing from re-triggering.
 */
export function nextToolbarCompact(width: number, previousCompact: boolean): boolean {
  return previousCompact ? width <= TOOLBAR_COMPACT_EXIT_PX : width <= TOOLBAR_COMPACT_ENTER_PX;
}

const ROW_ATTRIBUTES = [
  'data-djui-row-first',
  'data-djui-row-last',
  'data-djui-row-start',
  'data-djui-row-end',
] as const;

function setRowAttribute(item: Element, attribute: string, present: boolean): void {
  if (present) {
    if (!item.hasAttribute(attribute)) item.setAttribute(attribute, '');
  } else if (item.hasAttribute(attribute)) {
    item.removeAttribute(attribute);
  }
}

/**
 * Stamp the wrap-row markers on a group's `__items` children so the per-corner
 * border-radius rules and the orphan-separator rules (in the Toolbar
 * stylesheet) can target the visual row positions the browser chose. The
 * browser decides row breaks at layout time; this reads them back via
 * `offsetTop` grouping and stamps four boolean attributes per item:
 *
 *   data-djui-row-first / -last   — in the first / last row
 *   data-djui-row-start / -end    — first / last in its own row
 *
 * Single-row layouts stamp first+last on every item and start/end on the first/
 * last — the same result the old `:first-child`/`:last-child` rules gave.
 * Vertical mode never wraps; any stale markers are stripped and it bails. These
 * are djui's own layout-derived `data-djui-*` markers (the sanctioned styling
 * carve-out), not a third-party runtime attribute.
 */
export function markToolbarRows(itemsElement: Element, orientation: ToolbarOrientation): void {
  const items = Array.from(itemsElement.children);

  if (orientation === 'vertical') {
    for (const item of items) {
      for (const attribute of ROW_ATTRIBUTES) item.removeAttribute(attribute);
    }
    return;
  }

  if (items.length === 0) return;

  // Group by offsetTop: each new offsetTop value starts a new row.
  const rowIndices: number[] = [];
  let currentTop: number | null = null;
  let rowIndex = -1;
  for (const item of items) {
    const top = (item as HTMLElement).offsetTop;
    if (currentTop === null || top !== currentTop) {
      rowIndex++;
      currentTop = top;
    }
    rowIndices.push(rowIndex);
  }
  const lastRowIndex = rowIndex;

  items.forEach((item, index) => {
    const row = rowIndices[index];
    const previous = index > 0 ? rowIndices[index - 1] : -1;
    const next = index < items.length - 1 ? rowIndices[index + 1] : -1;
    setRowAttribute(item, 'data-djui-row-first', row === 0);
    setRowAttribute(item, 'data-djui-row-last', row === lastRowIndex);
    setRowAttribute(item, 'data-djui-row-start', row !== previous);
    setRowAttribute(item, 'data-djui-row-end', row !== next);
  });
}
