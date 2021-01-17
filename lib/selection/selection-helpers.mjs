import { isKeyed, Map, Record } from 'immutable';

import {
  cleanTextOrZeroLengthPlaceholder,
  s4,
  error,
  warn,
} from '@filbert/util';

// selection actions
export const SELECTION_ID = 'id';
export const SELECTION_NEXT = 'next';
export const SELECTION_LENGTH = 'length';
export const SELECTION_ACTION_BOLD = 'selection-bold';
export const SELECTION_ACTION_ITALIC = 'selection-italic';
export const SELECTION_ACTION_CODE = 'selection-code';
export const SELECTION_ACTION_SITEINFO = 'selection-siteinfo';
export const SELECTION_ACTION_MINI = 'selection-mini';
export const SELECTION_ACTION_STRIKETHROUGH = 'selection-strikethrough';
export const SELECTION_ACTION_LINK = 'selection-link';
export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';
export const SELECTION_LINK_URL = 'linkUrl';

export class Selection extends Record({
  [SELECTION_ID]: '', // unique id replaced in the constructor() below
  [SELECTION_NEXT]: undefined,
  [SELECTION_LENGTH]: -1,
  [SELECTION_ACTION_BOLD]: false,
  [SELECTION_ACTION_ITALIC]: false,
  [SELECTION_ACTION_CODE]: false,
  [SELECTION_ACTION_SITEINFO]: false,
  [SELECTION_ACTION_MINI]: false,
  [SELECTION_ACTION_STRIKETHROUGH]: false,
  [SELECTION_ACTION_LINK]: false,
  [SELECTION_LINK_URL]: '',
}) {
  constructor(obj = {}) {
    if (!obj[SELECTION_ID]) {
      obj[SELECTION_ID] = s4();
    }
    super(obj);
  }
}

export function reviver(key, value) {
  if (
    value.has(SELECTION_ID) &&
    value.has(SELECTION_NEXT) &&
    value.has(SELECTION_LENGTH)
  ) {
    return new Selection(value);
  }
  // ImmutableJS default behavior
  return isKeyed(value) ? value.toMap() : value.toList();
}

/**
 * for testing
 */
export function makeSelections(values) {
  let selections = Map();
  let current = new Selection({ [SELECTION_ID]: s4() });
  let prev;
  do {
    let [currentLength, ...currentValues] = values.shift();
    current = current.set(SELECTION_LENGTH, currentLength);
    currentValues.forEach((v) => {
      if (typeof v === 'object') {
        current = current.set(v.key, v.value);
      } else {
        current = current.set(v, true);
      }
    });
    if (prev) {
      prev = prev.set(SELECTION_NEXT, current.get(SELECTION_ID));
      selections = selections.set(prev.get(SELECTION_ID), prev);
    }
    selections = selections.set(current.get(SELECTION_ID), current);
    prev = current;
    current = new Selection({ [SELECTION_ID]: s4() });
  } while (values.length);
  return selections;
}
export function toArray(selections) {
  let current = findFirstSelection(selections);
  let output = [];
  while (current) {
    output.push(current.remove(SELECTION_ID).remove(SELECTION_NEXT).toJS());
    current = selections.get(current.get(SELECTION_NEXT));
  }
  return output;
}

export function formatSelections(selections) {
  if (!Map.isMap(selections) || selections.isEmpty()) {
    return '';
  }
  let current = findFirstSelection(selections);
  let output = 'head: ';
  while (current) {
    output = `${output}${current.get(SELECTION_LENGTH)}, ${current.get(
      SELECTION_NEXT
    )} | `;
    current = selections.get(current.get(SELECTION_NEXT));
  }
  return output;
}

/**
 * PRIVATE HELPERS
 */
function findFirstSelection(selections) {
  const idSeen = new Set();
  const nextSeen = new Set();
  if (!Map.isMap(selections)) {
    error('findFirstSelection() - not a Map()', selections);
    return [];
  }
  selections.forEach((node, id) => {
    idSeen.add(id);
    if (node.get(SELECTION_NEXT) && selections.get(node.get(SELECTION_NEXT))) {
      nextSeen.add(node.get(SELECTION_NEXT));
    }
  });
  const difference = [...idSeen].filter((id) => !nextSeen.has(id));
  if (difference.length > 1) {
    warn('findFirstSelection() - more than one head', difference);
  }
  return selections.get(difference[0]);
}
// returns "head" (first selection) or a placeholder
// convert to JS to avoid having to refresh all references to "next" on every change
export function getSelections(nodeModel) {
  const selections = nodeModel.getIn(['meta', 'selections'], Map());
  if (selections.size === 0) {
    return { head: new Selection(), selections };
  }
  return { head: findFirstSelection(selections), selections };
}
function setSelections(nodeModel, value) {
  // if there's only one Selection and it's "empty", delete it
  if (
    !value ||
    (value.size === 1 &&
      selectionsHaveIdenticalFormats(value.first(), new Selection()))
  ) {
    return nodeModel.deleteIn(['meta', 'selections']);
  }
  return nodeModel.setIn(['meta', 'selections'], value);
}

function selectionsHaveIdenticalFormats(left, right) {
  // remove non-formatting related fields
  const leftCompare = new Selection(left)
    .remove(SELECTION_ID)
    .remove(SELECTION_LENGTH)
    .remove(SELECTION_NEXT);
  const rightCompare = new Selection(right)
    .remove(SELECTION_ID)
    .remove(SELECTION_LENGTH)
    .remove(SELECTION_NEXT);
  // use built-in equals()
  return leftCompare.equals(rightCompare);
}

function maybeMergeSelections(left, right, selections) {
  // no merge if different formats
  if (!selectionsHaveIdenticalFormats(left, right)) {
    return { next: right, selections };
  }
  // if we're past the end or on the last node
  if (!right || !right.get(SELECTION_NEXT)) {
    left = left.remove(SELECTION_LENGTH).remove(SELECTION_NEXT);
    selections = selections.set(left.get(SELECTION_ID), left);
    if (right) {
      selections = selections.remove(right.get(SELECTION_ID));
    }
    return { next: left, selections };
  }
  left = left
    .set(
      SELECTION_LENGTH,
      left.get(SELECTION_LENGTH) + right.get(SELECTION_LENGTH)
    )
    .set(SELECTION_NEXT, right.get(SELECTION_NEXT));
  return {
    next: left,
    selections: selections
      .set(left.get(SELECTION_ID), left)
      .remove(right.get(SELECTION_ID)),
  };
}
/* eslint-enable no-param-reassign, prefer-destructuring */

// uses vanilla JS instead of Immutable
function internalGetSelectionAtIndex(selections, head, idx) {
  let current = head;
  let i = 0;
  while (current && i < idx) {
    // eslint-disable-next-line prefer-destructuring
    current = selections.get(current.get(SELECTION_NEXT));
    i += 1;
  }
  if (!current) {
    throw new Error(`Bad selection index\n${JSON.stringify({ idx, head })}`);
  }
  return current;
}

function transferFormats(leftArg, right) {
  let left = leftArg;
  [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_LINK,
  ].forEach((fmt) => {
    // eslint-disable-next-line no-param-reassign
    left = left.set(fmt, left.get(fmt) || right.get(fmt));
  });
  return left;
}

/**
 * PUBLIC API
 *
 *
 * Every public export calls this to keep shit on the level.
 * FOR POSTERITY: This has been the single most difficult function to design in the whole codebase
 * bugs and regressions here over and over again finally prompted adding the first tests with jest, there's probably still bugs
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
  const contentLength = nodeModel.get('content')
    ? nodeModel.get('content').length
    : 0;
  // validate input
  if (
    // can't start before 0
    start < 0 ||
    // trying to delete too far left (past 0)
    start + count < 0 ||
    // trying to delete from too far right
    (doesRemoveCharacters && start > beforeContent.length) ||
    // trying to add too many characters
    (!doesRemoveCharacters && start + count > contentLength)
  ) {
    throw new Error(
      `adjustSelectionOffsetsAndCleanup out of bounds!\n${JSON.stringify(
        nodeModel.toJS()
      )}\n${start}\n${count}`
    );
  }

  let { head, selections } = getSelections(nodeModel);
  console.info(
    'ADJUST         ',
    formatSelections(selections),
    ' -- offset: ',
    start,
    ' count: ',
    count
  );
  // if there's only 1 selection, no-op
  if (!head.get(SELECTION_NEXT)) {
    return nodeModel;
  }
  let current = head;
  let prev;
  let caretPosition = 0;
  // if we're ADDING content
  if (!doesRemoveCharacters) {
    // find the selection
    while (
      current.get(SELECTION_NEXT) &&
      start >= caretPosition + current.get(SELECTION_LENGTH)
    ) {
      caretPosition += current.get(SELECTION_LENGTH);
      // eslint-disable-next-line prefer-destructuring
      current = selections.get(current.get(SELECTION_NEXT));
    }
    // and increase it's length if it's not at the end
    if (current.get(SELECTION_NEXT)) {
      current = current.set(
        SELECTION_LENGTH,
        current.get(SELECTION_LENGTH) + count
      );
      return setSelections(
        nodeModel,
        selections.set(current.get(SELECTION_ID), current)
      );
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
  // loop through all selections
  let didSkip = false;
  let didDelete = false;
  while (current) {
    // capture this value before we mutate it - give last selection a length for comparison (it will be -1)
    const currentLength =
      current.get(SELECTION_LENGTH) === -1
        ? beforeContent.length - caretPosition
        : current.get(SELECTION_LENGTH);
    if (
      caretPosition >= deleteCaretStart &&
      caretPosition + currentLength <= start
    ) {
      // whole selection was deleted
      didSkip = true;
      selections = selections.remove(current.get(SELECTION_ID));
    } else {
      // selection completely overlaps highlight?
      if (
        caretPosition <= deleteCaretStart &&
        caretPosition + currentLength >= start
      ) {
        current = current.set(SELECTION_LENGTH, currentLength + count); // count is negative
      }
      // selection overlaps to the left?
      else if (
        caretPosition < deleteCaretStart &&
        caretPosition + currentLength > deleteCaretStart
      ) {
        current = current.set(
          SELECTION_LENGTH,
          deleteCaretStart - caretPosition
        );
      }
      // selection overlaps to the right?
      else if (
        current.get(SELECTION_NEXT) &&
        caretPosition < start &&
        caretPosition + currentLength > start
      ) {
        current = current.set(
          SELECTION_LENGTH,
          caretPosition + currentLength - start
        );
      }
      selections = selections.set(current.get(SELECTION_ID), current);

      if (prev && didSkip) {
        didSkip = false;
        if (!selectionsHaveIdenticalFormats(prev, current)) {
          prev = prev.set(SELECTION_NEXT, current.get(SELECTION_ID));
          selections = selections.set(prev.get(SELECTION_ID), prev);
        } else if (current.get(SELECTION_NEXT)) {
          // merge new neighbors with same formats here
          prev = prev
            .set(
              SELECTION_LENGTH,
              prev.get(SELECTION_LENGTH) + current.get(SELECTION_LENGTH)
            )
            .set(SELECTION_NEXT, current.get(SELECTION_NEXT));
          selections = selections
            .set(prev.get(SELECTION_ID), prev)
            .remove(current.get(SELECTION_ID));
        } else {
          // the last selection has same formats as prev and needs to be "merged" - just delete
          didDelete = true;
          selections = selections.remove(current.get(SELECTION_ID));
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
    current = selections.get(current.get(SELECTION_NEXT));
  }
  // prev should be last node
  selections = selections.set(
    prev.get(SELECTION_ID),
    prev.remove(SELECTION_LENGTH).remove(SELECTION_NEXT)
  );

  return setSelections(nodeModel, selections);
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
  const doesReplaceHead = start === 0;
  const doesReplaceLastSelection = end === nodeModel.get('content', '').length;
  // first see if the exact Selection already exists?
  let { head, selections } = getSelections(nodeModel);
  if (doesReplaceHead) {
    selections = selections.remove(head.get(SELECTION_ID));
  }
  let current = head;
  let prev;
  let shouldSkipSetPrev = false;
  let caretPosition = 0;
  // let idx = 0;
  let newSelection = new Selection({ [SELECTION_LENGTH]: length });

  while (current) {
    const currentStart = caretPosition;
    const currentIsLastSelection = !current.get(SELECTION_NEXT);
    const currentEnd =
      current.get(SELECTION_LENGTH) === -1
        ? nodeModel.get('content').length
        : caretPosition + current.get(SELECTION_LENGTH);
    // exact match
    if (start === currentStart && end === currentEnd) {
      return { updatedNodeModel: nodeModel, id: current.get(SELECTION_ID) };
    }
    // overlap left
    if (
      (start === currentStart && end < currentEnd) ||
      // coming from replace multiple selections below
      (start < currentStart && end > currentStart && end <= currentEnd)
    ) {
      newSelection = transferFormats(newSelection, current);
      if (!currentIsLastSelection) {
        current = current.set(SELECTION_LENGTH, currentEnd - end);
        selections = selections.set(
          current.get(SELECTION_ID),
          current.set(SELECTION_LENGTH, currentEnd - end)
        );
      }
      if (doesReplaceLastSelection || current.get(SELECTION_LENGTH) === 0) {
        // eslint-disable-next-line prefer-destructuring
        newSelection = newSelection.set(
          SELECTION_NEXT,
          current.get(SELECTION_NEXT)
        );
      } else {
        newSelection = newSelection.set(
          SELECTION_NEXT,
          current.get(SELECTION_ID)
        );
      }
      selections = selections.set(newSelection.get(SELECTION_ID), newSelection);

      return {
        updatedNodeModel: setSelections(nodeModel, selections), //fromJS(doesReplaceHead ? newSelection : head, reviver),
        id: newSelection.get(SELECTION_ID), //doesReplaceHead ? 0 : idx,
      };
    }
    // overlap completely - middle
    if (start > currentStart && end < currentEnd) {
      let currentRight = new Selection();
      currentRight = transferFormats(currentRight, current);
      newSelection = transferFormats(newSelection, current);
      current = current
        .set(SELECTION_LENGTH, start - currentStart)
        .set(SELECTION_NEXT, newSelection.get(SELECTION_ID));
      newSelection = newSelection.set(
        SELECTION_NEXT,
        currentRight.get(SELECTION_ID)
      );
      if (!currentIsLastSelection) {
        currentRight = currentRight.set(SELECTION_LENGTH, currentEnd - end);
      }
      // idx += 1;
      // return { selections: fromJS(head, reviver), idx };
      return {
        updatedNodeModel: setSelections(
          nodeModel,
          selections
            .set(current.get(SELECTION_ID), current)
            .set(newSelection.get(SELECTION_ID), newSelection)
            .set(currentRight.get(SELECTION_ID), currentRight)
        ),
        id: newSelection.get(SELECTION_ID),
      };
    }
    // overlap completely - right
    if (start > currentStart && end === currentEnd) {
      newSelection = transferFormats(newSelection, current);
      // eslint-disable-next-line prefer-destructuring
      newSelection = newSelection.set(
        SELECTION_NEXT,
        current.get(SELECTION_NEXT)
      );
      current = current
        .set(SELECTION_LENGTH, start - currentStart)
        .set(SELECTION_NEXT, newSelection.get(SELECTION_ID));
      // idx += 1;
      if (doesReplaceLastSelection) {
        newSelection = newSelection.remove(SELECTION_LENGTH);
      }
      //return { selections: fromJS(head, reviver), idx };
      return {
        updatedNodeModel: setSelections(
          nodeModel,
          selections
            .set(newSelection.get(SELECTION_ID), newSelection)
            .set(current.get(SELECTION_ID), current)
        ),
        id: newSelection.get(SELECTION_ID),
      };
    }
    // MULTI new selection spans more than one existing selection
    // overlap left - handled above
    // contains - new selection contains > 1 existing selection
    if (start <= currentStart && end >= currentEnd) {
      newSelection = transferFormats(newSelection, current);
      if (doesReplaceLastSelection) {
        newSelection = newSelection
          .remove(SELECTION_LENGTH)
          .remove(SELECTION_NEXT);
        selections = selections.set(
          newSelection.get(SELECTION_ID),
          newSelection
        );
      }
      if (prev && !shouldSkipSetPrev) {
        prev = prev.set(SELECTION_NEXT, newSelection.get(SELECTION_ID));
        selections = selections.set(prev.get(SELECTION_ID), prev);
        shouldSkipSetPrev = true;
      }
    }
    // overlap right
    else if (end > currentEnd && start >= currentStart && start < currentEnd) {
      newSelection = transferFormats(newSelection, current);
      const currentBak = current;
      current = current
        .set(SELECTION_LENGTH, start - currentStart)
        .set(SELECTION_NEXT, newSelection);
      current = currentBak;
      prev = newSelection;
      // idx += 1;
      shouldSkipSetPrev = true;
    }

    caretPosition += current.get(SELECTION_LENGTH);
    if (!shouldSkipSetPrev) {
      // idx += 1;
      prev = current;
    }
    // eslint-disable-next-line prefer-destructuring
    current = selections.get(current.get(SELECTION_NEXT));
  }

  throw new Error(
    `Shouldn't ever get here...\n${JSON.stringify({
      current,
      prev,
      // idx,
      nodeModel,
      start,
      end,
    })}`
  );
}

/**
  the same as `internalGetSelectionAtIndex()` above except uses Immutable
 */
export function getSelectionAtIdx(head, idx) {
  let selection = head;
  let i = 0;
  while (selection && i < idx) {
    selection = selection.get(SELECTION_NEXT);
    i += 1;
  }
  if (!selection) {
    throw new Error(`Bad selection index\n${JSON.stringify({ idx, head })}`);
  }
  return selection;
}

/**
 * insert a new formatted selection
 * NOTE: getSelectionByContentOffset() does the hard work of carving out a new selection
 *  this function just puts it back BUT, also merges neighboring selections
 *  with identical formats
 */
export function replaceSelection(nodeModelArg, updatedSelection) {
  const nodeModel = nodeModelArg;
  let { head, selections } = getSelections(nodeModel);
  if (!selections.get(updatedSelection.get(SELECTION_ID))) {
    throw new Error(
      `replaceSelection() - bad selection\n${JSON.stringify(
        selections.toJS()
      )}\n${JSON.stringify(updatedSelection.toJS())}`
    );
  }
  // replace updated Selection
  selections = selections.set(
    updatedSelection.get(SELECTION_ID),
    updatedSelection
  );

  // maybe merge prev & next neighbors if they have the same formats
  let prev;
  // refresh head from selections because it might have been replaced
  let current = selections.get(head.get(SELECTION_ID));
  let next;
  while (
    updatedSelection.get(SELECTION_ID) !== current.get(SELECTION_ID) &&
    current.get(SELECTION_NEXT)
  ) {
    prev = current;
    current = selections.get(current.get(SELECTION_NEXT));
  }
  if (current.get(SELECTION_NEXT)) {
    next = selections.get(current.get(SELECTION_NEXT));
  }
  if (prev) {
    ({ next: current, selections } = maybeMergeSelections(
      prev,
      current,
      selections
    ));
  }
  if (next) {
    ({ selections } = maybeMergeSelections(current, next, selections));
  }

  return setSelections(nodeModel, selections);
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
      [SELECTION_LENGTH]: headRightLength,
    };
  }
  current[SELECTION_LENGTH] = -1;
  current[SELECTION_NEXT] = undefined;
  return {
    leftNode: setSelections(leftNode, head),
    rightNode: setSelections(rightNode, headRight),
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
