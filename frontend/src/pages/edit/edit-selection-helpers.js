import {List, Record} from 'immutable';

import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL,
  SELECTION_START,
  SELECTION_END,
} from '../../common/constants';
import {cleanTextOrZeroLengthPlaceholder} from "../../common/utils";

export const Selection = Record({
  [SELECTION_START]: 0,
  [SELECTION_END]: -1,
  [SELECTION_ACTION_BOLD]: false,
  [SELECTION_ACTION_ITALIC]: false,
  [SELECTION_ACTION_CODE]: false,
  [SELECTION_ACTION_STRIKETHROUGH]: false,
  [SELECTION_ACTION_SITEINFO]: false,
  [SELECTION_ACTION_LINK]: false,
  [SELECTION_LINK_URL]: '',
});

export function selectionReviver(key, value) {
  if (value.has(SELECTION_START) && value.has(SELECTION_END)) {
    return new Selection(value)
  }
}
export function formatSelections(s) {
  if (!List.isList(s)) {
    return;
  }
  return s.reduce((acc, v) => `${acc} | start: ${v.get(SELECTION_START)}, end: ${v.get(SELECTION_END)}`, '');
}

/**
 * PRIVATE HELPERS
 */
function getSelections(nodeModel) {
  return nodeModel.getIn(['meta', 'selections'], List());
}
function setSelections(nodeModel, value) {
  return nodeModel.setIn(['meta', 'selections'], value);
}

function selectionsHaveDifferentFormats(left, right) {
  return [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
  ].reduce((acc, key) => acc || left.get(key) !== right.get(key), false);
}

/**
 * NOTE: returns a Selection
 * @param nodeModel
 * @param newSelection
 * @returns {Selection}
 */
function applyFormatsOfOverlappingSelections(nodeModel, newSelection) {
  const selections = getSelections(nodeModel);
  return selections
    .filter(s =>
      // newSelection overlaps s to the right
      (newSelection.get(SELECTION_START) >= s.get(SELECTION_START) && newSelection.get(SELECTION_START) <= s.get(SELECTION_END))
      // newSelection overlaps s to the left
      || (newSelection.get(SELECTION_END) >= s.get(SELECTION_START) && newSelection.get(SELECTION_END) <= s.get(SELECTION_END))
      // newSelection envelops s completely
      || (newSelection.get(SELECTION_START) < s.get(SELECTION_START) && newSelection.get(SELECTION_END) > s.get(SELECTION_END)))
    .reduce((acc, selection) => acc.mergeWith(
      (oldVal, newVal, key) => {
        // don't blow away non-formatting related values like SELECTION_START or SELECTION_END
        if ([SELECTION_START, SELECTION_END, SELECTION_LINK_URL].includes(key)) {
          return oldVal
        }
        return newVal || oldVal
      },
      selection), newSelection);
}

function mergeOverlappingSelections(nodeModel, newSelection) {
  let didPushNewSelection = false;
  let newSelections = List();
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    newSelections = newSelections.push(newSelection);
  }
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // current selection IS newSelection
    if (current.get(SELECTION_START) === newSelection.get(SELECTION_START) && current.get(SELECTION_END) === newSelection.get(SELECTION_END)) {
      newSelections = newSelections.push(newSelection);
      didPushNewSelection = true;
      continue;
    }
    // current selection doesn't overlap - push it
    if (current.get(SELECTION_END) <= newSelection.get(SELECTION_START) || current.get(SELECTION_START) >= newSelection.get(SELECTION_END)) {
      newSelections = newSelections.push(current);
      continue;
    }
    // current selection overlaps to the left
    if (current.get(SELECTION_START) < newSelection.get(SELECTION_START)) {
      newSelections = newSelections
        .push(current.set(SELECTION_END, newSelection.get(SELECTION_START)))
    }
    // push new selection
    if (!didPushNewSelection) {
      newSelections = newSelections.push(newSelection);
      didPushNewSelection = true;
    }
    // current selection overlaps to the right
    if (current.get(SELECTION_END) > newSelection.get(SELECTION_END)) {
      newSelections = newSelections.push(current.set(SELECTION_START, newSelection.get(SELECTION_END)));
    }
    // current selection falls completely within newSelection - skip since it's styles have already been merged with `applyFormatsOfOverlappingSelections` (noop)
    // if (current.get(SELECTION_START) >= newSelection.get(SELECTION_START) && current.get(SELECTION_END) <= newSelection.get(SELECTION_END)) {
    //   continue;
    // }
  }

  return setSelections(nodeModel, newSelections);
}

/**
 * make sure that all characters in the paragraph are in a selection
 * @param selections
 */
function fillEnds(nodeModel) {
  const selections = getSelections(nodeModel);
  const contentLength = nodeModel.get('content', '').length;
  let newSelections = selections;
  let minStart = contentLength;
  let maxEnd = 0;
  selections.forEach(s => {
    minStart = Math.min(minStart, s.get(SELECTION_START));
    maxEnd = Math.max(maxEnd, s.get(SELECTION_END));
  });
  if (minStart > 0) {
    newSelections = newSelections.insert(0, Selection({[SELECTION_START]: 0, [SELECTION_END]: minStart}));
  }
  if (maxEnd < contentLength) {
    newSelections = newSelections.push(Selection({[SELECTION_START]: maxEnd, [SELECTION_END]: contentLength}))
  }
  if (!selections.equals(newSelections)) {
    console.log('FILL ENDS      ', formatSelections(newSelections));
    return setSelections(nodeModel, newSelections);
  }
  return nodeModel;
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
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    return nodeModel;
  }
  let current = selections.first();
  for (let i = 1; i < selections.size; i++) {
    const next = selections.get(i, Selection());
    if (current === selections.last() || selectionsHaveDifferentFormats(current, next)) {
      newSelections = newSelections.push(current);
      current = next;
    } else {
      // if the formats are the same, just extend the current selection
      current = current.set(SELECTION_END, next.get(SELECTION_END));
    }
  }
  newSelections = newSelections.push(current);
  // SUPER PERFORMANCE OPTIMIZATION: if there's only one Selection and it's empty - clear it out
  if (newSelections.size === 1 && !selectionsHaveDifferentFormats(newSelections.get(0), Selection())) {
    newSelections = List();
  }
  if (!selections.equals(newSelections)) {
    console.log('MERGE ADJACENT ', formatSelections(newSelections));
    return setSelections(nodeModel, newSelections);
  }
  return nodeModel;
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
 */
export function adjustSelectionOffsetsAndCleanup(nodeModel, start = 0, count = 0) {
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    return nodeModel.deleteIn(['meta', 'selections']);
  }
  let newSelections = List();
  // TODO: might need to account for the 'placeholder' character here...
  const contentLength = nodeModel.get('content', '').length;
  for (let i = 0; i < selections.size; i++) {
    let current = selections.get(i);
    if (current.get(SELECTION_START) >= start) {
      current = current.set(SELECTION_START, current.get(SELECTION_START) + count)
    }
    if (current.get(SELECTION_END) >= start) {
      current = current.set(SELECTION_END, current.get(SELECTION_END) + count)
    }
    // for deleting characters: don't push empty selections
    if (current.get(SELECTION_END) > current.get(SELECTION_START)) {
      newSelections = newSelections.push(current);
    }
  }

  let newModel = nodeModel;
  if (!selections.equals(newSelections)) {
    console.log('ADJUST         ', formatSelections(newSelections), 'start: ', start, ' count: ', count, ' length: ', contentLength);
    newModel = setSelections(nodeModel, newSelections);
  }
  newModel = mergeAdjacentSelectionsWithSameFormats(newModel);
  return fillEnds(newModel);
}

/**
 * NOTE: returns Selection for the format selection menu
 * @param nodeModel
 * @param start
 * @param end
 * @returns {Selection}
 */
export function getSelection(nodeModel, start, end) {
  const selections = getSelections(nodeModel);
  let selection = selections.find(s => s.get(SELECTION_START) === start && s.get(SELECTION_END) === end, null, Selection());
  // selection already exists?
  if (selection.get(SELECTION_END) === end) {
    return selection;
  }
  selection = selection
    .set(SELECTION_START, start)
    .set(SELECTION_END, end);
  return applyFormatsOfOverlappingSelections(nodeModel, selection);
}

/**
 * creating a selection:
 * if first selection in paragraph:
 * 1) create one selection the total length of textContent
 *    OR two selections starting at position 0 or ending at textContent.length - 1
 *    OR 3 selections, an empty one in beginning, one in the middle and another empty one at the end
 *
 * An unformatted paragraph can have no selections but, if it has 1 or more, it can't have any gaps
 *
 * 1) add attributes from overlapping selections if they have formats (might be empty)
 * 2) merge overlapping selections - adjust start or end positions of overlapping selections,
 * guarantee no overlaps at rest
 */
export function upsertSelection(nodeModel, newSelection) {
  nodeModel = mergeOverlappingSelections(nodeModel, newSelection);
  // TODO: this function wouldn't be needed if there was always at least 1 selection
  nodeModel = fillEnds(nodeModel);
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
  const selections = getSelections(leftNodeModel);
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    if (current.get(SELECTION_END) <= caretOffset) {
      left = left.push(current);
      continue;
    }
    if (current.get(SELECTION_START) >= caretOffset) {
      right = right.push(current
        .set(SELECTION_START, current.get(SELECTION_START) - caretOffset)
        .set(SELECTION_END, current.get(SELECTION_END) - caretOffset)
      );
      continue;
    }
    // caretOffset must be in the middle of a selection, split
    left = left.push(current
      .set(SELECTION_END, caretOffset));
    right = right.push(current
      .set(SELECTION_START, 0)
      .set(SELECTION_END, current.get(SELECTION_END) - caretOffset)
    );
  }
  leftNodeModel = setSelections(leftNodeModel, left);
  leftNodeModel = adjustSelectionOffsetsAndCleanup(leftNodeModel);
  rightNodeModel = setSelections(rightNodeModel, right);
  rightNodeModel = adjustSelectionOffsetsAndCleanup(rightNodeModel);
  return [leftNodeModel, rightNodeModel];
}

export function concatSelections(leftModel, rightModel) {
  const left = getSelections(leftModel);
  let right = getSelections(rightModel);
  let newSelections = left.slice();
  const leftOffset = left.last(Selection()).get(SELECTION_END);
  // add all right selections with left offsets
  // NOTE: if left.last() and right.first() have the same formats, they'll be merged in mergeAdjacent
  for (let i = 0; i < right.size; i++) {
    const current = right.get(i);
    newSelections = newSelections.push(current
      .set(SELECTION_START, current.get(SELECTION_START) + leftOffset)
      .set(SELECTION_END, current.get(SELECTION_END) + leftOffset)
    )
  }
  leftModel = setSelections(leftModel, newSelections);
  return adjustSelectionOffsetsAndCleanup(leftModel);
}

export function getContentForSelection(node, selection) {
  let content = node.get('content');
  if (content === undefined || content === null) {
    content = '';
  }
  const startOffset = selection.get(SELECTION_START);
  const endOffset = selection.get(SELECTION_END);
  return cleanTextOrZeroLengthPlaceholder(content.substring(startOffset, endOffset));
}

export function getSelectionKey(s) {
  return `${s.get(SELECTION_START)}-${s.get(SELECTION_END)}-${[
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_LINK,
  ].map(fmt => s.get(fmt) ? 1 : 0)}`;
}
