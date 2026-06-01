/**
 * Translation cache + partial-translate pipeline sometimes leaves
 * `meaningsMn` / `meaningMn` / `mongolian` equal to the English source
 * (e.g. proper nouns the API echoed back). Filter those out so the UI
 * doesn't show "fire · fire" as if both languages were displayed.
 */

function looksTranslated(en: string | undefined, mn: string | undefined): boolean {
  if (!mn) return false
  if (!en) return true
  return mn.trim().toLowerCase() !== en.trim().toLowerCase()
}

/** Returns the MN string only if it exists AND differs from the English. */
export function mnIfDifferent(en: string | undefined, mn: string | undefined): string | null {
  return looksTranslated(en, mn) ? (mn as string) : null
}

/** Filter an MN array down to entries that differ from the corresponding English entry. */
export function mnListIfDifferent(
  en: string[] | undefined,
  mn: string[] | undefined,
): string[] {
  if (!mn?.length) return []
  return mn.filter((m, i) => looksTranslated(en?.[i], m))
}
