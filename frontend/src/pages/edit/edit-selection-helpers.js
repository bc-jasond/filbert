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
  // TODO: this function wouldn't be needed if there was always at least 1 selection
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
export function adjustSelectionOffsets(selections, start, count) {
  let newSelections = List();
  for (let i = 0; i < selections.size; i++) {
    let current = selections.get(i);
    if (current.get('start') >= start) {
      current = current.set('start', current.get('start') + count)
    }
    if (current.get('end') >= start) {
      current = current.set('end', current.get('end') + count)
    }
    // for deleting characters: don't push empty selections
    if (current.get('end') > current.get('start')) {
      newSelections = newSelections.push(current);
    } else {
      // HACK: Assuming the user hit backspace: if we're skipping an empty selection, we've also decremented the end of the previous selection by one.  We don't want to do both, add that guy back
      const lastSelection = newSelections.last();
      newSelections = newSelections.pop();
      newSelections = newSelections.push(lastSelection.set('end', lastSelection.get('end') + 1))
    }
  }
  console.log('ADJUST', start, count, newSelections.reduce((acc, v) => `${acc} | start: ${v.get('start')}, end: ${v.get('end')}`, ''));
  return newSelections;
}

export function applyFormatsOfOverlappingSelections(selections, current) {
  return selections
    .filter(s =>
      // current overlaps s to the right
      (current.get('start') >= s.get('start') && current.get('start') <= s.get('end'))
      // current overlaps s to the left
      || (current.get('end') >= s.get('start') && current.get('end') <= s.get('end'))
      // current envelops s completely
      || (current.get('start') < s.get('start') && current.get('end') > s.get('end')))
    .reduce((acc, selection) => acc.mergeWith(
      (oldVal, newVal, key) => {
        // don't blow away non-formatting related values like 'start' or 'end'
        if (!key.includes('selection')) {
          return oldVal
        }
        return newVal || oldVal
      },
      selection), current)
}

export function mergeOverlappingSelections(selections, newSelection) {
  let didPushNewSelection = false;
  let newSelections = List();
  if (selections.size === 0) {
    return newSelections.push(newSelection);
  }
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // current selection IS newSelection
    if (current.get('start') === newSelection.get('start') && current.get('end') === newSelection.get('end')) {
      newSelections = newSelections.push(newSelection);
      didPushNewSelection = true;
      continue;
    }
    // current selection doesn't overlap - push it
    if (current.get('end') <= newSelection.get('start') || current.get('start') >= newSelection.get('end')) {
      newSelections = newSelections.push(current);
      continue;
    }
    // current selection overlaps to the left
    if (current.get('start') < newSelection.get('start')) {
      newSelections = newSelections
        .push(current.set('end', newSelection.get('start')))
    }
    // push new selection
    if (!didPushNewSelection) {
      newSelections = newSelections.push(newSelection);
      didPushNewSelection = true;
    }
    // current selection overlaps to the right
    if (current.get('end') > newSelection.get('end')) {
      newSelections = newSelections.push(current.set('start', newSelection.get('end')));
    }
    // current selection falls completely within newSelection - skip since it's styles have already been merged with `applyFormatsOfOverlappingSelections` (noop)
    // if (current.get('start') >= newSelection.get('start') && current.get('end') <= newSelection.get('end')) {
    //   continue;
    // }
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
  let newSelections = List();
  let current = selections.first();
  for (let i = 1; i < selections.size; i++) {
    const next = selections.get(i, Selection());
    if (current === selections.last() || selectionsHaveDifferentFormats(current, next)) {
      newSelections = newSelections.push(current);
      current = next;
    } else {
      // if the formats are the same, just extend the current selection
      current = current.set('end', next.get('end'));
    }
  }
  newSelections = newSelections.push(current);
  // SUPER PERFORMANCE OPTIMIZATION: if there's only one Selection and it's empty - clear it out
  if (newSelections.size === 1 && !selectionsHaveDifferentFormats(newSelections.get(0), Selection())) {
    return List();
  }
  return newSelections;
}

export function removeEmptySelections(selections) {

}

function selectionsHaveDifferentFormats(left, right) {
  return [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_LINK,
    'linkUrl',
  ].reduce((acc, key) => acc || left.get(key) !== right.get(key), false);
}
