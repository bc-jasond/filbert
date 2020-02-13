import { List, Record } from 'immutable';

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
    (acc, key) => acc || left.get(key) !== right.get(key),
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
  // compare beforeContent length for delete operations, nodeMode.get('content') for add operations
  const contentLength = Math.max(
    nodeModel.get('content', '').length,
    beforeContent.length
  );
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
    count,
    ' content length: ',
    contentLength
  );
  // if there's only 1 selection, no-op
  if (!firstSelection.get(SELECTION_NEXT)) {
    return nodeModel;
  }
  let head = firstSelection.toJS();
  let current = head;
  let caretPosition = 0;
  // if we're adding content
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
  // if we're deleting content:
  // find the start selection
  while (start > caretPosition + current[SELECTION_LENGTH]) {
    caretPosition += current[SELECTION_LENGTH];
    current = current[SELECTION_NEXT];
  }
  // adjust the start selection length
  // deleted only inside this selection?
  if (start + count - caretPosition <= current[SELECTION_LENGTH]) {
    // decrease it's length
    current[SELECTION_LENGTH] -= count;
    return nodeModel.setIn(['meta', 'selections'], fromJS(head, reviver));
  }
  const deleteStartSelection = current;
  // find the end selection
  while (start + count > caretPosition + current[SELECTION_LENGTH]) {
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
  let newSelection = selections.find(
    s => s.get(SELECTION_START) === start && s.get(SELECTION_END) === end,
    null,
    Selection()
  );
  // selection already exists?
  if (newSelection.get(SELECTION_END) === end) {
    return newSelection;
  }
  newSelection = newSelection
    .set(SELECTION_START, start)
    .set(SELECTION_END, end);
  // this is the first selection
  if (selections.size === 0) {
    return newSelection;
  }

  newSelection = selectionTypesInOrder
    // don't set link meta data
    .filter(t => t !== SELECTION_LINK_URL)
    // set all to true for && mask against all overlapping selections
    .reduce((selection, type) => selection.set(type, true), newSelection);

  // applyFormatsOfOverlappingSelections
  // applies "intersection" of formats from all overlapping Selections
  return selections
    .filter(
      s =>
        // newSelection overlaps s to the right
        (newSelection.get(SELECTION_START) >= s.get(SELECTION_START) &&
          newSelection.get(SELECTION_START) <= s.get(SELECTION_END)) ||
        // newSelection overlaps s to the left
        (newSelection.get(SELECTION_END) >= s.get(SELECTION_START) &&
          newSelection.get(SELECTION_END) <= s.get(SELECTION_END)) ||
        // newSelection envelops s completely
        (newSelection.get(SELECTION_START) < s.get(SELECTION_START) &&
          newSelection.get(SELECTION_END) > s.get(SELECTION_END)) ||
        // newSelection is completely enveloped by s
        (newSelection.get(SELECTION_START) >= s.get(SELECTION_START) &&
          newSelection.get(SELECTION_END) <= s.get(SELECTION_END))
    )
    .unshift(newSelection)
    .reduce(
      (acc, selection) =>
        acc.mergeWith((oldVal, newVal, key) => {
          // don't blow away non-formatting related values like SELECTION_START or SELECTION_END
          if (
            [SELECTION_START, SELECTION_END, SELECTION_LINK_URL].includes(key)
          ) {
            return oldVal;
          }
          // NOTE: for "union" of all formats use ||, for "intersection" of all formats use &&
          return newVal || oldVal;
        }, selection),
      newSelection
    );
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
  nodeModel = adjustSelectionOffsetsAndCleanup(nodeModel);
  return mergeAdjacentSelectionsWithSameFormats(nodeModel);
}

/**
 * NOTE: this function returns an object of Left & Right selections List()s NOT a document nodeModel
 * the reason is because we don't have a Right model (don't have an id) yet.  I could make this so but, it seems reach-outy
 *
 * @param nodeModel
 * @param caretStart
 * @returns {leftNode, rightNode}
 */
export function splitSelectionsAtCaretOffset(
  leftNodeModelArg,
  rightNodeModelArg,
  caretStart
) {
  let left = List();
  let right = List();
  let leftNode = leftNodeModelArg;
  let rightNode = rightNodeModelArg;
  const selections = getSelections(leftNode);
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // const currentJS = current.toJS();
    if (current.get(SELECTION_END) <= caretStart) {
      left = left.push(current);
    } else if (current.get(SELECTION_START) >= caretStart) {
      right = right.push(
        current
          .set(SELECTION_START, current.get(SELECTION_START) - caretStart)
          .set(SELECTION_END, current.get(SELECTION_END) - caretStart)
      );
    } else {
      // caretStart must be in the middle of a selection, split
      left = left.push(current.set(SELECTION_END, caretStart));
      right = right.push(
        current
          .set(SELECTION_START, 0)
          .set(SELECTION_END, current.get(SELECTION_END) - caretStart)
      );
    }
  }
  leftNode = setSelections(leftNode, left);
  leftNode = adjustSelectionOffsetsAndCleanup(leftNode);
  leftNode = mergeAdjacentSelectionsWithSameFormats(leftNode);
  rightNode = setSelections(rightNode, right);
  rightNode = adjustSelectionOffsetsAndCleanup(rightNode);
  rightNode = mergeAdjacentSelectionsWithSameFormats(rightNode);
  return { leftNode, rightNode };
}

export function concatSelections(leftModelArg, rightModelArg) {
  let leftModel = leftModelArg;
  const rightModel = rightModelArg;
  const left = getSelections(leftModel);
  const right = getSelections(rightModel);
  let newSelections = left.slice();
  let leftOffset = left.last(Selection()).get(SELECTION_END);
  if (leftOffset === -1) {
    // left node has no selections - substitute content length
    // NOTE: left and right content has already been merged, subtract the right length!
    leftOffset =
      leftModel.get('content', '').length -
      rightModel.get('content', '').length;
  }
  // add all right selections with left offsets
  // NOTE: if left.last() and right.first() have the same formats, they'll be merged in mergeAdjacent
  for (let i = 0; i < right.size; i++) {
    const current = right.get(i);
    newSelections = newSelections.push(
      current
        .set(SELECTION_START, current.get(SELECTION_START) + leftOffset)
        .set(SELECTION_END, current.get(SELECTION_END) + leftOffset)
    );
  }
  leftModel = setSelections(leftModel, newSelections);
  leftModel = adjustSelectionOffsetsAndCleanup(leftModel);
  return mergeAdjacentSelectionsWithSameFormats(leftModel);
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

export function getSelectionKey(s) {
  return `${s.get(SELECTION_START)}-${s.get(
    SELECTION_END
  )}-${selectionTypesInOrder.map(fmt => (s.get(fmt) ? 1 : 0)).join('-')}`;
}
