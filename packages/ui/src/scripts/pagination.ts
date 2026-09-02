/**
 * Pagination's URL and label runtime — the serializable siblings of the
 * `Pagination` drivers' function props, shared by all three targets. Functions
 * cannot cross a server→client component boundary, so a server-rendered page
 * expresses URL-driven pagination with plain strings — a `pageUrlTemplate`
 * (with an optional canonical `firstPageUrl`) where it could not pass
 * `getPageUrl`, and an `itemLabel` template string where it could not pass the
 * label function — and the functions are created on the client side, inside
 * the driver. The function forms win when both are given (the `rowHref` /
 * `rowHrefKey` precedent on Table).
 */

import { fillTemplate } from './fill-template';

/**
 * The page-URL resolver shared by the `Pagination` drivers. The function form
 * (`getPageUrl`) wins; otherwise `pageUrlTemplate` is a URL template with
 * `{page}`/`{pageSize}` placeholders (e.g. `"?page={page}"`), and the returned
 * function fills it per page. `firstPageUrl`, when given alongside the
 * template, is used verbatim for page 1 (and for any control targeting it), so
 * a list page can keep its bare canonical URL rather than `?page=1` — a
 * conditional the template itself cannot express. Neither form given, the
 * strip is not URL-driven and the resolver returns `undefined`.
 */
export function resolvePageUrl(
  getPageUrl: ((page: number, pageSize: number) => string) | undefined,
  pageUrlTemplate: string | undefined,
  firstPageUrl: string | undefined
): ((page: number, pageSize: number) => string) | undefined {
  if (getPageUrl) return getPageUrl;
  if (pageUrlTemplate === undefined) return undefined;
  return (page, pageSize) => {
    if (page <= 1 && firstPageUrl !== undefined) return firstPageUrl;
    return fillTemplate(pageUrlTemplate, { page, pageSize });
  };
}

/** The values available to a page item's accessible label. */
export interface PaginationItemLabelDetails {
  page: number;
  totalPages: number;
}

/**
 * The drivers' accessible-label overrides — the pagination machine's
 * translation record with its keys spelled out (`previousTriggerLabel`; the
 * machine's `prevTriggerLabel` is still accepted for one release and maps
 * onto it), and `itemLabel` widened to also accept a template string with
 * `{page}`/`{totalPages}` placeholders (e.g. `"page {page}"`), the
 * serializable form a server-rendered page can pass whole.
 */
export interface PaginationTranslations {
  rootLabel?: string;
  firstTriggerLabel?: string;
  previousTriggerLabel?: string;
  /** @deprecated Spelled out as `previousTriggerLabel`; read for one release. */
  prevTriggerLabel?: string;
  nextTriggerLabel?: string;
  lastTriggerLabel?: string;
  itemLabel?: string | ((details: PaginationItemLabelDetails) => string);
}

/** The record the machine takes: its own key spelling, every label present. */
export interface ResolvedPaginationTranslations {
  rootLabel: string;
  firstTriggerLabel: string;
  prevTriggerLabel: string;
  nextTriggerLabel: string;
  lastTriggerLabel: string;
  itemLabel: (details: PaginationItemLabelDetails) => string;
}

/** The English item label: the page, and on the last page that it is the last. */
function defaultItemLabel({ page, totalPages }: PaginationItemLabelDetails): string {
  const isLastPage = totalPages > 1 && page === totalPages;
  return isLastPage ? `Last page, page ${page}` : `Page ${page}`;
}

/**
 * Resolves a `PaginationTranslations` record into the complete, function-only
 * shape the machine takes: every label filled with the kit's English, a
 * template-string `itemLabel` turned into the filling function, a function
 * passed through, and the spelled-out `previousTriggerLabel` mapped onto the
 * machine's own key.
 */
export function resolvePaginationTranslations(
  translations: PaginationTranslations | undefined
): ResolvedPaginationTranslations {
  const itemLabel = translations?.itemLabel;
  return {
    rootLabel: translations?.rootLabel ?? 'Pagination',
    firstTriggerLabel: translations?.firstTriggerLabel ?? 'First page',
    prevTriggerLabel:
      translations?.previousTriggerLabel ?? translations?.prevTriggerLabel ?? 'Previous page',
    nextTriggerLabel: translations?.nextTriggerLabel ?? 'Next page',
    lastTriggerLabel: translations?.lastTriggerLabel ?? 'Last page',
    itemLabel:
      typeof itemLabel === 'string'
        ? (details) =>
            fillTemplate(itemLabel, {
              page: details.page,
              totalPages: details.totalPages,
            })
        : (itemLabel ?? defaultItemLabel),
  };
}

/**
 * Normalizes one of the machine's four control records for the link
 * arrangement, so a control the strip shows as unavailable is unavailable to
 * every input.
 *
 * The machine marks all four boundary controls with `data-disabled` at the
 * ends of the range, but only *drops the href* on previous/next — first and
 * last keep a live one (they point at page 1 and the last page, which exist
 * whatever page you are on). The result was a control that looked disabled,
 * was inert to the mouse (the stylesheet's `pointer-events: none`) and stayed
 * fully operable from the keyboard: focusable, and Enter navigated. Mouse and
 * keyboard disagreeing about whether a control works is the defect; this makes
 * them agree, by taking the href off every disabled control rather than two of
 * them.
 *
 * An `<a>` with no href is not focusable and not activatable — the same inert
 * state previous/next already had — so the stylesheet can select it as exactly
 * that, `a:not([href])`, in the platform's own vocabulary rather than the
 * machine's `[data-disabled]`.
 *
 * It is hidden from the accessibility tree rather than marked `aria-disabled`,
 * which is where this used to be wrong. An `<a>` without an href computes as
 * role `generic`, and `aria-disabled` is not a global state — `generic` supports
 * none. Chrome does carry the value through to its own tree — measured, the node
 * reports `role=generic` and `disabled=true` together — but on a role no screen
 * reader announces as a control, so nothing reaches the user, and the same
 * attribute on the same markup is free to mean nothing in the next engine.
 *
 * Hiding it is what makes the three inputs agree, which is the whole point of
 * this function: the control is inert to the pointer (`pointer-events: none`),
 * inert to the keyboard (not focusable — also measured), and now absent from the
 * tree as well, instead of appearing there as a named node with no role. Nothing
 * is lost with it. Which page you are on is announced by `aria-current="page"`
 * on the item, and "there is no previous page" follows from that — which is the
 * inference APG's pagination pattern already expects a user to make, and the
 * reason this function takes the href off in the first place.
 *
 * The button arrangement is untouched: there the machine sets the real
 * `disabled` attribute, which already means this on every axis.
 */
export function resolvePaginationControlProps<Record_ extends Record<string, unknown>>(
  record: Record_ | undefined,
  link: boolean
): Record_ | undefined {
  if (!record || !link) return record;
  // The machine's `dataAttr` writes `""` when the state is on and `undefined`
  // when it is off — and the key is present either way, so presence is not the
  // test. Nor is truthiness: `""` is falsy. The value being defined is.
  if (record['data-disabled'] === undefined) return record;
  const { href: _href, onClick: _onClick, ...rest } = record as Record<string, unknown>;
  return { ...rest, 'aria-hidden': 'true' } as unknown as Record_;
}
