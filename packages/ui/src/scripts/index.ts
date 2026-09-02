/**
 * `djui/scripts` — djui's runtime helpers, the scripting sibling of
 * `djui/styles`. Generated components import the assemblers and shared types
 * they need from here. One flat bucket for now; sub-split only if it grows
 * distinct domains.
 */
export type {
  BreakpointName,
  ResponsiveBand,
  Responsive,
} from './responsive';
export { expandResponsive } from './responsive';

export type { DjuiColorToken } from './color';

export type { StackDirection, StackAlign, StackJustify } from './layout';
export { stackStyle, layoutContainerStyle, layoutItemStyle } from './layout';

export type { SurfaceContextNode } from './surface';
export {
  surfaceStyle,
  setSurface,
  effectiveSurfaceLevel,
  overlaySurfaceForTrigger,
} from './surface';

export type { RowClickEvent, SortDirection, SortState } from './table';
export { followRowLink, nextSort, resolveRowHref } from './table';

export type {
  PaginationItemLabelDetails,
  PaginationTranslations,
  ResolvedPaginationTranslations,
} from './pagination';
export {
  resolvePageUrl,
  resolvePaginationControlProps,
  resolvePaginationTranslations,
} from './pagination';

export type {
  CopyFieldTranslations,
  CopyFieldTriggerLabels,
  ResolvedCopyFieldTranslations,
} from './copy-field';
export { resolveCopyFieldTranslations } from './copy-field';

export type { FileUploadTranslations, ResolvedFileUploadTranslations } from './file-upload';
export { resolveFileUploadTranslations } from './file-upload';

export type {
  ProgressTranslations,
  ProgressValueDetails,
  ResolvedProgressTranslations,
} from './progress';
export { resolveProgressTranslations } from './progress';

export type { NumberInputTranslations, ResolvedNumberInputTranslations } from './number-input';
export { resolveNumberInputTranslations } from './number-input';

export type { PinInputTranslations, ResolvedPinInputTranslations } from './pin-input';
export {
  pinInputCellProps,
  pinInputFirstCellId,
  pinInputValueArray,
  resolvePinInputTranslations,
} from './pin-input';

export type {
  StepperTranslations,
  ResolvedStepperTranslations,
  StepperKeyTarget,
} from './stepper';
export {
  createStepperKeydown,
  resolveStepperTranslations,
  stepperTriggerProps,
  stepperValueLabel,
  stepperValueText,
} from './stepper';

export type {
  BreadcrumbsTranslations,
  ComboboxTranslations,
  DocsTemplateHeaderTranslations,
  DrawerTranslations,
  LanguageSwitcherTranslations,
  NavigationToggleTranslations,
  DashboardTemplateTranslations,
  DocsTemplateTranslations,
  AuthTemplateHeaderTranslations,
  ModalTranslations,
  ModeSwitchTranslations,
  TabsTranslations,
  UserCardTranslations,
  FieldTranslations,
} from './translations';
export {
  languageSwitcherTriggerLabel,
  resolveBreadcrumbsTranslations,
  resolveComboboxTranslations,
  resolveDocsTemplateHeaderTranslations,
  resolveDrawerTranslations,
  resolveFieldTranslations,
  resolveLanguageSwitcherTranslations,
  resolveModalTranslations,
  resolveModeSwitchTranslations,
  resolveNavigationToggleTranslations,
  resolveTabsTranslations,
  resolveUserCardTranslations,
} from './translations';

export { filterComboboxOptions } from './combobox';

export type { DjuiDirection, DjuiLocale, DjuiLocaleInput } from './locale';
export { DEFAULT_LOCALE, formatNumber, resolveLocale } from './locale';

export type {
  TabsElementIds,
  TabsPanelArrangement,
  TabsPanelOptions,
  TabsPanelProps,
} from './tabs';
export { tabsElementIds, tabsPanelProps } from './tabs';

export type { FieldElementIds } from './field';
export { fieldDescribedBy, fieldElementIds } from './field';

export { mergeElementProps } from './element-props';

export { mergeTriggerProps, selectValueId } from './select';

export { resolveSlug } from './slug';

export type { DjuiMode, DjuiModeOptions } from './mode';
export { modeBootstrapScript, resolveMode, setMode } from './mode';

export type { ComponentDefaultsSource } from './component-defaults';
export {
  configureComponentDefaults,
  componentDefault,
  componentDefaultFlag,
  componentDefaultRecord,
} from './component-defaults';

export type { RepeaterRow, RepeaterTranslations } from './repeater';
export {
  addRepeaterRow,
  moveRepeaterRow,
  removeRepeaterRow,
  setRepeaterField,
  serializeRepeaterRows,
  resolveRepeaterTranslations,
} from './repeater';

export type { ToolbarOrientation, ToolbarFrameMeasurement } from './toolbar';
export {
  TOOLBAR_SINGLE_ROW_THRESHOLD_PX,
  TOOLBAR_COMPACT_ENTER_PX,
  TOOLBAR_COMPACT_EXIT_PX,
  measureToolbarFrame,
  nextToolbarCompact,
  markToolbarRows,
} from './toolbar';

export type { IconOnlyNameCheck } from './accessible-name';
export {
  resetUnnamedIconButtonWarnings,
  resolveOverlayLabelling,
  warnUnnamedIconButton,
} from './accessible-name';
