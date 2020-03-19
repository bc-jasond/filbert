import { fromJS, Map } from 'immutable';

import { SELECTION_LENGTH, SELECTION_NEXT } from '../../common/constants';
import {
  cleanTextOrZeroLengthPlaceholder,
  reviver,
  Selection
} from '../../common/utils';

export function formatSelections(head) {
  if (!Map.isMap(head)) {
    return '';
  }
  let current = head;
  let output = 'head: ';
  while (current) {
    output = `${output}${current.get(SELECTION_LENGTH)}, ${current.get(
      SELECTION_NEXT
    )} | `;
    current = current.get(SELECTION_NEXT);
  }
  return output;
}

/**
 * PRIVATE HELPERS
 */
// returns "head" or first selection
// convert to JS to avoid having to refresh all references to "next" on every change
function getSelections(nodeModel) {
  return nodeModel.getIn(['meta', 'selections'], Selection()).toJS();
}
function setSelections(nodeModel, value) {
  return nodeModel.setIn(
    ['meta', 'selections'],
    value ? fromJS(value, reviver) : Selection()
  );
}

function selectionsHaveIdenticalFormats(left, right) {
  // remove non-formatting related fields
  const leftCompare = Selection(left)
    .delete(SELECTION_LENGTH)
    .delete(SELECTION_NEXT);
  const rightCompare = Selection(right)
    .delete(SELECTION_LENGTH)
    .delete(SELECTION_NEXT);
  // use built-in equals()
  return leftCompare.equals(rightCompare);
}
/* eslint-disable no-param-reassign, prefer-destructuring */
function maybeMergeNodes(left, right) {
  if (!selectionsHaveIdenticalFormats(left, right)) {
    return false;
  }
  // if we're past the end or on the last node
  if (!right || !right[SELECTION_NEXT]) {
    left[SELECTION_LENGTH] = -1;
    left[SELECTION_NEXT] = undefined;
  } else {
    left[SELECTION_LENGTH] += right[SELECTION_LENGTH];
    left[SELECTION_NEXT] = right[SELECTION_NEXT];
  }
  return true;
}
/* eslint-enable no-param-reassign, prefer-destructuring */

// uses vanilla JS instead of Immutable
function internalGetSelectionAtIndex(head, idx) {
  let selection = head;
  let i = 0;
  while (selection && i < idx) {
    // eslint-disable-next-line prefer-destructuring
    selection = selection[SELECTION_NEXT];
    i += 1;
  }
  if (!selection) {
    console.error('Bad selection index: ', idx, head);
  }
  return selection;
}

/**
 * PUBLIC API
 *
 *
 * Every public export calls this to keep shit on the level.
 * FOR POSTERITY: This has been the single most difficult function to design in the whole codebase
 * bugs and regressions here over and over again finally prompted adding the first tests with jest
 *
 * adjusts selection offsets (and removes selections) after these events: paste, keydown, delete 1 char, delete selection of 1 or more chars
 */
export function adjustSelectionOffsetsAndCleanup(
  nodeModel,
  beforeContent = '',
  start = 0,
  count = 0
) {
  const doesRemoveCharacters = count < 0;
  // no-op?
  if (start === 0 && count === 0) {
    return nodeModel;
  }
  // validate input
  if (
    // can't start before 0
    start < 0 ||
    // trying to delete too far left (past 0)
    start + count < 0 ||
    // trying to delete from too far right
    (doesRemoveCharacters && start > beforeContent.length) ||
    // trying to add too many characters
    (!doesRemoveCharacters && start + count > nodeModel.get('content')?.length)
  ) {
    throw new Error(
      `adjustSelectionOffsetsAndCleanup out of bounds!\n${JSON.stringify(
        nodeModel.toJS()
      )}\n${start}\n${count}`
    );
  }

  let head = getSelections(nodeModel);
  console.info(
    'ADJUST         ',
    formatSelections(head),
    ' -- offset: ',
    start,
    ' count: ',
    count
  );
  // if there's only 1 selection, no-op
  if (!head[SELECTION_NEXT]) {
    return nodeModel;
  }
  let current = head;
  let prev;
  let caretPosition = 0;
  // if we're ADDING content
  if (!doesRemoveCharacters) {
    // find the selection
    while (
      current[SELECTION_NEXT] &&
      start >= caretPosition + current[SELECTION_LENGTH]
    ) {
      caretPosition += current[SELECTION_LENGTH];
      // eslint-disable-next-line prefer-destructuring
      current = current[SELECTION_NEXT];
    }
    // and increase it's length if it's not at the end
    if (current[SELECTION_NEXT]) {
      current[SELECTION_LENGTH] += count;
      return setSelections(nodeModel, head);
    }
    return nodeModel;
  }
  //
  // if we're DELETING content:
  //
  // did we delete all content for the node? - count is negative
  if (beforeContent.length + count === 0) {
    return setSelections(nodeModel);
  }
  const deleteCaretStart = start + count; // count is negative
  if (deleteCaretStart === 0) {
    // unset head if we deleted through the beginning
    head = undefined;
  }
  // loop through all selections
  let didSkip = false;
  let didDelete = false;
  while (current) {
    // capture this value before we mutate it - give last selection a length for comparison (it will be -1)
    const currentLength =
      current[SELECTION_LENGTH] === -1
        ? beforeContent.length - caretPosition
        : current[SELECTION_LENGTH];
    if (
      caretPosition >= deleteCaretStart &&
      caretPosition + currentLength <= start
    ) {
      // whole selection was deleted
      didSkip = true;
    } else {
      // selection completely overlaps?
      if (
        caretPosition <= deleteCaretStart &&
        caretPosition + currentLength >= start
      ) {
        const newLength = currentLength + count;
        if (newLength === 0) {
          // deleted the selection
          didDelete = true;
        }
        current[SELECTION_LENGTH] = currentLength + count; // count is negative
      }
      // selection overlaps to the left?
      else if (
        caretPosition < deleteCaretStart &&
        caretPosition + currentLength > deleteCaretStart
      ) {
        current[SELECTION_LENGTH] = deleteCaretStart - caretPosition;
      }
      // selection overlaps to the right?
      else if (
        current[SELECTION_NEXT] &&
        caretPosition < start &&
        caretPosition + currentLength > start
      ) {
        current[SELECTION_LENGTH] = caretPosition + currentLength - start;
      }
      if (!head) {
        didSkip = false;
        head = current;
      } else if (didSkip) {
        didSkip = false;
        if (!selectionsHaveIdenticalFormats(prev, current)) {
          prev[SELECTION_NEXT] = current;
        } else if (current[SELECTION_NEXT]) {
          // merge new neighbors with same formats here
          prev[SELECTION_LENGTH] += current[SELECTION_LENGTH];
          // eslint-disable-next-line prefer-destructuring
          prev[SELECTION_NEXT] = current[SELECTION_NEXT];
        } else {
          // the last selection has same formats as prev and needs to be "merged" - just delete
          didDelete = true;
        }
      }
      if (didDelete) {
        // mark as skipped to link prev & current[next] on next loop
        didSkip = true;
        didDelete = false;
      } else {
        prev = current;
      }
    }
    // advance cursor and selection pointer
    caretPosition += currentLength;
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  // prev should be last node
  prev[SELECTION_LENGTH] = -1;
  prev[SELECTION_NEXT] = undefined;

  return setSelections(nodeModel, head);
}

/**
 * Takes a highlight range in paragraph content and maps it to a Selection.
 * finds index of existing selection, or replaces into the selections linked list a new placeholder selection
 * adjusting/removing existing overlapping selections in place
 * NOTE: doesn't merge neighboring selections with identical formats, this happens on update
 */
export function getSelectionByContentOffset(nodeModel, start, end) {
  // TODO: validation of start & end against nodeModel.get('content')?.length
  const length = end - start;
  const doesReplaceLastSelection = end === nodeModel.get('content', '').length;
  // first see if the exact Selection already exists?
  let head = getSelections(nodeModel);
  let originalHead = head;
  let current = head;
  let prev;
  let caretPosition = 0;
  let idx = 0;
  while (
    current[SELECTION_NEXT] &&
    caretPosition + current[SELECTION_LENGTH] <= start
  ) {
    caretPosition += current[SELECTION_LENGTH];
    idx += 1;
    prev = current;
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  // found exact match in existing selections ?
  if (
    caretPosition === start &&
    (current[SELECTION_LENGTH] === length ||
      (doesReplaceLastSelection && !current[SELECTION_NEXT]))
  ) {
    return { selections: fromJS(head, reviver), idx };
  }
  // if we're here, we didn't find an exact match in existing selections
  const newSelection = {
    [SELECTION_LENGTH]: doesReplaceLastSelection ? -1 : length,
    [SELECTION_NEXT]: undefined
  };
  // capture current length before mutation
  // eslint-disable-next-line prefer-destructuring
  const originalLength = current[SELECTION_LENGTH];
  // eslint-disable-next-line prefer-destructuring
  const originalNext = current[SELECTION_NEXT];
  // replace head?
  if (start === 0) {
    head = newSelection;
  } else if (start - caretPosition === 0) {
    // users selection lines up with end of last selection
    prev[SELECTION_NEXT] = newSelection;
  } else if (
    (!originalNext && !doesReplaceLastSelection) ||
    originalLength - (start - caretPosition) > length
  ) {
    // newSelection is completely inside of current
    const currentCopy = { ...current };
    current[SELECTION_LENGTH] = start - caretPosition;
    current[SELECTION_NEXT] = newSelection;
    idx += 1;
    newSelection[SELECTION_NEXT] = currentCopy;
    currentCopy[SELECTION_LENGTH] = !originalNext
      ? -1
      : originalLength - current[SELECTION_LENGTH] - length;
    return { selections: fromJS(head, reviver), idx };
  } else {
    // adjust "left" length
    current[SELECTION_LENGTH] = start - caretPosition;
    // no merge (happens on update), set left[next] to new selection
    current[SELECTION_NEXT] = newSelection;
    // move index pointer only if head didn't change
    idx += 1;
  }
  if (doesReplaceLastSelection) {
    return { selections: fromJS(head, reviver), idx };
  }
  // add original "left" length to caretPosition to preserve original selection lengths for further comparison
  caretPosition += originalLength;
  // advance pointer to continue through original list
  current = originalNext;
  // skip any completely overlapped selections
  while (current && caretPosition + current[SELECTION_LENGTH] <= end) {
    caretPosition += current[SELECTION_LENGTH];
    prev = current;
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  if (!prev) {
    // newSelection is new head
    // adjust originalHead length if newSelection length <
    if (
      originalHead[SELECTION_LENGTH] > 0 &&
      newSelection[SELECTION_LENGTH] < originalHead[SELECTION_LENGTH]
    ) {
      originalHead[SELECTION_LENGTH] -= newSelection[SELECTION_LENGTH];
    }
    head[SELECTION_NEXT] = originalHead;
    return { selections: fromJS(head, reviver), idx };
  }
  if (!current) {
    // newSelection is new 2nd to last, prev is last Selection
    newSelection[SELECTION_NEXT] = prev;
    return { selections: fromJS(head, reviver), idx };
  }
  if (current[SELECTION_NEXT]) {
    // adjust "right" length (if not -1)
    current[SELECTION_LENGTH] = caretPosition + current[SELECTION_LENGTH] - end;
  }
  // attach new selection to "right"
  newSelection[SELECTION_NEXT] = current;

  // TODO: apply overlapping formats?
  return { selections: fromJS(head, reviver), idx };
}

export function getSelectionAtIdx(head, idx) {
  let selection = head;
  let i = 0;
  while (selection && i < idx) {
    selection = selection.get(SELECTION_NEXT);
    i += 1;
  }
  if (!selection) {
    console.error('Bad selection index: ', idx, head);
  }
  return selection;
}

/**
 * insert a new formatted selection
 * NOTE: getSelectionByContentOffset() does the hard work of carving out a new selection
 *  this function just puts it back BUT, also merges neighboring selections
 *  with identical formats
 */
export function replaceSelection(nodeModelArg, newSelection, idx) {
  const nodeModel = nodeModelArg;
  let head = getSelections(nodeModel);
  const current = internalGetSelectionAtIndex(head, idx);
  const updated = newSelection.toJS();
  // eslint-disable-next-line prefer-destructuring
  updated[SELECTION_NEXT] = current[SELECTION_NEXT];
  if (idx === 0) {
    head = updated;
    maybeMergeNodes(head, head[SELECTION_NEXT]);
  } else {
    const prev = internalGetSelectionAtIndex(head, idx - 1);
    prev[SELECTION_NEXT] = updated;
    maybeMergeNodes(updated, updated[SELECTION_NEXT]);
    maybeMergeNodes(prev, updated);
  }

  return setSelections(nodeModel, head);
}

export function splitSelectionsAtCaretOffset(
  leftNodeModelArg,
  rightNodeModelArg,
  caretStart
) {
  const leftNode = leftNodeModelArg;
  const rightNode = rightNodeModelArg;
  const head = getSelections(leftNode);
  let current = head;
  let caretPosition = 0;
  while (
    current[SELECTION_NEXT] &&
    caretStart > caretPosition + current[SELECTION_LENGTH]
  ) {
    caretPosition += current[SELECTION_LENGTH];
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  const headRightLength = current[SELECTION_NEXT]
    ? current[SELECTION_LENGTH] - (caretStart - caretPosition)
    : -1;
  let headRight;
  if (headRightLength === -1) {
    // split in the middle of last selection
    headRight = current;
  } else if (headRightLength === 0) {
    // split on the edge of 2 selections
    // eslint-disable-next-line prefer-destructuring
    headRight = current[SELECTION_NEXT];
  } else {
    // splits in middle of a selection
    headRight = {
      ...current,
      [SELECTION_LENGTH]: headRightLength
    };
  }
  current[SELECTION_LENGTH] = -1;
  current[SELECTION_NEXT] = undefined;
  return {
    leftNode: setSelections(leftNode, head),
    rightNode: setSelections(rightNode, headRight)
  };
}

export function concatSelections(leftModelArg, rightModelArg) {
  const leftModel = leftModelArg;
  // the left last selection length will be -1, figure out it's new length
  let { length: leftLastSelectionLength } = leftModel.get('content');
  const rightModel = rightModelArg;
  const head = getSelections(leftModel);
  const headRight = getSelections(rightModel);
  let current = head;
  while (current[SELECTION_NEXT]) {
    leftLastSelectionLength -= current[SELECTION_LENGTH];
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  // current is now the last left selection
  current[SELECTION_LENGTH] = leftLastSelectionLength;
  // attach right selections
  current[SELECTION_NEXT] = headRight;
  // same formats? merge
  if (selectionsHaveIdenticalFormats(current, headRight)) {
    if (!headRight[SELECTION_NEXT]) {
      current[SELECTION_LENGTH] = -1;
      current[SELECTION_NEXT] = undefined;
    } else {
      current[SELECTION_LENGTH] += headRight[SELECTION_LENGTH];
      // eslint-disable-next-line prefer-destructuring
      current[SELECTION_NEXT] = headRight[SELECTION_NEXT];
    }
  }
  return setSelections(leftModel, head);
}

/**
 * get an array of content sliced-up by selection lengths
 */
export function getContentBySelections(node) {
  let content = node.get('content');
  if (content === undefined || content === null) {
    content = '';
  }
  const head = getSelections(node);
  // if there's no selection or just one, return the whole string
  if (!head[SELECTION_NEXT]) {
    return [cleanTextOrZeroLengthPlaceholder(content)];
  }
  const pieces = [];
  let caretPosition = 0;
  let current = head;
  while (current) {
    const end =
      current[SELECTION_LENGTH] > -1
        ? caretPosition + current[SELECTION_LENGTH]
        : undefined;
    // NOTE: content.substring(undefined, undefined) works like: content.substring(0, content.length)
    const piece = content.substring(caretPosition, end);
    pieces.push(cleanTextOrZeroLengthPlaceholder(piece));
    caretPosition += current[SELECTION_LENGTH];
    // eslint-disable-next-line prefer-destructuring
    current = current[SELECTION_NEXT];
  }
  return pieces;
}

export function getSelectionsLength(node) {
  const head = node.getIn(['meta', 'selections']);
  let i = 0;
  let current = head;
  while (current) {
    i += 1;
    current = current.get(SELECTION_NEXT);
  }
  return i;
}
