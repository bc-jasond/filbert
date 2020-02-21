import { fromJS, List, Map, Record } from 'immutable';

import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LINK_URL,
  SELECTION_NEXT,
  SELECTION_LENGTH
} from '../../common/constants';
import { cleanTextOrZeroLengthPlaceholder } from '../../common/utils';
import { reviver } from './document-model';

export const Selection = Record({
  [SELECTION_NEXT]: undefined,
  [SELECTION_LENGTH]: -1,
  [SELECTION_ACTION_BOLD]: false,
  [SELECTION_ACTION_ITALIC]: false,
  [SELECTION_ACTION_CODE]: false,
  [SELECTION_ACTION_SITEINFO]: false,
  [SELECTION_ACTION_MINI]: false,
  [SELECTION_ACTION_STRIKETHROUGH]: false,
  [SELECTION_ACTION_LINK]: false,
  [SELECTION_LINK_URL]: ''
});

const selectionTypesInOrder = [
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL
];

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

/**
 * if any neighboring selections have the exact same formats - merge them
 */
function mergeAdjacentSelectionsWithSameFormats(nodeModel) {
  const firstSelection = getSelections(nodeModel);
  // convert to JS to avoid having to refresh all references to "next" on every change
  let current = firstSelection.toJS();
  // "head" of list
  let head = current;
  let didMerge = false;
  while (current) {
    const next = current[SELECTION_NEXT];
    if (!next) {
      break;
    }
    if (selectionsHaveDifferentFormats(current, next)) {
      current[SELECTION_NEXT] = next;
      current = next;
    } else {
      // if the formats are the same, just extend the current selection
      didMerge = true;
      if (next[SELECTION_LENGTH] === -1) {
        current[SELECTION_NEXT] = undefined;
        current[SELECTION_LENGTH] = -1;
        break;
      }
      current[SELECTION_NEXT] = next[SELECTION_NEXT];
      current[SELECTION_LENGTH] += next[SELECTION_LENGTH];
    }
  }
  if (!didMerge) {
    return nodeModel;
  }
  console.info('MERGE ADJACENT ', formatSelections(head));
  return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
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
    while (start > caretPosition + current[SELECTION_LENGTH]) {
      caretPosition += current[SELECTION_LENGTH];
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
 * removing existing overlapping selections
 * TODO: don't merge here, let upsertSelection() handle that
 */
export function getSelection(nodeModel, start, end) {
  // TODO: validation of start & end against nodeModel.get('content')?.length
  const length = end - start;
  // first see if the exact Selection already exists?
  let head = getSelections(nodeModel);
  let current = head;
  let prev;
  let caretPosition = 0;
  let idx = 0;
  while (current && caretPosition + current[SELECTION_LENGTH] <= start) {
    if (caretPosition === start && current[SELECTION_LENGTH] === length) {
      // found exact match in existing selections
      return { selections: fromJS(head, reviver), idx };
    }
    caretPosition += current[SELECTION_LENGTH];
    idx += 1;
    prev = current;
    current = current[SELECTION_NEXT];
  }
  // if we're here, we didn't find an exact match in existing selections
  let newSelection = {
    [SELECTION_LENGTH]: length,
    [SELECTION_NEXT]: undefined
  };
  // capture current length before mutation
  const prevCurrentLength = current[SELECTION_LENGTH];
  // adjust "left" length
  current[SELECTION_LENGTH] = start - caretPosition;
  // merge newSelection with current ("left")?
  if (selectionsHaveIdenticalFormats(current, newSelection)) {
    // since we're not applying all overlapping formats, merging just means adding length
    newSelection[SELECTION_LENGTH] += current[SELECTION_LENGTH];
    if (!prev) {
      // head was replaced
      head = newSelection;
    } else {
      prev[SELECTION_NEXT] = newSelection;
    }
  } else {
    // no merge, set left[next] to new selection
    current[SELECTION_NEXT] = newSelection;
  }
  // add original "left" length to caretPosition to preserve original selection lengths for further comparison
  caretPosition += prevCurrentLength;
  // skip any completely overlapped selections
  while (current && caretPosition <= end) {
    // note: order is different - reassign current then increment caretPosition
    current = current[SELECTION_NEXT];
    caretPosition += current[SELECTION_LENGTH];
  }
  // merge newSelection with current ("right")?
  if (selectionsHaveIdenticalFormats(current, newSelection)) {
    if (!current[SELECTION_NEXT]) {
      // new selection is the end selection
      newSelection[SELECTION_LENGTH] = -1;
      newSelection[SELECTION_NEXT] = undefined;
    } else {
      // adjust length and next
      newSelection[SELECTION_LENGTH] += current[SELECTION_LENGTH];
      newSelection[SELECTION_NEXT] = current[SELECTION_NEXT];
    }
  } else {
    // adjust "right" length (if not -1)
    current[SELECTION_LENGTH] = caretPosition - end;
    // attach new selection to "right"
    newSelection[SELECTION_NEXT] = current;
  }

  // insert a new selection over top of any existing selections
  // - create a new selection with length: length
  // -  (?),
  // - skip any completely overlapped selections
  // - adjust "right" length (if not -1), set new[next] to right
  // - return {}
  // edge cases:
  // - replaced head?
  // - new selection completely within existing selection - need to split
  // - replaced all selections?
  // TODO: apply overlapping formats?
  return { selections: fromJS(head, reviver), idx };
}

export function getSelectionAtIdx(nodeModel, idx) {
  let selection = nodeModel.getIn(['meta', 'selections']);
  let i = 0;
  while (selection && i < idx) {
    selection = selection.get(SELECTION_NEXT);
    i += 1;
  }
  if (!selection) {
    console.error('Bad selection index: ', idx, nodeModel);
  }
  return selection;
}

/**
 * insert a new formatted selection
 * TODO: merge adjacent selections with identical formats
 */
export function upsertSelection(nodeModelArg, newSelection, idx) {
  let nodeModel = nodeModelArg;
  let head = getSelections(nodeModel);
  let current = getSelectionAtIdx(nodeModelArg, idx).toJS();
  let updated = newSelection.toJS();
  updated[SELECTION_NEXT] = current[SELECTION_NEXT];
  if (idx === 0) {
    head = updated;
  } else {
    let prev = getSelectionAtIdx(nodeModelArg, idx - 1).toJS();
    prev[SELECTION_NEXT] = updated;
  }

  return setSelections(nodeModel, head);
}

/**
 * NOTE: this function returns an object of Left & Right selections List()s NOT a document nodeModel
 * the reason is because we don't have a Right model (don't have an id) yet.  I could make this so but, it seems reach-outy
 *
 * @param nodeModel
 * @param caretStart
 * @returns {leftNode: Map(), rightNode: Map()}
 */
export function splitSelectionsAtCaretOffset(
  leftNodeModelArg,
  rightNodeModelArg,
  caretStart
) {
  let leftNode = leftNodeModelArg;
  let rightNode = rightNodeModelArg;
  const head = getSelections(leftNode);
  let current = head;
  let caretPosition = 0;
  while (caretStart > caretPosition + current[SELECTION_LENGTH]) {
    caretPosition += current[SELECTION_LENGTH];
    current = current[SELECTION_NEXT];
  }
  let headRight = {
    ...current,
    [SELECTION_LENGTH]: caretStart - caretPosition
  };
  current[SELECTION_LENGTH] = -1;
  current[SELECTION_NEXT] = undefined;
  return {
    leftNode: setSelections(leftNode, head),
    rightNode: setSelections(rightNode, headRight)
  };
}

export function concatSelections(leftModelArg, rightModelArg) {
  let leftModel = leftModelArg;
  // the left last selection length will be -1, figure out it's new length
  let leftLastSelectionLength = leftModel.get('content');
  const rightModel = rightModelArg;
  let head = getSelections(leftModel);
  let headRight = getSelections(rightModel);
  let current = head;
  while (current[SELECTION_NEXT]) {
    leftLastSelectionLength -= current[SELECTION_LENGTH];
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
    current = current[SELECTION_NEXT];
  }
  return pieces;
}
