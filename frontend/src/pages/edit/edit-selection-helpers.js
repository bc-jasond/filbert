import { Map, List, Record } from 'immutable';

import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_LINK,
} from '../../common/constants';

export const Selection = Record({
  start: 0,
  end: -1,
  [SELECTION_ACTION_BOLD]: false,
  [SELECTION_ACTION_ITALIC]: false,
  [SELECTION_ACTION_CODE]: false,
  [SELECTION_ACTION_STRIKETHROUGH]: false,
  [SELECTION_ACTION_SITEINFO]: false,
  [SELECTION_ACTION_LINK]: false,
  linkUrl: '',
});

export function getSelection(selections, start, end) {
  let selection = selections.find(s => s.get('start') === start && s.get('end') === end, null, Selection());
  // selection already exists?
  if (selection.get('end') === end) {
    return selection;
  }
  selection = selection
    .set('start', start)
    .set('end', end);
  return applyFormatsOfOverlappingSelections(selections, selection);
}

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
export function upsertSelection(selections, newSelection, contentLength) {
  selections = mergeOverlappingSelections(selections, newSelection);
  selections = fillEnds(selections, contentLength);
  selections = mergeAdjacentSelectionsWithSameFormats(selections);
  return selections;
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

export function applyFormatsOfOverlappingSelections(selections, current) {
  return selections
    .filter(s => (s.get('start') >= current.get('start') && s.get('start') < current.get('end'))
      || (s.get('end') > current.get('start') && s.get('end') < current.get('end')))
    .reduce((acc, selection) => acc.mergeWith((oldVal, newVal) => newVal || oldVal, selection), current)
}

export function mergeOverlappingSelections(selections, newSelection) {
  let newSelections = List();
  if (selections.size === 0) {
    return newSelections.push(newSelection);
  }
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // section doesn't overlap - push it
    if (current.get('start') > newSelection.get('end') || current.get('end') < newSelection.get('start')) {
      newSelections = newSelections.push(current);
      continue;
    }
    // section split left
    if (current.get('start') < newSelection.get('start') && current.get('end') >= newSelection.get('start')) {
      newSelections = newSelections
        .push(current.set('end', newSelection.get('start')))
        .push(newSelection);
      continue;
    }
    // section split right
    if (current.get('start') <= newSelection.get('end') && current.get('end') > newSelection.get('end')) {
      newSelections = newSelections.push(current.set('start', newSelection.get('end') + 1));
      continue;
    }
    // section split middle
    if (current.get('start') < newSelection.get('start') && current.get('end') > newSelection.get('end')) {
      newSelections = newSelections
        .push(current.set('end', newSelection.get('start')))
        .push(newSelection)
        .push(current.set('start', newSelection.get('end')));
      continue;
    }
    // section falls completely within newSelection - skip (noop)
  }
  
  return newSelections;
}

/**
 * make sure that all characters in the paragraph are in a selection
 * @param selections
 */
export function fillEnds(selections, contentLength) {
  let minStart = contentLength;
  let maxEnd = 0;
  selections.forEach(s => {
    minStart = Math.min(minStart, s.get('start'));
    maxEnd = Math.max(maxEnd, s.get('end'));
  });
  if (minStart > 0) {
    selections = selections.insert(0, Selection({ 'start': 0, 'end': minStart }));
  }
  if (maxEnd < contentLength) {
    selections = selections.push(Selection({ 'start': maxEnd, 'end': contentLength }))
  }
  return selections;
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
export function mergeAdjacentSelectionsWithSameFormats(selections) {
  // TODO: this will adjust all affected selection offsets as new characters are typed/pasted in
  return selections
}
