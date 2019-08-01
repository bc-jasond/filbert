/**
 * creating a selection:
 * if first selection in paragraph:
 * 1) create one selection the total length of textContent
 *    OR two selections starting at position 0 or ending at textContent.length - 1
 *    OR 3 selections, an empty one in beginning, one in the middle and another empty one at the end
 * An unformatted paragraph can have no selections but, if it has 1 or more, it can't have any gaps
 *
 * 1) add attributes from overlapping selections if they have formats (might be empty)
 * 2) merge overlapping selections - adjust start or end positions of overlapping selections,
 * guarantee no overlaps at rest
 */
export function createSelection(selections, start, end) {

}

/**
 * if the user places the caret in the middle of a paragraph with existing selections:
 * 1) if caret in middle of selection - end = oldEnd += newKeyStrokesCount
 * 2) if exist selections that start after the current caret position
 *   - start = oldStart += newKeyStrokesCount
 *   - end (if > -1) = oldEnd += newKeyStrokesCount
 */
export function adjustSelectionsOffsets(selections, start, count) {

}

export function mergeSelections(selections, left, right) {

}

/**
 * current = first selection
 * for each selection
 *   next = getNextSelection(current)
 *   if current formats === next formats
 *     merged
 *     current = merged
 *     continue
 *
 *   current = next
 */
export function mergeSelectionsWithSameFormats(selections) {

}