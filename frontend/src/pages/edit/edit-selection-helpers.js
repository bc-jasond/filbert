import { List, Record } from 'immutable';

import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_LINK,
} from '../../common/constants';

const Selection = Record({
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

/**
 * PRIVATE HELPERS
 */
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
function applyFormatsOfOverlappingSelections(nodeModel, newSelection) {
  const selections = nodeModel.getIn(['meta', 'selections'], List());
  return nodeModel.setIn(
    ['meta', 'selections'],
    selections
      .filter(s =>
        // newSelection overlaps s to the right
        (newSelection.get('start') >= s.get('start') && newSelection.get('start') <= s.get('end'))
        // newSelection overlaps s to the left
        || (newSelection.get('end') >= s.get('start') && newSelection.get('end') <= s.get('end'))
        // newSelection envelops s completely
        || (newSelection.get('start') < s.get('start') && newSelection.get('end') > s.get('end')))
      .reduce((acc, selection) => acc.mergeWith(
        (oldVal, newVal, key) => {
          // don't blow away non-formatting related values like 'start' or 'end'
          if (!key.includes('selection')) {
            return oldVal
          }
          return newVal || oldVal
        },
        selection), newSelection)
  )
}
function mergeOverlappingSelections(nodeModel, newSelection) {
  let didPushNewSelection = false;
  let newSelections = List();
  const selections = nodeModel.getIn(['meta', 'selections'], List());
  if (selections.size === 0) {
    newSelections = newSelections.push(newSelection);
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
  
  return nodeModel.setIn(['meta', 'selections'], newSelections);
}
/**
 * make sure that all characters in the paragraph are in a selection
 * @param selections
 */
function fillEnds(nodeModel) {
  let selections = nodeModel.getIn(['meta', 'selections'], List());
  const contentLength = nodeModel.get('content', '').length;
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
  return nodeModel.setIn(['meta','selections'], selections);
}
/**
 * current = first selection
 * for each selection
 *   next = getNextSelection
 *   (current)
 *   if current formats === next formats
 *     merged
 *     current = merged
 *     continue
 *
 *   current = next
 */
function mergeAdjacentSelectionsWithSameFormats(nodeModel) {
  let newSelections = List();
  const selections = nodeModel.getIn(['meta', 'selections'], List());
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
  // TODO: have this function take the content node model itself so it can clean 'meta' if it has an empty 'selections' list
  if (newSelections.size === 1 && !selectionsHaveDifferentFormats(newSelections.get(0), Selection())) {
    newSelections = List();
  }
  return nodeModel.setIn(['meta', 'selections'], newSelections);
}

/**
 * PUBLIC API
 */
/**
 * Every public export calls this to keep shit on the level
 *
 * if the user places the caret in the middle of a paragraph with existing selections:
 * 1) if caret in middle of selection - end = oldEnd += newKeyStrokesCount
 * 2) if exist selections that start after the current caret position
 *   - start = oldStart += newKeyStrokesCount
 *   - end (if > -1) = oldEnd += newKeyStrokesCount
 *
 * ALSO, this function doesn't allow out of bounds selection offsets (greater than the length of the content)
 */
export function adjustSelectionOffsetsAndCleanup(nodeModel, start = 0, count = 0) {
  const selections = nodeModel.getIn(['meta', 'selections'], List());
  if (selections.size === 0) {
    return nodeModel.deleteIn(['meta', 'selections']);
  }
  let newSelections = List();
  // TODO: might need to account for the 'placeholder' character here...
  const contentLength = nodeModel.get('content', '').length;
  for (let i = 0; i < selections.size; i++) {
    let current = selections.get(i);
    // TODO: remove these OOB safeties?
    if (current.get('start') >= contentLength) {
      const lastSelection = newSelections.last();
      newSelections = newSelections.pop();
      newSelections = newSelections.push(lastSelection.set('end', contentLength));
      break;
    }
    if (current.get('end') > contentLength) {
      newSelections = newSelections.push(current.set('end', contentLength));
      break;
    }
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
  console.log('ADJUST', nodeModel.toJS(), contentLength, start, count, newSelections.reduce((acc, v) => `${acc} | start: ${v.get('start')}, end: ${v.get('end')}`, ''));
  return nodeModel.setIn(['meta', 'selections'], newSelections);
}

export function getSelection(nodeModel, start, end) {
  const selections = nodeModel.getIn(['meta', 'selections'], List());
  let selection = selections.find(s => s.get('start') === start && s.get('end') === end, null, Selection());
  // selection already exists?
  if (selection.get('end') === end) {
    return selection;
  }
  selection = selection
    .set('start', start)
    .set('end', end);
  nodeModel = applyFormatsOfOverlappingSelections(nodeModel, selection);
  return adjustSelectionOffsetsAndCleanup(nodeModel);
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
export function upsertSelection(nodeModel, newSelection) {
  nodeModel = mergeOverlappingSelections(nodeModel, newSelection);
  // TODO: this function wouldn't be needed if there was always at least 1 selection
  nodeModel = fillEnds(nodeModel, contentLength);
  nodeModel = mergeAdjacentSelectionsWithSameFormats(nodeModel);
  return adjustSelectionOffsetsAndCleanup(nodeModel);
}

/**
 * NOTE: this function returns an array of Left & Right selections List()s NOT a document model
 * the reason is because we don't have a Right model (don't have an id) yet.  I could make this so but, it seems reach-outy
 *
 * @param nodeModel
 * @param caretOffset
 * @returns {List<any>[]}
 */
export function splitSelectionsAtCaretOffset(leftNodeModel, rightNodeModel, caretOffset) {
  let left = List();
  let right = List();
  const selections = leftNodeModel.getIn(['meta', 'selections'], List());
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    if (current.get('end') <= caretOffset) {
      left = left.push(current);
      continue;
    }
    if (current.get('start') >= caretOffset) {
      right = right.push(current
        .set('start', current.get('start') - caretOffset)
        .set('end', current.get('end') - caretOffset)
      );
      continue;
    }
    // caretOffset must be in the middle of a selection, split
    left = left.push(current
      .set('end', caretOffset));
    right = right.push(current
      .set('start', 0)
      .set('end', current.get('end') - caretOffset)
    );
  }
  leftNodeModel = leftNodeModel.setIn(['meta', 'selections'], left);
  leftNodeModel = adjustSelectionOffsetsAndCleanup(leftNodeModel);
  rightNodeModel = rightNodeModel.setIn(['meta', 'selections'], right);
  rightNodeModel = adjustSelectionOffsetsAndCleanup(rightNodeModel);
  return [leftNodeModel, rightNodeModel];
}

export function concatSelections(leftModel, rightModel) {
  const left = leftModel.getIn(['meta', 'selections'], List());
  let right = rightModel.getIn(['meta', 'selections'], List());
  let newSelections = left.slice();
  const leftOffset = left.last(Map()).get('end');
  // if the formats for the last left and first right selections are the same, merge them
  if (!selectionsHaveDifferentFormats(left.last(), right.first())) {
    newSelections = newSelections
      .pop()
      .push(left
        .last()
        .set('end', right
          .first()
          .get('end') + leftOffset
        )
      );
    right = right.shift();
  }
  // add all right selections with left offsets
  for (let i = 0; i < right.size; i++) {
    const current = right.get(i);
    newSelections = newSelections.push(current
      .set('start', current.get('start') + leftOffset)
      .set('end', current.get('end') + leftOffset)
    )
  }
  leftModel = leftModel.setIn(['meta','selections'], newSelections);
  return adjustSelectionOffsetsAndCleanup(leftModel);
}
