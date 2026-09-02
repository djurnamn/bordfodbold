import type { DjuiConfig } from "./types";

/**
 * The structural, palette-agnostic slice every theme is built over. It owns
 * what is unlikely to differ between `default` and `reaper` — the
 * alpha ramp, the shadow tokens, component sizes, and the size cascade
 * (`components` ⟂ `componentGroups`). A theme spreads `baseConfig` and adds the
 * theme-owned domains: `colors`, `typography`, and `fontFamily`.
 *
 * The exact base/theme field split is refined as the themes are built; today it
 * is the four structural collections below.
 */
export type DjuiBaseConfig = Pick<
  DjuiConfig,
  "alpha" | "shadows" | "components" | "componentGroups" | "breakpoints" | "layers"
>;

export const baseConfig: DjuiBaseConfig = {
  // The named responsive bands (previously hardcoded in `styles/helpers.scss`,
  // with a partial duplicate in `global.scss`). Compile-time: the generator
  // emits them as the `$djui-breakpoints` SCSS map in the generated config
  // partial — a theme that retunes them recompiles its CSS (the per-theme
  // build matrix already does).
  breakpoints: {
    xsmall: "22.5rem",
    small: "45rem",
    medium: "67.5rem",
    large: "90rem",
    xlarge: "112.5rem",
  },

  // Shared defaults for the form family (TextInput/NativeSelect/Textarea). The
  // members size from `--djui-component-group-form--size` unless they pin their own
  // `components.<Name>.size` (none do by default), so retuning this one token
  // moves the whole family.
  //
  // The box knobs: `paddingX` states the kit's side-padding convention — a
  // fixed `1rem` at every scale, independent of the em-derived heights (the
  // chain's own floor is the legacy `calc(0.25rem + 0.25em)` expression; a
  // theme restates it to restore the em coupling, or sets any other value).
  // `height` and `radius` stay deliberately unset: their built-in expressions
  // (`2em`, `0.5rem`) are the defaults — one number scales the control — and a
  // theme states a different convention per family or per component.
  //
  // `colors` holds the family's color roles (token references, not literals) with
  // the palette's "root default, per-mode override" shape:
  //   - `focus` points at the theme-wide **default accent** (`accent-default`,
  //     itself `accent-primary` unless `accentDefault` retargets it), so the focus
  //     ring tracks the same accent as links and uncolored components.
  //   - `accent` is the CSS `accent-color` idea — the one token that colors the
  //     checked/active state of every control (checkbox fill, radio dot, switch
  //     on-track, slider range, progress bar). It points at the same default
  //     accent as the focus ring, so a checked control and its ring speak one
  //     color. A theme leaves it unset to fall back to the controls' built-in
  //     `foreground-primary` default.
  //   - `inputBackground` defaults to the recession channels — `recessed-surface`
  //     (dark, and single-mode themes) and `raised-surface` (light) — so the
  //     fill always sits two levels off its context. A theme retargets either,
  //     per mode or shared, with an absolute level if it wants one.
  componentGroups: {
    form: {
      size: "1.5rem",
      paddingX: "1rem",
      colors: {
        focus: "accent-default",
        accent: "accent-default",
        // Relative to the control's context, resolved per pinned level by the
        // cascade: a box that reads sunk into its surface in dark mode, lifted
        // off it in light mode — two levels away either way, flipping to the
        // other side when the ladder has no room (see the generator's
        // relative-surface notes). Was `surface-1` / `foreground-contrast`,
        // two absolutes an input could disappear against at the wrong depth.
        inputBackground: "recessed-surface",
        light: { inputBackground: "raised-surface" },
        // `inputBackgroundNonInteractive` is deliberately unset: the inert twins
        // fill like the live controls unless a theme states otherwise.
      },
    },
    // The portaled-overlay family (Popout, Menu, the Select listbox). Its members
    // share a runtime default surface level: portaling severs the surface cascade,
    // so an overlay pins an absolute level rather than inheriting the wrong one.
    // `surface` is a runtime prop default (a literal `data-djui-set-surface`, not a
    // token — an attribute selector can't read a var), delivered via the `props`
    // channel and read with `componentDefault('component-group-overlay', 'surface')`.
    // A per-instance `surface` prop overrides it; one step above the page by default.
    //
    // The trigger-anchored members (Popout, Menu, the Select listbox, Tooltip)
    // measure their trigger and pin one above it, so this value is only their
    // fallback when that measurement is unresolvable. Modal has no trigger to
    // measure, so it is Modal's operative level — and Modal therefore reads
    // `components.Modal.props.surface` first, letting a theme whose page sits
    // deeper than the kit's state the modal level without moving the others'
    // fallback with it.
    overlay: {
      props: { surface: "2" },
    },
    // The layout family (Stack, LayoutContainer). One gutter for their gaps,
    // read under each member's own token (`components.Stack.gap`,
    // `components.LayoutContainer.gutter`), so a theme states one value and
    // gaps move together — and, unless the theme separates the two, together
    // with the surface padding: a gap between cells and the inset inside one
    // are the same measure by default.
    layout: {
      gutter: "var(--djui-surface-padding, 1rem)",
    },
  },

  // Per-component size defaults — one rem value each, no longer hardcoded in
  // component SCSS. An instance `size` prop overrides via the same
  // `--djui-<name>-size` var inline. `Icon` carries the shared icon-family
  // defaults (fallback Visuals + @djui/lucide, sized via the `.DjuiIcon` rule).
  components: {
    Badge: { size: "0.75rem" },
    // `variant` states the kit's resting fill. It matches the floor in Button's
    // own resolution chain (same convention as the size values above: the config
    // states the knob, the component floors it with the same value), so a
    // consumer who never runs `configureComponentDefaults` still gets a button
    // that paints. Without a floor somewhere, an unbootstrapped store leaves the
    // resolved variant undefined and every fill rule ungated — a transparent
    // button, and a `color` with nothing to tint.
    Button: { size: "1rem", props: { variant: "solid" } },
    Spinner: { size: "1rem" },
    Icon: { size: "1.5rem", strokeWidth: 2 },
    // The tooltip arrow's rotated-square side. A square of side s rotated 45°
    // pokes out s/√2, so 0.625rem yields a ~0.44rem visible arrow height.
    Tooltip: { arrowSize: "0.625rem" },
    // The modal window's surface level. Modal has no trigger to measure, so
    // unlike the anchored overlays it takes a stated level rather than
    // trigger+1; two steps above the family fallback puts the window clearly
    // above the page chrome it dims (a header at 4 reads level with it, a card
    // cell inside the window at 5). See `componentGroups.overlay` below.
    // The window's frame. Top-anchored at a fixed offset (a window holds
    // still as its content grows; its title is in view when focus lands); the
    // frame tightens under `small`. The window widths are the breakpoint
    // lengths themselves (`width="small"` = the `small` band, 45rem), so the
    // window and the viewport share one vocabulary.
    // `internal/modal-placement-research.md` is the evidence.
    Modal: {
      offset: "4rem",
      gutter: "2rem",
      offsetSmall: "1rem",
      gutterSmall: "0.5rem",
      props: { surface: "4", placement: "top", width: "small" },
    },
    // The dashboard shell's frame. One width for its navigation, rail and
    // off-canvas panel alike (the panel reads it too, falling back to the
    // Drawer's width); a shell that wants the two to differ assigns the token
    // per band. The inset frame is screen-dependent, so it is stated only from
    // the band that has one — its `0rem` floor rides the reader's `var()`
    // fallback. Both used to be restated in `base.scss` after the config load,
    // in the same layer, where a theme's value could never win.
    DashboardTemplate: { navigationWidth: "15rem", frameWidth: { large: "1rem" } },
    // The control-sized components — each value matches the Visual's `var()`
    // floor, so emitting the token changes nothing today and makes the size a
    // config knob. Members of the form family carry no `size` here on
    // purpose — they size from `componentGroups.form.size`. That includes the
    // box-shaped controls (Checkbox/Radio/Switch, whose Visuals chain
    // per-component token → family size → 1.5rem floor), not just the
    // text-entry ones (TextInput/NativeSelect/Textarea, Combobox/Select): a
    // literal here would sit in the per-component slot and cut the family
    // knob out of the chain.
    Avatar: { size: "2.5rem" },
    Menu: { size: "1rem" },
    Tabs: { size: "1rem" },
    // Slider's thumb and track sizes; Progress's track (its `size` is derived
    // from the track in the Visual, so no `size` knob here).
    Slider: { thumbSize: "1.25rem", trackSize: "0.375rem" },
    Progress: { trackSize: "0.5rem" },
    // The minimum height of a data/key-value row's cells — shared by the two
    // table components so both breathe the same. The Visuals carry the same
    // value as their hard `var()` floor, so emitting the token changes nothing
    // today and makes the row height one themable knob each.
    Table: { rowMinHeight: "2rem" },
    HorizontalTable: { rowMinHeight: "2rem" },
  },

  // Box-shadow design tokens, parsed into parts by the generator so the
  // `djui-shadow` mixin can rotate them — e.g. for the 45° arrow tip. Three
  // rungs: `default` (resting surfaces), `overlay` (floating panels — menus,
  // popovers, listboxes), `heavy` (modals).
  //
  // Shadow color is a palette-token reference with the scoped-colors shape
  // (root default, per-mode override): cast from the scale's base in dark and
  // single-mode themes, from the foreground ink in light mode — so shadows
  // stay palette-agnostic here while following each theme's actual tones.
  shadows: {
    default: {
      lengths: "0 0.125rem 0.5rem",
      color: { token: "surface-1", alpha: 0.1 },
      light: { token: "foreground-primary", alpha: 0.1 },
    },
    // The overlay lift — Popout / Menu / Tooltip / Modal and the arrow tip all
    // cast this. It shares the `heavy` value: a floating panel wants the strong
    // separation from the page, so the two are one shadow in the default theme
    // (kept as distinct tokens a theme can still fork apart).
    overlay: {
      lengths: "0 0.25rem 1rem",
      color: { token: "surface-1", alpha: 0.2 },
      light: { token: "foreground-primary", alpha: 0.2 },
    },
    heavy: {
      lengths: "0 0.25rem 1rem",
      color: { token: "surface-1", alpha: 0.2 },
      light: { token: "foreground-primary", alpha: 0.2 },
    },
  },

  // Opacity steps for the fill/selectable mixins. `soft*` tints over the
  // foreground (neutral), `tint*` over the current color (accent) — two ramps
  // because a gray tint and an accent tint read differently at the same alpha.
  // The alpha unit: every alpha the kit paints is a whole number of these,
  // stated as steps on the component/group tiers (`fillAlpha`, `idleAlpha`)
  // over the kit's floors (a wash at step 1, hover +1, active +2, a tint one
  // over the wash; an idle row's ink at step 10). See helpers.scss "Alpha".
  alpha: {
    unit: 0.0625,
  },

  // The stacking ladder — consecutive whole integers, lowest to highest, the one
  // place raw `z-index` values live. App chrome (a sticky header) sits under its
  // own off-canvas drawer; both sit under the modal — scrim and window — so a
  // dialog always covers the chrome that opened it. The portaled transient
  // panels (popout, menu, select listbox) sit ABOVE the modal: they only ever
  // open from direct interaction with the topmost active layer (including from
  // inside a dialog) and dismiss on any outside interaction, so nothing can
  // legitimately open on top of them — while a modal-under-overlay is exactly
  // the trap of a select or popout inside a dialog painting behind it. The
  // tooltip is highest for the same reason, squared: it may describe a row
  // inside an open overlay. No gaps: a future rung renumbers the scale.
  layers: {
    chrome: 1,
    drawer: 2,
    modal: 3,
    overlay: 4,
    tooltip: 5,
  },
};
