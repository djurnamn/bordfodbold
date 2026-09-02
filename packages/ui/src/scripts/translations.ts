/**
 * The plain-string label records and their resolvers — the components whose
 * `translations` seam is a set of strings a server-rendered page can pass
 * whole. (The components whose machines want a *function* keep their own
 * module beside this one: `copy-field`, `file-upload`, `number-input`,
 * `pagination`, `progress`, `stepper`.)
 *
 * The kit-wide rule these serve: every string a component renders itself lives
 * in one `translations` prop, so "what can I translate here?" is one type to
 * read. And every record has exactly one resolver, `resolve<Component>Translations`,
 * returning the record with the English filled in — so the kit's English lives
 * in these resolvers and nowhere else. A Visual or driver never reads
 * `translations.key` directly and never carries an inline fallback: it reads
 * `resolveXTranslations(translations).key`, and a machine receives the
 * complete record, never a partial one for it to fill.
 *
 * Naming: a key inherited from a Zag machine keeps the machine's name, spelled
 * out where the machine abbreviates (`previousTriggerLabel`, not
 * `prevTriggerLabel` — the resolver maps to the machine's spelling). A key the
 * kit owns is named for what it labels, `<part>Label` where the string is a
 * control's accessible name.
 */

import { fillTemplate } from './fill-template';

/**
 * `Tabs` — the tablist's accessible name. The machine ships no default, so an
 * absent record used to leave the tablist unnamed. "Tabs" is a weak name, and
 * a consumer with two strips on a page still owes each a real one; the default
 * is here so the absent case is named rather than silent.
 */
export interface TabsTranslations {
  listLabel?: string;
}

export function resolveTabsTranslations(
  translations: TabsTranslations | undefined
): Required<TabsTranslations> {
  return { listLabel: translations?.listLabel ?? 'Tabs' };
}

/** `Combobox` — the machine's two control labels. */
export interface ComboboxTranslations {
  triggerLabel?: string;
  clearTriggerLabel?: string;
}

export function resolveComboboxTranslations(
  translations: ComboboxTranslations | undefined
): Required<ComboboxTranslations> {
  return {
    triggerLabel: translations?.triggerLabel ?? 'Toggle suggestions',
    clearTriggerLabel: translations?.clearTriggerLabel ?? 'Clear value',
  };
}

/**
 * `Drawer` — the panel's close control's label. The dialog machine carries no
 * translations of its own; the label is the kit's, as Modal's.
 */
export interface DrawerTranslations {
  closeLabel?: string;
}

export function resolveDrawerTranslations(
  translations: DrawerTranslations | undefined
): Required<DrawerTranslations> {
  return { closeLabel: translations?.closeLabel ?? 'Close' };
}

/**
 * The shells whose navigation collapses into an off-canvas panel below `small`
 * — `DashboardTemplate`, `DocsTemplate`, `AuthTemplateHeader` — each render
 * the panel's toggle themselves, and each names it from its own record. One
 * field, named for what it labels.
 */
export interface NavigationToggleTranslations {
  navigationToggleLabel?: string;
}

export type DashboardTemplateTranslations = NavigationToggleTranslations;
export type DocsTemplateTranslations = NavigationToggleTranslations;
export type AuthTemplateHeaderTranslations = NavigationToggleTranslations;

export function resolveNavigationToggleTranslations(
  translations: NavigationToggleTranslations | undefined
): Required<NavigationToggleTranslations> {
  return {
    navigationToggleLabel: translations?.navigationToggleLabel ?? 'Toggle navigation',
  };
}

/** `DocsTemplateHeader` — the mobile search-reveal toggle's accessible label. */
export interface DocsTemplateHeaderTranslations {
  searchToggleLabel?: string;
}

export function resolveDocsTemplateHeaderTranslations(
  translations: DocsTemplateHeaderTranslations | undefined
): Required<DocsTemplateHeaderTranslations> {
  return { searchToggleLabel: translations?.searchToggleLabel ?? 'Toggle search' };
}

/**
 * `Modal` — the close control's label. The dialog machine carries no
 * translations of its own; the label is the kit's.
 */
export interface ModalTranslations {
  closeLabel?: string;
}

export function resolveModalTranslations(
  translations: ModalTranslations | undefined
): Required<ModalTranslations> {
  return { closeLabel: translations?.closeLabel ?? 'Close' };
}

/** `ModeSwitch` — the light/dark toggle's label. */
export interface ModeSwitchTranslations {
  toggleLabel?: string;
}

export function resolveModeSwitchTranslations(
  translations: ModeSwitchTranslations | undefined
): Required<ModeSwitchTranslations> {
  return { toggleLabel: translations?.toggleLabel ?? 'Toggle color mode' };
}

/**
 * `UserCard` — the avatar image's alternative text. Pass an empty string
 * where the card's own name and email already carry the identity and the
 * image is decorative. (`alt` is the attribute's own name, kept as the
 * platform spells it.)
 */
export interface UserCardTranslations {
  avatarAlt?: string;
}

export function resolveUserCardTranslations(
  translations: UserCardTranslations | undefined
): Required<UserCardTranslations> {
  return { avatarAlt: translations?.avatarAlt ?? 'User avatar' };
}

/**
 * `Field` — the word marking a validation message as an error, read before the
 * message and hidden from view.
 */
export interface FieldTranslations {
  errorPrefix?: string;
}

export function resolveFieldTranslations(
  translations: FieldTranslations | undefined
): Required<FieldTranslations> {
  return { errorPrefix: translations?.errorPrefix ?? 'Error:' };
}

/**
 * `Breadcrumbs` — the trail's accessible name (the landmark's, so a page with
 * two `<nav>`s tells them apart) and the glyph between items. The glyph is a
 * translation rather than a style knob because it is locale content: a
 * right-to-left trail wants it mirrored, and some locales read `›` where
 * others read `/`.
 */
export interface BreadcrumbsTranslations {
  label?: string;
  separator?: string;
}

export function resolveBreadcrumbsTranslations(
  translations: BreadcrumbsTranslations | undefined
): Required<BreadcrumbsTranslations> {
  return {
    label: translations?.label ?? 'Breadcrumb',
    separator: translations?.separator ?? '/',
  };
}

/**
 * `LanguageSwitcher` — the trigger's accessible name. The trigger shows the
 * current language's *code* (`sv`), which alone announces as a bare token; the
 * name says what the control is for and keeps the visible text inside it, so
 * the spoken name still matches the label on screen. A template over `{code}`
 * (the visible text) and `{label}` (the current language's full name).
 */
export interface LanguageSwitcherTranslations {
  triggerLabel?: string;
}

export function resolveLanguageSwitcherTranslations(
  translations: LanguageSwitcherTranslations | undefined
): Required<LanguageSwitcherTranslations> {
  return { triggerLabel: translations?.triggerLabel ?? 'Language: {code}' };
}

/** The trigger's accessible name, filled for the current language. */
export function languageSwitcherTriggerLabel(
  translations: LanguageSwitcherTranslations | undefined,
  code: string,
  label: string | undefined
): string {
  return fillTemplate(resolveLanguageSwitcherTranslations(translations).triggerLabel, {
    code,
    label: label ?? code,
  });
}
