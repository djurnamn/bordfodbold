/**
 * The mode bootstrap — the write path for `html[data-djui-mode]`, the attribute
 * every djui color token keys off. The kit is presentational about mode
 * (ModeSwitch renders the toggle, nothing more); these helpers are the standing
 * answer to "what actually sets the attribute" — every consumer hand-rolled
 * this otherwise, and getting it wrong silently disables theming.
 *
 * Resolution order: the persisted preference (`localStorage`) → the OS
 * `prefers-color-scheme` (opt-in via `respectSystemPreference`) → the
 * configured `defaultMode`. `DjuiConfig` is build-time generator input, so the
 * bootstrap takes its own runtime options — a theme's default mode is a value
 * the consumer passes.
 *
 * SSR: the server renders the attribute from its own preference source (a
 * cookie, a session) so the first paint is right for known users; the inline
 * script fills only the anonymous/no-preference case, before paint. In a React
 * app:
 *
 *   <html lang="en" data-djui-mode={serverMode ?? 'light'} suppressHydrationWarning>
 *     <head>
 *       <script dangerouslySetInnerHTML={{ __html: modeBootstrapScript() }} />
 *
 * Toggles (e.g. ModeSwitch's `onToggle`) call `setMode`, which stamps the
 * attribute and persists the choice under the same key.
 */

export type DjuiMode = 'light' | 'dark';

export interface DjuiModeOptions {
  /** The `localStorage` key the preference persists under. Default `"djui-mode"`. */
  storageKey?: string;
  /**
   * Fall back to the OS `prefers-color-scheme` when no preference is stored.
   * Opt-in (default `false`): a theme that ships one designed mode usually
   * wants its `defaultMode`, not the OS guess.
   */
  respectSystemPreference?: boolean;
  /** The mode when nothing else resolves. Default `"light"`. */
  defaultMode?: DjuiMode;
}

const DEFAULT_STORAGE_KEY = 'djui-mode';

function normalizeOptions(options: DjuiModeOptions = {}): Required<DjuiModeOptions> {
  return {
    storageKey: options.storageKey ?? DEFAULT_STORAGE_KEY,
    respectSystemPreference: options.respectSystemPreference ?? false,
    defaultMode: options.defaultMode ?? 'light',
  };
}

/**
 * The pre-paint bootstrap as an inlineable script string — embed it in a
 * `<script>` in `<head>` (before the stylesheet applies is fine; before first
 * paint is the point). It re-implements `resolveMode` without any import so
 * the document doesn't wait on a module: read the stored preference, fall back
 * per the options, stamp `data-djui-mode` on `<html>`.
 */
export function modeBootstrapScript(options: DjuiModeOptions = {}): string {
  const { storageKey, respectSystemPreference, defaultMode } = normalizeOptions(options);
  const key = JSON.stringify(storageKey);
  const fallback = respectSystemPreference
    ? `window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":${JSON.stringify(defaultMode)}`
    : JSON.stringify(defaultMode);
  return (
    '(function(){var stored=null;try{stored=localStorage.getItem(' + key + ')}catch(error){}' +
    'var mode=stored==="dark"||stored==="light"?stored:' + fallback + ';' +
    'document.documentElement.setAttribute("data-djui-mode",mode)})();'
  );
}

/**
 * Resolve the current mode by the same rules the bootstrap script inlines —
 * for client code that needs the answer as a value (e.g. seeding a toggle's
 * state). Server-safe: with no `window` it returns `defaultMode`.
 */
export function resolveMode(options: DjuiModeOptions = {}): DjuiMode {
  const { storageKey, respectSystemPreference, defaultMode } = normalizeOptions(options);
  if (typeof window === 'undefined') return defaultMode;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(storageKey);
  } catch {
    // Storage may be unavailable (privacy mode, sandboxed frame) — fall through.
  }
  if (stored === 'dark' || stored === 'light') return stored;
  if (respectSystemPreference && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return defaultMode;
}

/**
 * The toggle write path: stamp `data-djui-mode` on `<html>` and persist the
 * choice under the bootstrap's key — the natural target for ModeSwitch's
 * `onToggle`. Client-only (a server call is a no-op).
 */
export function setMode(mode: DjuiMode, options: DjuiModeOptions = {}): void {
  const { storageKey } = normalizeOptions(options);
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-djui-mode', mode);
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // Storage may be unavailable — the attribute still applies for this page.
  }
}
