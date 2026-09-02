/**
 * Runtime style assemblers for the responsive layout trio (Stack,
 * LayoutContainer, LayoutItem). Each turns a component's props into the inline
 * custom-property set its stylesheet cascade reads — computed here rather than
 * in the component body, since the component bodies are generated. Each
 * generated component calls one assembler in its root node's
 * `style.$expression`; the static cascade lives in the component stylesheet.
 *
 * Shipped from `djui/scripts`. Framework-agnostic plain-object returns.
 */
import { expandResponsive, type Responsive } from './responsive';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'spread' | 'spaced';

const ALIGN_TO_CSS: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY_TO_CSS: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spread: 'space-between',
  spaced: 'space-around',
};

function defaultAlignFor(direction: StackDirection): StackAlign {
  return direction === 'row' ? 'center' : 'stretch';
}

/**
 * Stack's inline var set. `direction` is the only responsive prop; the
 * cross-axis `align` default tracks direction (`center` for row, `stretch` for
 * column), emitted per band in parallel so the alignment switches with the flow
 * direction across bands.
 */
export function stackStyle(
  direction?: Responsive<StackDirection>,
  align?: StackAlign,
  gap?: string,
  justify?: StackJustify
): Record<string, string | number> {
  let resolvedAlign: Responsive<StackAlign> | undefined = align;
  if (align === undefined && direction !== undefined) {
    if (typeof direction === 'string') {
      resolvedAlign = defaultAlignFor(direction);
    } else {
      resolvedAlign = direction.map((entry) => ({
        from: entry.from,
        to: entry.to,
        value: defaultAlignFor(entry.value),
      }));
    }
  }

  const style: Record<string, string | number> = {};

  Object.assign(
    style,
    expandResponsive<StackDirection>(
      direction,
      '--djui-component-stack--direction',
      '--djui-component-stack--direction',
      'column'
    )
  );

  Object.assign(
    style,
    expandResponsive<StackAlign>(
      resolvedAlign,
      '--djui-component-stack--align',
      '--djui-component-stack--align',
      'stretch',
      (v) => ALIGN_TO_CSS[v]
    )
  );

  if (gap !== undefined) style['--djui-component-stack--gap'] = gap;
  if (justify !== undefined) style['--djui-component-stack--justify'] = JUSTIFY_TO_CSS[justify];

  return style;
}

/**
 * LayoutContainer's inline var set. Two mutually exclusive modes: explicit
 * (responsive) `columns`, or intrinsic `minItemWidth` auto-fit. `gutter` is a
 * single length or `{ row, column }`. The `auto-fit`/`dense` modifiers are
 * class-level (handled in the template), not here.
 */
export function layoutContainerStyle(
  columns?: Responsive<number>,
  minItemWidth?: string,
  gutter?: string | { row: string; column: string }
): Record<string, string | number> {
  const style: Record<string, string | number> = {};

  if (minItemWidth !== undefined) {
    style['--djui-component-layout-container--min-item-width'] = minItemWidth;
  } else {
    Object.assign(
      style,
      expandResponsive<number>(
        columns,
        '--djui-component-layout-container--columns',
        '--djui-component-layout-container--columns',
        1
      )
    );
  }

  if (gutter !== undefined) {
    style['--djui-component-layout-container--gutter'] =
      typeof gutter === 'string' ? gutter : `${gutter.row} ${gutter.column}`;
  }

  return style;
}

/**
 * Sentinel encoding `"full"` inside a `span` band entry. The browser does NOT
 * clamp a span to the explicit grid — it grows the implicit grid to fit
 * (css-grid-1 §8.5) — so the stylesheet clamps it: `span min(<count>,
 * <the container's column count>)`, behind an `@supports` parse gate
 * (a browser without math functions in a grid line falls back to the
 * unclamped span). The stylesheet side lives in layout-item.ts.
 */
const FULL_SPAN_SENTINEL = 9999;

/**
 * LayoutItem's inline var set. Scalar `span="full"` is a modifier class
 * (`grid-column: 1 / -1`, handled in the template) and contributes no inline
 * style; everything else rides the span var, with band-array `"full"` encoded
 * via the clamp sentinel.
 */
export function layoutItemStyle(
  span?: Responsive<number | 'full'>
): Record<string, string | number> {
  if (span === 'full') return {};
  return expandResponsive<number | 'full'>(
    span,
    '--djui-component-layout-item--span',
    '--djui-component-layout-item--span',
    1,
    (v) => (v === 'full' ? FULL_SPAN_SENTINEL : v)
  );
}
