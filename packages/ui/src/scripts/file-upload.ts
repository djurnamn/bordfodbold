/**
 * FileUpload's accessible-label runtime — the serializable siblings of the
 * `FileUpload` drivers' function-only label seams, shared by all three
 * targets. Functions cannot cross a server→client component boundary, so the
 * two per-file labels are expressible as template strings a server-rendered
 * page can pass whole, and the functions the machine wants are created on the
 * client side, inside the driver. The function forms win when both could
 * apply (the `rowHref` / `rowHrefKey` precedent on Table).
 */

import { fillTemplate } from './fill-template';

/**
 * The dropzone's accessible name when the consumer supplies none.
 *
 * The machine's own default is the literal string "dropzone" — its part name,
 * which is a description of the implementation rather than of the control. This
 * says what the control does. A form with more than one uploader should still
 * name each for what it collects.
 */
export const DEFAULT_DROPZONE_LABEL = 'Upload a file';

/**
 * The drivers' accessible-label overrides — the file-upload machine's
 * translation record (its field names kept verbatim), with the two per-file
 * labels widened to also accept a template string, plus the kit's own
 * `clearPreview` for the chip that removes an already-uploaded `previewUrl`
 * image (a control djui adds, so the machine has no label for it).
 *
 * Template placeholders are the file's own fields — `{name}`, `{type}`,
 * `{size}` (in bytes) — e.g. `"Ta bort {name}"`.
 */
export interface FileUploadTranslations {
  /** The dropzone's label — already a plain string on the machine. */
  dropzone?: string;
  /** The preview element's label, per file (English default: "Preview of {name}"). */
  itemPreview?: string | ((file: File) => string);
  /** The machine's delete-trigger label, per selected file (English default: "Remove {name}"). */
  deleteFile?: string | ((file: File) => string);
  /**
   * The clear chip's label when it removes the `previewUrl` image rather than a
   * selected file (English default: "Remove file"). Not a machine field — the
   * driver reads it directly.
   */
  clearPreview?: string;
}

/** The complete record: the machine's three members as functions, plus the kit's chip label. */
export interface ResolvedFileUploadTranslations {
  dropzone: string;
  itemPreview: (file: File) => string;
  deleteFile: (file: File) => string;
  clearPreview: string;
}

/** Turns one widened per-file label into the machine's function form. */
function resolveFileLabel(
  label: string | ((file: File) => string) | undefined,
  english: string
): (file: File) => string {
  if (typeof label === 'function') return label;
  const template = label ?? english;
  return (file) => fillTemplate(template, { name: file.name, type: file.type, size: file.size });
}

/**
 * Resolves a `FileUploadTranslations` record into the complete shape: the
 * template-string labels become filling functions, function labels pass
 * through, every member is present with the kit's English. The driver hands
 * the machine the whole record — its own defaults never apply — and reads
 * `clearPreview` itself.
 */
export function resolveFileUploadTranslations(
  translations: FileUploadTranslations | undefined
): ResolvedFileUploadTranslations {
  return {
    dropzone: translations?.dropzone ?? DEFAULT_DROPZONE_LABEL,
    itemPreview: resolveFileLabel(translations?.itemPreview, 'Preview of {name}'),
    deleteFile: resolveFileLabel(translations?.deleteFile, 'Remove {name}'),
    clearPreview: translations?.clearPreview ?? 'Remove file',
  };
}
