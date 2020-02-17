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
function getSelections(nodeModel) {
  return nodeModel.getIn(['meta', 'selections'], Selection());
}
function setSelections(nodeModel, value) {
  return nodeModel.setIn(['meta', 'selections'], value);
}
function getLastSelection(selections) {
  const queue = [selections];
  while (queue.length) {
    const current = queue.shift();
    if (!current.get(SELECTION_NEXT)) {
      return current;
    }
  }
  throw new Error('getLastSelection - cycle!');
}

function selectionsHaveDifferentFormats(left, right) {
  return selectionTypesInOrder.reduce(
    (acc, key) => acc || left[key] !== right[key],
    false
  );
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
    start + count < 0
  ) {
    throw new Error(
      `adjustSelectionOffsetsAndCleanup negative out of bounds!\n${JSON.stringify(
        nodeModel.toJS()
      )}\n${start}\n${count}`
    );
  }

  const firstSelection = getSelections(nodeModel);
  console.info(
    'ADJUST         ',
    formatSelections(firstSelection),
    ' -- offset: ',
    start,
    ' count: ',
    count
  );
  // if there's only 1 selection, no-op
  if (!firstSelection.get(SELECTION_NEXT)) {
    return nodeModel;
  }
  let head = firstSelection.toJS();
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
      return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
    }
    return nodeModel;
  }
  //
  // if we're DELETING content:
  //
  let deleteCaretStart = start + count; // count is negative
  const didDeleteThroughBeginning = deleteCaretStart === 0;
  const didDeleteThroughEnd = start === beforeContent.length;
  // deleted through the beginning?  set start to end
  if (didDeleteThroughBeginning) {
    deleteCaretStart = start;
  }
  // find the start selection
  while (deleteCaretStart >= caretPosition + current[SELECTION_LENGTH]) {
    caretPosition += current[SELECTION_LENGTH];
    prev = current;
    current = current[SELECTION_NEXT];
  }
  // deleted only inside one selection OR through beginning OR through end?
  if (
    didDeleteThroughBeginning ||
    didDeleteThroughEnd ||
    start - caretPosition <= current[SELECTION_LENGTH]
  ) {
    // update (decrease or remove) it's length
    if (didDeleteThroughEnd) {
      delete current[SELECTION_LENGTH];
      delete current[SELECTION_NEXT];
    } else {
      current[SELECTION_LENGTH] -= start - caretPosition;
      // if we deleted this node, advance the pointer
      if (current[SELECTION_LENGTH] === 0) {
        prev[SELECTION_NEXT] = current[SELECTION_NEXT];
      }
    }
    // deleted through beginning?
    head = didDeleteThroughBeginning ? current : head;
    return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
  }
  // user deleted somewhere in the middle across more than one selection...
  const deleteStartSelection = current;
  // find the end selection
  while (deleteCaretStart >= caretPosition + current[SELECTION_LENGTH]) {
    caretPosition += current[SELECTION_LENGTH];
    current = current[SELECTION_NEXT];
  }
  // deleted through the end?
  if (!current) {
    delete deleteStartSelection[SELECTION_LENGTH];
    delete deleteStartSelection[SELECTION_NEXT];
    return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
  }

  // adjust start selection length and next
  deleteStartSelection[SELECTION_LENGTH] = start - caretPosition;
  deleteStartSelection[SELECTION_NEXT] = current;

  // adjust end selection length
  current[SELECTION_LENGTH] -= count - caretPosition;

  // deleted head?
  if (start === 0 && current !== head) {
    head = current;
  }

  return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
}

/**
 * NOTE: returns Selection for the format selection menu
 * @param nodeModel
 * @param start
 * @param end
 * @returns {Selection}
 */
export function getSelection(nodeModel, start, end) {
  const firstSelection = getSelections(nodeModel);
  const length = end - start;
  // first see if the exact Selection already exists?
  let head = firstSelection.toJS();
  let current = head;
  let caretPosition = 0;
  while (current && caretPosition <= start) {
    if (caretPosition === start && current[SELECTION_LENGTH] === length) {
      return fromJS(current, reviver);
    }
    caretPosition += current[SELECTION_LENGTH];
    current = current[SELECTION_NEXT];
  }
  // if we're here, we didn't find an exact match in existing selections
  // TODO: apply overlapping formats?
  return Selection();
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
export function upsertSelection(nodeModelArg, newSelection) {
  let didPushNewSelection = false;
  let newSelections = List();
  let nodeModel = nodeModelArg;
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    newSelections = newSelections.push(newSelection);
  }
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // current selection IS newSelection
    if (
      current.get(SELECTION_START) === newSelection.get(SELECTION_START) &&
      current.get(SELECTION_END) === newSelection.get(SELECTION_END)
    ) {
      newSelections = newSelections.push(newSelection);
      didPushNewSelection = true;
    }
    // current selection doesn't overlap - push it
    else if (
      current.get(SELECTION_END) <= newSelection.get(SELECTION_START) ||
      current.get(SELECTION_START) >= newSelection.get(SELECTION_END)
    ) {
      newSelections = newSelections.push(current);
    } else {
      // current selection overlaps to the left
      if (current.get(SELECTION_START) < newSelection.get(SELECTION_START)) {
        newSelections = newSelections.push(
          current.set(SELECTION_END, newSelection.get(SELECTION_START))
        );
      }
      // push new selection
      if (!didPushNewSelection) {
        newSelections = newSelections.push(newSelection);
        didPushNewSelection = true;
      }
      // current selection overlaps to the right
      if (current.get(SELECTION_END) > newSelection.get(SELECTION_END)) {
        newSelections = newSelections.push(
          current.set(SELECTION_START, newSelection.get(SELECTION_END))
        );
      }
      // current selection falls completely within newSelection - skip since it's styles have already been merged with `applyFormatsOfOverlappingSelections` (noop)
      // if (current.get(SELECTION_START) >= newSelection.get(SELECTION_START) && current.get(SELECTION_END) <= newSelection.get(SELECTION_END)) {
      //   continue;
      // }
    }
  }

  nodeModel = setSelections(nodeModel, newSelections);
  return adjustSelectionOffsetsAndCleanup(nodeModel);
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
  const head = getSelections(leftNode).toJS();
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
  delete current[SELECTION_LENGTH];
  delete current[SELECTION_NEXT];
  return {
    leftNode: setSelections(leftNode, fromJS(head, reviver)),
    rightNode: setSelections(rightNode, fromJS(headRight, reviver))
  };
}

export function concatSelections(leftModelArg, rightModelArg) {
  let leftModel = leftModelArg;
  // the left last selection length will be -1, figure out it's new length
  let leftLastSelectionLength = leftModel.get('content');
  const rightModel = rightModelArg;
  let head = getSelections(leftModel).toJS();
  let headRight = getSelections(rightModel).toJS();
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
  if (!selectionsHaveDifferentFormats(current, headRight)) {
    if (!headRight[SELECTION_NEXT]) {
      delete current[SELECTION_LENGTH];
      delete current[SELECTION_NEXT];
    } else {
      current[SELECTION_LENGTH] += headRight[SELECTION_LENGTH];
      current[SELECTION_NEXT] = headRight[SELECTION_NEXT];
    }
  }
  return setSelections(leftModel, fromJS(head, reviver));
}

export function getContentForSelection(node, selection) {
  let content = node.get('content');
  if (content === undefined || content === null) {
    content = '';
  }
  if (!Record.isRecord(selection)) {
    return cleanTextOrZeroLengthPlaceholder(content);
  }
  const startOffset = selection.get(SELECTION_START, -1);
  const endOffset = selection.get(SELECTION_END, Number.MAX_SAFE_INTEGER);
  if (
    startOffset > content.length ||
    startOffset < 0 ||
    endOffset > content.length ||
    endOffset < 0
  ) {
    throw new Error(
      `getContentForSelection - Selection offsets are out of bounds!\nContent: ${content}\nSelection: ${JSON.stringify(
        selection.toJS()
      )}`
    );
  }
  // NOTE: content.substring(undefined, undefined) works like: content.substring(0, content.length)
  return cleanTextOrZeroLengthPlaceholder(
    content.substring(startOffset, endOffset)
  );
}
