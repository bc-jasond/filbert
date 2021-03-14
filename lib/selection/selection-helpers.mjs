import immutable from 'immutable';
import {
  LINKED_LIST_NODE_ID,
  LINKED_LIST_NODE_NEXT_ID,
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODES_MAP,
  linkedListFromJS,
  append,
  head,
  getNext,
  replace,
  remove,
  isTail,
  isEmpty,
  size,
  tail,
  copy,
  getId,
  getNode,
  getPrev,
} from '@filbert/linked-list';
import { cleanTextOrZeroLengthPlaceholder, info } from '@filbert/util';

const { Map } = immutable;

// selection actions
export const SELECTION_LENGTH = 'length';
export const SELECTION_ACTION_BOLD = 'selection-bold';
export const SELECTION_ACTION_ITALIC = 'selection-italic';
export const SELECTION_ACTION_CODE = 'selection-code';
export const SELECTION_ACTION_SITEINFO = 'selection-siteinfo';
export const SELECTION_ACTION_MINI = 'selection-mini';
export const SELECTION_ACTION_STRIKETHROUGH = 'selection-strikethrough';
export const SELECTION_ACTION_LINK = 'selection-link';
export const SELECTION_LINK_URL = 'linkUrl';

export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';

// Format node helpers
export function bold(node) {
  return node.get(SELECTION_ACTION_BOLD);
}
export function setBold(node, value) {
  return value
    ? node.set(SELECTION_ACTION_BOLD, true)
    : node.remove(SELECTION_ACTION_BOLD);
}
export function italic(node) {
  return node.get(SELECTION_ACTION_ITALIC);
}
export function setItalic(node, value) {
  return value
    ? node.set(SELECTION_ACTION_ITALIC, true)
    : node.remove(SELECTION_ACTION_ITALIC);
}
export function code(node) {
  return node.get(SELECTION_ACTION_CODE);
}
export function setCode(node, value) {
  return value
    ? node.set(SELECTION_ACTION_CODE, true)
    : node.remove(SELECTION_ACTION_CODE);
}
export function siteinfo(node) {
  return node.get(SELECTION_ACTION_SITEINFO);
}
export function setSiteinfo(node, value) {
  return value
    ? node.set(SELECTION_ACTION_SITEINFO, true)
    : node.remove(SELECTION_ACTION_SITEINFO);
}
export function mini(node) {
  return node.get(SELECTION_ACTION_MINI);
}
export function setMini(node, value) {
  return value
    ? node.set(SELECTION_ACTION_MINI, true)
    : node.remove(SELECTION_ACTION_MINI);
}
export function strikethrough(node) {
  return node.get(SELECTION_ACTION_STRIKETHROUGH);
}
export function setStrikethrough(node, value) {
  return value
    ? node.set(SELECTION_ACTION_STRIKETHROUGH, true)
    : node.remove(SELECTION_ACTION_STRIKETHROUGH);
}
export function link(node) {
  return node.get(SELECTION_ACTION_LINK);
}
export function setLink(node, value) {
  return value
    ? node.set(SELECTION_ACTION_LINK, true)
    : node.remove(SELECTION_ACTION_LINK);
}
export function linkUrl(node) {
  return node.get(SELECTION_LINK_URL);
}
export function setLinkUrl(node, value) {
  if (typeof value !== 'string') {
    value = '';
  }
  return node.set(SELECTION_LINK_URL, value);
}
export function length(node) {
  return node.get(SELECTION_LENGTH, -1);
}
export function setLength(node, value) {
  return node.set(SELECTION_LENGTH, value ? value : -1);
}

export function hasIdenticalFormats(left, right) {
  let isEqual = true;
  // compare only formatting related fields
  [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
  ].forEach((key) => {
    // allow cast to falsy
    if (left.get(key, false) != right.get(key, false)) {
      isEqual = false;
    }
  });
  return isEqual;
}

/**
 * all formats from this and that
 */
export function unionFormats(left, right) {
  [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
  ].forEach((key) => {
    if (left.get(key) === undefined && right.get(key) === undefined) {
      return;
    }
    left = left.set(key, left.get(key) || right.get(key));
  });
  return left;
}

export function maybeMergeSelections(formatSelections, left, right) {
  // handle empty input OR no merge if different formats, return the right node as "next"
  if (
    left.size === 0 ||
    right.size === 0 ||
    !hasIdenticalFormats(left, right)
  ) {
    return { formatSelections, selection: right };
  }

  left = setLength(left, length(left) + length(right));
  formatSelections = replace(formatSelections, left);
  formatSelections = remove(formatSelections, right);
  return { formatSelections, selection: getNode(formatSelections, left) };
}

/**
 * find the FormatSelectionNode that contains start (a collapsed caret position) and increase length by count
 */
function adjustSelectionOffsetsAdd(formatSelections, start, count) {
  let current = head(formatSelections);
  if (!current.size) {
    return formatSelections;
  }
  let caretPosition = 0;
  // find the selection
  let next = getNext(formatSelections, current);
  while (next.size && start >= caretPosition + length(current)) {
    caretPosition += length(current);
    current = next;
    next = getNext(formatSelections, current);
  }
  // and increase it's length
  current = setLength(current, length(current) + count);
  return cleanTail(replace(formatSelections, current));
}

/**
 * TODO: split into "collapsed" & "range" caret helpers?
 * adjust the size / remove format selections after a delete operation
 */
function adjustSelectionOffsetsRemove(
  formatSelections,
  contentLengthBeforeUpdate,
  start,
  count
) {
  let current = head(formatSelections);
  let caretPosition = 0;
  let formatSelectionsAdjusted = linkedListFromJS();
  // did we delete all content for the node? - count is negative
  if (contentLengthBeforeUpdate + count === 0) {
    // return empty selections
    return formatSelectionsAdjusted;
  }
  // since count is negative, start is actually the caret end :) - find the start
  const deleteCaretStart = start + count; // count is negative
  // loop through all selections
  while (current.size) {
    // give last selection a length for comparison (it will be -1)
    const currentLength =
      length(current) === -1
        ? contentLengthBeforeUpdate - caretPosition
        : length(current);
    let newLength = currentLength;
    if (
      caretPosition >= deleteCaretStart &&
      caretPosition + currentLength <= start
    ) {
      // whole selection was deleted, skip
      caretPosition += currentLength;
      current = getNext(formatSelections, current);
      continue;
    }
    // selection completely overlaps caret range?
    if (
      caretPosition <= deleteCaretStart &&
      caretPosition + currentLength >= start
    ) {
      newLength = currentLength + count; // count is negative
    }
    // selection overlaps to the left?
    else if (
      caretPosition < deleteCaretStart &&
      caretPosition + currentLength > deleteCaretStart
    ) {
      newLength = deleteCaretStart - caretPosition;
    }
    // selection overlaps to the right?
    else if (
      !isTail(formatSelections, current) &&
      caretPosition < start &&
      caretPosition + currentLength > start
    ) {
      newLength = caretPosition + currentLength - start;
    }
    current = setLength(current, newLength);
    ({ linkedList: formatSelectionsAdjusted } = append(
      formatSelectionsAdjusted,
      current
    ));
    // advance cursor and selection pointer
    caretPosition += currentLength;
    current = getNext(formatSelections, current);
  }
  return cleanTail(formatSelectionsAdjusted);
}

function mergeIdenticalFormats(formatSelections) {
  let current = head(formatSelections);
  while (current.size) {
    const next = getNext(formatSelections, current);
    ({ formatSelections, selection: current } = maybeMergeSelections(
      formatSelections,
      current,
      next
    ));
  }
  return formatSelections;
}

function cleanTail(formatSelections) {
  // no op on empty list
  if (isEmpty(formatSelections)) {
    return formatSelections;
  }
  let tailLocal = tail(formatSelections);
  // if there's only 1 format selection and it's "empty", remove it
  if (size(formatSelections) === 1 && hasIdenticalFormats(tailLocal, Map())) {
    return remove(formatSelections, tailLocal);
  }
  tailLocal = setLength(tailLocal, -1);
  tailLocal = tailLocal.remove(LINKED_LIST_NODE_NEXT_ID);
  return replace(formatSelections, tailLocal);
}

/**
 * PUBLIC API
 *
 *
 * Every public export calls this to keep shit on the level.
 * FOR POSTERITY: This has been the single most difficult function to design in the whole codebase
 * bugs and regressions here over and over again finally prompted adding the first tests with jest, there's probably still bugs.
 * using ImmutableJS and a set of linked-list helpers to ensure integrity of the linked list, along with unit tests - I think it's pretty good now... haha
 *
 * adjusts selection offsets (and removes selections) after these events: paste, keydown, delete 1 char, delete selection of 1 or more chars
 */
export function adjustSelectionOffsetsAndCleanup(
  formatSelections,
  contentLengthAfterUpdate,
  contentLengthBeforeUpdate = 0,
  start = 0,
  count = 0
) {
  const doesRemoveCharacters = count < 0;
  // no-op?
  if (start === 0 && count === 0) {
    return formatSelections;
  }
  // validate input
  if (
    // can't start before 0
    start < 0 ||
    // trying to delete too far left (past 0)
    start + count < 0 ||
    // trying to delete from too far right
    (doesRemoveCharacters && start > contentLengthBeforeUpdate) ||
    // trying to add too many characters
    (!doesRemoveCharacters && start + count > contentLengthAfterUpdate)
  ) {
    throw new Error(
      `adjustSelectionOffsetsAndCleanup out of bounds!\n${JSON.stringify({
        contentLengthAfterUpdate,
        contentLengthBeforeUpdate,
        start,
        count,
      })}`
    );
  }

  // if there's only 1 selection, no-op
  if (size(formatSelections) === 1) {
    return formatSelections;
  }

  info('ADJUST ', this, ' -- offset: ', start, ' count: ', count);
  // if we're ADDING content
  if (!doesRemoveCharacters) {
    return adjustSelectionOffsetsAdd(formatSelections, start, count);
  }
  // if we're DELETING content:
  const formatSelectionsAdjusted = adjustSelectionOffsetsRemove(
    formatSelections,
    contentLengthBeforeUpdate,
    start,
    count
  );
  // MERGE any neighbors that have identical formats?
  return cleanTail(mergeIdenticalFormats(formatSelectionsAdjusted));
}

/**
 * Takes a highlight range in paragraph content and maps it to a new FormatSelection linked list.
 * adjusting/removing existing overlapping selections
 * NOTE: doesn't merge neighboring selections with identical formats, this happens on update
 */
export function getSelectionByContentOffset(
  formatSelections,
  contentLength,
  start,
  end
) {
  // TODO: validation of start & end against nodeModel.content?.length
  const lengthLocal = end - start;
  // first see if the exact Selection already exists?

  let formatSelectionsUpdated = linkedListFromJS();
  let returnSelection = Map();
  // expand to one default selection, if empty
  if (isEmpty(formatSelections)) {
    ({ linkedList: formatSelections } = append(formatSelections, {
      [SELECTION_LENGTH]: -1,
    }));
  }
  let current = head(formatSelections);
  let caretPosition = 0;

  while (current.size) {
    const currentId = getId(current);
    const currentStart = caretPosition;
    const currentLength = length(current);
    const currentEnd =
      currentLength === -1 ? contentLength : caretPosition + currentLength;

    // exact match
    if (start === currentStart && end === currentEnd) {
      ({ linkedList: formatSelectionsUpdated, node: returnSelection } = append(
        formatSelectionsUpdated,
        current
      ));
    }
    // current is outside of the selection - add to updated list
    else if (currentEnd <= start || currentStart >= end) {
      ({ linkedList: formatSelectionsUpdated } = append(
        formatSelectionsUpdated,
        current
      ));
    }
    // current is inside of the selection - add formats to tail (which is returnSelection)
    else if (currentStart >= start && currentEnd <= end) {
      // head is inside selection
      if (returnSelection.size === 0) {
        current = setLength(current, lengthLocal);
        ({
          linkedList: formatSelectionsUpdated,
          node: returnSelection,
        } = append(formatSelectionsUpdated, current));
      } else {
        returnSelection = unionFormats(returnSelection, current);
        formatSelectionsUpdated = replace(
          formatSelectionsUpdated,
          returnSelection
        );
      }
    }
    // overlap completely - middle
    else if (start > currentStart && end < currentEnd) {
      let rightLength = length(current) - lengthLocal - (start - currentStart);
      // left side of current
      current = setLength(current, start - currentStart);
      ({ linkedList: formatSelectionsUpdated } = append(
        formatSelectionsUpdated,
        current
      ));
      // new selection
      current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID);
      ({ linkedList: formatSelectionsUpdated, node: returnSelection } = append(
        formatSelectionsUpdated,
        current
      ));
      // right side of current
      current = setLength(current, rightLength);
      ({ linkedList: formatSelectionsUpdated } = append(
        formatSelectionsUpdated,
        current
      ));
    }
    // newSelection end overlaps current (LEFT)
    // NOTE: must be end < currentEnd. Cannot be end === currentEnd - this case needs to fall into RIGHT overlap
    else if (end >= currentStart && end < currentEnd) {
      const idBak = getId(current);
      if (returnSelection.size) {
        // update existing new selection
        formatSelectionsUpdated = replace(
          formatSelectionsUpdated,
          unionFormats(returnSelection, current)
        );
      } else {
        // creating new selection
        current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID);
        ({
          linkedList: formatSelectionsUpdated,
          node: returnSelection,
        } = append(formatSelectionsUpdated, current));
      }
      current = setLength(current, currentEnd - end).set(
        LINKED_LIST_NODE_ID,
        idBak
      );
      ({ linkedList: formatSelectionsUpdated } = append(
        formatSelectionsUpdated,
        current
      ));
    }
    // newSelection start overlaps current (RIGHT)
    else if (start >= currentStart && start <= currentEnd) {
      current = setLength(current, start - currentStart);
      ({ linkedList: formatSelectionsUpdated } = append(
        formatSelectionsUpdated,
        current
      ));
      current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID);
      ({ linkedList: formatSelectionsUpdated, node: returnSelection } = append(
        formatSelectionsUpdated,
        current
      ));
    }

    caretPosition += currentLength;
    current = getNext(formatSelections, currentId);
  }

  return {
    formatSelections: cleanTail(formatSelectionsUpdated),
    id: getId(returnSelection),
  };
}

/**
 * insert a new formatted selection
 * NOTE: getSelectionByContentOffset() does the hard work of carving out a new selection
 *  this function just puts it back BUT, also merges neighboring selections
 *  with identical formats
 */
export function replaceSelection(formatSelections, updatedSelection) {
  if (getNode(formatSelections, updatedSelection).size === 0) {
    throw new Error(
      `replaceSelection() - bad selection\n${JSON.stringify(
        this
      )}\n${JSON.stringify(updatedSelection.toJS())}`
    );
  }
  // replace updated Selection
  formatSelections = replace(formatSelections, updatedSelection);

  // maybe merge prev & next neighbors if they have the same formats
  let prev = getPrev(formatSelections, updatedSelection);
  let next = getNext(formatSelections, updatedSelection);

  ({ formatSelections, selection: updatedSelection } = maybeMergeSelections(
    formatSelections,
    prev,
    updatedSelection
  ));
  ({ formatSelections, selection: updatedSelection } = maybeMergeSelections(
    formatSelections,
    updatedSelection,
    next
  ));
  return cleanTail(formatSelections);
}

export function splitSelectionsAtCaretOffset(formatSelections, caretStart) {
  let leftFormatSelections = linkedListFromJS();
  let rightFormatSelections = linkedListFromJS();
  let current = head(formatSelections);
  if (current.size === 0) {
    return {
      left: leftFormatSelections,
      right: rightFormatSelections,
    };
  }
  let caretPosition = 0;
  // build left format selections, find FormatSelection that contains caret
  while (
    getNext(formatSelections, current).size &&
    caretStart >= caretPosition + length(current)
  ) {
    caretPosition += length(current);
    ({ linkedList: leftFormatSelections } = append(
      leftFormatSelections,
      current
    ));
    current = getNext(formatSelections, current);
  }
  // maybe adjust length in split selection for right
  const headRightLength = getNext(formatSelections, current)
    ? length(current) - (caretStart - caretPosition)
    : -1;
  let headRight = current;
  headRight = setLength(headRight, headRightLength);
  if (headRightLength === 0) {
    // split on the edge of 2 selections, skip left
    headRight = getNext(formatSelections, current);
  } else if (caretStart - caretPosition > 0) {
    // split in the middle of last left selection, add to left
    ({ linkedList: leftFormatSelections } = append(
      leftFormatSelections,
      current
    ));
  }
  ({ linkedList: rightFormatSelections, node: current } = append(
    rightFormatSelections,
    headRight
  ));
  // add remaining format selections to right side
  current = getNext(formatSelections, current);
  while (current.size) {
    ({ linkedList: rightFormatSelections } = append(
      rightFormatSelections,
      current
    ));
    current = getNext(formatSelections, current);
  }

  return {
    left: cleanTail(leftFormatSelections),
    right: cleanTail(rightFormatSelections),
  };
}

export function concatSelections(
  formatSelections,
  otherFormatSelections,
  leftContentLength
) {
  // the last left selection length is -1, figure out it's new length now that's in the middle
  let leftLastSelectionLength = leftContentLength;
  if (isEmpty(formatSelections)) {
    ({ linkedList: formatSelections } = append(formatSelections));
  }
  // expand last selection length from - 1
  let current = head(formatSelections);
  while (getNext(formatSelections, current).size) {
    leftLastSelectionLength -= length(current);
    current = getNext(formatSelections, current);
  }
  // current is now the last left selection
  current = setLength(current, leftLastSelectionLength);
  formatSelections = replace(formatSelections, current);
  // lastLeft & otherHead have same formats? merge
  if (isEmpty(otherFormatSelections)) {
    ({ linkedList: otherFormatSelections } = append(otherFormatSelections));
  }
  const otherHead = head(otherFormatSelections);
  if (hasIdenticalFormats(current, otherHead)) {
    current = setLength(current, length(current) + length(otherHead));
    formatSelections = replace(formatSelections, current);
  } else {
    ({ linkedList: formatSelections } = append(formatSelections, otherHead));
  }
  // add any remaining selections from right
  current = otherHead;
  while (getNext(otherFormatSelections, current).size) {
    current = getNext(otherFormatSelections, current);
    ({ linkedList: formatSelections } = append(formatSelections, current));
  }
  return cleanTail(formatSelections);
}

/**
 * get an array of content sliced-up by selection lengths
 */
export function getContentBySelections(formatSelections, content) {
  if (content === undefined || content === null) {
    content = '';
  }
  // if there's no selection or just one, return the whole string
  if (head(formatSelections).size === 0 || size(formatSelections) === 1) {
    return [cleanTextOrZeroLengthPlaceholder(content)];
  }
  const pieces = [];
  let caretPosition = 0;
  let current = head(formatSelections);
  while (current.size) {
    const end =
      length(current) > -1 ? caretPosition + length(current) : undefined;
    // NOTE: content.substring(undefined, undefined) works like: content.substring(0, content.length)
    const piece = content.substring(caretPosition, end);
    pieces.push(cleanTextOrZeroLengthPlaceholder(piece));
    caretPosition += length(current);
    current = getNext(formatSelections, current);
  }
  return pieces;
}
