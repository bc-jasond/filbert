import immutable from 'immutable';
import {
  LINKED_LIST_NODE_ID,
  LINKED_LIST_NODE_NEXT_ID,
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODES_MAP,
  linkedListFromJS,
  append,
  head,
  getNext, replace, remove, isTail, isEmpty, size, tail, copy, getId,
} from '@filbert/linked-list';
import { cleanTextOrZeroLengthPlaceholder, info } from '@filbert/util';
import {set} from "filbert-web/src/common/local-storage.js";

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
    return node.set(SELECTION_ACTION_BOLD, !!value);
  }
  export function italic(node) {
    return node.get(SELECTION_ACTION_ITALIC);
  }
  export function setItalic(node, value) {
    return node.set(SELECTION_ACTION_ITALIC, !!value);
  }
  export function code(node) {
    return node.get(SELECTION_ACTION_CODE);
  }
  export function setCode(node, value) {
    return node.set(SELECTION_ACTION_CODE, !!value);
  }
  export function siteinfo(node) {
    return node.get(SELECTION_ACTION_SITEINFO);
  }
  export function setSiteinfo(node, value) {
    return node.set(SELECTION_ACTION_SITEINFO, !!value);
  }
  export function mini(node) {
    return node.get(SELECTION_ACTION_MINI);
  }
  export function setMini(node, value) {
    return node.set(SELECTION_ACTION_MINI, !!value);
  }
  export function strikethrough(node) {
    return node.get(SELECTION_ACTION_STRIKETHROUGH);
  }
  export function setStrikethrough(node, value) {
    return node.set(SELECTION_ACTION_STRIKETHROUGH, !!value);
  }
  export function link(node) {
    return node.get(SELECTION_ACTION_LINK);
  }
  export function setLink(node, value) {
    return node.set(SELECTION_ACTION_LINK, !!value);
  }
  export function linkUrl(node) {
    return node.get(SELECTION_LINK_URL);
  }
  export function setLinkUrl(node, value) {
    if (typeof value !== 'string') {
      throw new TypeError('linkUrl only accepts string');
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
    // handle empty input
    if (!right.size) {
      return false;
    }
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
      if (
        left.get(key) === undefined &&
        right.get(key) === undefined
      ) {
        return;
      }
      left = left.set(key, left.get(key) || right.get(key));
    });
    return left;
  }


  /**
   * testing helpers
   */
  export function fromTestArray(values) {
    let formatSelections = linkedListFromJS();
    while (values.length) {
      let current = Map()
      const [currentLength, ...currentValues] = values.shift();
      current = setLength(current,currentLength);
      currentValues.forEach((v) => {
        if (typeof v === 'object') {
            current = current.set(v.key, v.value);
        } else {
          current = current.set(v, true);
        }
      });
      ({linkedList: formatSelections} = append(formatSelections, current));
    }
    return formatSelections;
  }

  /**
   * convert to array of values without ids for easy quality check in tests
   */
  export function toArrayWithoutIds(formatSelections) {
    let current = head(formatSelections);
    let output = [];
    while (current.size) {
      output.push(current.remove(LINKED_LIST_NODE_ID).remove(LINKED_LIST_NODE_NEXT_ID).toJS());
      current = getNext(formatSelections, current);
    }
    return output;
  }

export function maybeMergeSelections(formatSelections, left, right) {
    // handle empty input OR no merge if different formats, return the right node as "next"
    if (!left.size || !hasIdenticalFormats(left, right)) {
      return {formatSelections, selection: right};
    }

    left = setLength(left, length(left) + length(right))
    formatSelections = replace(formatSelections, left);
    formatSelections = remove(formatSelections, right);
    return {formatSelections, selection: left};
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
    // and increase it's length if it's not at the end
    if (isTail(current)) {
      return formatSelections;
    }
    current = setLength(current, length(current) + count);
    return replace(formatSelections, current);
  }

  /**
   * TODO: split into "collapsed" & "range" caret helpers?
   * adjust the size / remove format selections after a delete operation
   */
  function adjustSelectionOffsetsRemove(formatSelections, contentLengthBeforeUpdate, start, count) {
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
      ({linkedList: formatSelectionsAdjusted} = append(formatSelectionsAdjusted, current));
      // advance cursor and selection pointer
      caretPosition += currentLength;
      current = getNext(formatSelections, current);
    }
    // clean tail
    return clean(formatSelectionsAdjusted);
  }

  function mergeIdenticalFormats(formatSelections) {
    let current = head(formatSelections);
    while (current.size) {
      const next = getNext(formatSelections, current);
      ({formatSelections, selection: current} = maybeMergeSelections(formatSelections, current, next));
    }
    return formatSelections;
  }

function clean(formatSelections) {
  // no op on empty list
  if (isEmpty(formatSelections)) {
    return formatSelections;
  }
  let tailLocal = tail(formatSelections);
  // if there's only 1 format selection and it's "empty", remove it
  if (
    size(formatSelections) === 1 &&
    hasIdenticalFormats(tailLocal, Map())
  ) {
    return remove(formatSelections, tailLocal);
  }
  tailLocal = setLength(tailLocal, -1);
  tailLocal = tailLocal.remove(LINKED_LIST_NODE_NEXT_ID);
  return replace(formatSelections, tailLocal)
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
    return clean(mergeIdenticalFormats(formatSelectionsAdjusted))
  }

  /**
   * Takes a highlight range in paragraph content and maps it to a new FormatSelection linked list.
   * adjusting/removing existing overlapping selections
   * NOTE: doesn't merge neighboring selections with identical formats, this happens on update
   */
  export function getSelectionByContentOffset(formatSelections, contentLength, start, end) {
    // TODO: validation of start & end against nodeModel.content?.length
    const lengthLocal = end - start;
    // first see if the exact Selection already exists?

    let formatSelectionsUpdated = linkedListFromJS();
    let returnSelection = Map();
    // default one empty selection
    if (isEmpty(formatSelections)) {
      ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, {[SELECTION_LENGTH]: -1}));
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
        ({linkedList: formatSelectionsUpdated, node: returnSelection} = append(formatSelectionsUpdated, current));
      }
      // current is outside of the selection - add to updated list
      else if (currentEnd <= start || currentStart >= end) {
        ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, current));
      }
      // current is inside of the selection - add formats to tail (which is returnSelection)
      else if (currentStart >= start && currentEnd <= end) {
        // head is inside selection
        if (!returnSelection) {
          current = setLength(current, lengthLocal);
          ({linkedList: formatSelectionsUpdated, node: returnSelection} = append(formatSelectionsUpdated, current));
        } else {
          returnSelection = unionFormats(returnSelection, current);
          formatSelectionsUpdated = replace(formatSelectionsUpdated, returnSelection);
        }
      }
      // overlap completely - middle
      else if (start > currentStart && end < currentEnd) {
        let rightLength = length(current) - lengthLocal - (start - currentStart);
        // left side of current
        current = setLength(current, start - currentStart);
        ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, current));
        // new selection
        current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID)
        ({linkedList:formatSelectionsUpdated, node: returnSelection} = append(formatSelectionsUpdated, current));
        // right side of current
        current = setLength(current, rightLength);
        ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, current));
      }
      // newSelection end overlaps current (LEFT)
      // NOTE: must be end < currentEnd. Cannot be end === currentEnd - this case needs to fall into RIGHT overlap
      else if (end >= currentStart && end < currentEnd) {
        const idBak = getId(current);
        if (returnSelection.size) {
          // update existing new selection
          formatSelectionsUpdated = replace(formatSelectionsUpdated, unionFormats(returnSelection, current));
        } else {
          // creating new selection
          current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID);
          ({linkedList:formatSelectionsUpdated, node: returnSelection} = append(formatSelectionsUpdated, current));
        }
        current = setLength(current, currentEnd - end).set(LINKED_LIST_NODE_ID, idBak);
        ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, current));
      }
      // newSelection start overlaps current (RIGHT)
      else if (start >= currentStart && start <= currentEnd) {
        current = setLength(current, start - currentStart);
        ({linkedList:formatSelectionsUpdated} = append(formatSelectionsUpdated, current));
        current = setLength(current, lengthLocal).remove(LINKED_LIST_NODE_ID);
        ({linkedList:formatSelectionsUpdated, node: returnSelection} = append(formatSelectionsUpdated, current));
      }

      caretPosition += currentLength;
      current = getNext(formatSelections, currentId);
    }

    return {
      formatSelections: clean(formatSelectionsUpdated),
      id: getId(returnSelection),
    };
  }

  LEFT OFF HERE


  /**
   * insert a new formatted selection
   * NOTE: getSelectionByContentOffset() does the hard work of carving out a new selection
   *  this function just puts it back BUT, also merges neighboring selections
   *  with identical formats
   */
  export function replaceSelection(formatSelections, updatedSelection) {
    if (!this.getNode(updatedSelection)) {
      throw new Error(
        `replaceSelection() - bad selection\n${JSON.stringify(
          this
        )}\n${JSON.stringify(updatedSelection)}`
      );
    }
    // replace updated Selection
    this.setNode(updatedSelection);

    // maybe merge prev & next neighbors if they have the same formats
    let prev;
    // refresh head from selections because it might have been replaced
    let current = this.head;

    while (current.next && updatedSelection.id !== current.id) {
      prev = current;
      current = this.getNext(current);
    }
    let next = this.getNext(current);
    current = this.maybeMergeSelections(prev, current);
    this.maybeMergeSelections(current, next);
    return this.clean();
  }

export function splitSelectionsAtCaretOffset(formatSelections, caretStart) {
    let leftFormatSelections = new FormatSelections();
    let rightFormatSelections = new FormatSelections();
    let current = this.head;
    if (!current) {
      return {
        left: leftFormatSelections,
        right: rightFormatSelections,
      };
    }
    let caretPosition = 0;
    // build left format selections, find FormatSelection that contains caret
    while (current.next && caretStart >= caretPosition + current.length) {
      caretPosition += current.length;
      leftFormatSelections.append(current);
      current = this.getNext(current);
    }
    // maybe adjust length in split selection for right
    const headRightLength = current.next
      ? current.length - (caretStart - caretPosition)
      : -1;
    let headRight = current;
    headRight.length = headRightLength;
    if (headRightLength === 0) {
      // split on the edge of 2 selections, skip left
      headRight = this.getNext(current);
    } else if (caretStart - caretPosition > 0) {
      // split in the middle of last left selection, add to left
      leftFormatSelections.append(current);
    }
    current = rightFormatSelections.append(headRight);
    // add remaining format selections to right side
    current = this.getNext(current);
    while (current) {
      rightFormatSelections.append(current);
      current = this.getNext(current);
    }

    return {
      left: leftFormatSelections.clean(),
      right: rightFormatSelections.clean(),
    };
  }

export function concatSelections(formatSelections, otherFormatSelections, leftContentLength) {
    // the last left selection length is -1, figure out it's new length now that's in the middle
    let leftLastSelectionLength = leftContentLength;
    if (this.size === 0) {
      this.append();
    }
    // expand last selection length from - 1
    let current = this.head;
    while (current.next) {
      leftLastSelectionLength -= current.length;
      current = this.getNext(current);
    }
    // current is now the last left selection
    current.length = leftLastSelectionLength;
    this.setNode(current);
    // lastLeft & otherHead have same formats? merge
    if (otherFormatSelections.size === 0) {
      otherFormatSelections.append();
    }
    const otherHead = otherFormatSelections.head;
    if (current.hasIdenticalFormats(otherHead)) {
      current.length += otherHead.length;
      this.setNode(current);
    } else {
      this.append(otherHead);
    }
    // add any remaining selections from right
    current = otherHead;
    while (current.next) {
      current = otherFormatSelections.getNext(current);
      this.append(current);
    }
    return this.clean();
  }

  /**
   * get an array of content sliced-up by selection lengths
   */
  export function getContentBySelections(formatSelections, content) {
    if (content === undefined || content === null) {
      content = '';
    }
    // if there's no selection or just one, return the whole string
    if (!this.head || !this.head.next) {
      return [cleanTextOrZeroLengthPlaceholder(content)];
    }
    const pieces = [];
    let caretPosition = 0;
    let current = this.head;
    while (current) {
      const end =
        current.length > -1 ? caretPosition + current.length : undefined;
      // NOTE: content.substring(undefined, undefined) works like: content.substring(0, content.length)
      const piece = content.substring(caretPosition, end);
      pieces.push(cleanTextOrZeroLengthPlaceholder(piece));
      caretPosition += current.length;
      current = this.getNext(current);
    }
    return pieces;
  }




////////////////////////////////////////////////////////////
// test helpers
////////////////////////////////////////////////////////////

export const testPostId = 175;
export const firstNodeIdH1 = '8e34';
export const firstNodeContent = 'Large Heading';
export const firstPId = '621e';
export const firstPContent = 'First paragraph with no formats';
export const lastNodeIdP = 'cce3';
export const lastNodeContent =
  'Make sure we have a P on the end so we can delete';
export const spacerId = 'db70';
export const h2Id = '9615';
export const h2Content = 'Small Heading';
export const preId = 'fd25';
export const pre2Id = '43eb'; // this points to img
export const imgId = '4add';
export const formattedPId = 'f677';
export const formattedPContent = 'Second paragraph with some formats';
export const formattedLiId = '151c';
export const formattedLiContent = 'One with a bunch of formats and stuff';
export const formattedLiIdPrev = '9fa0';
export const formattedLiIdPrevContent = 'Another item here';
export const quoteId = 'c67c';

export const testPostWithAllTypesJS = {
  post: {
    id: testPostId,
    user_id: 1,
    canonical: 'large-heading-0044',
    title: 'Large Heading',
    abstract: undefined,
    created: '2019-12-05T07:46:51.000Z',
    updated: '2019-12-05T07:46:51.000Z',
    published: undefined,
    deleted: undefined,
  },
  [LINKED_LIST_HEAD_ID]: firstNodeIdH1,
  [LINKED_LIST_NODES_MAP]: {
    [firstNodeIdH1]: {
      [LINKED_LIST_NODE_ID]: firstNodeIdH1,
      [LINKED_LIST_NODE_NEXT_ID]: firstPId,
      type: 'h1',
      content: firstNodeContent,
    },
    [firstPId]: {
      [LINKED_LIST_NODE_ID]: firstPId,
      [LINKED_LIST_NODE_NEXT_ID]: formattedPId,
      type: 'p',
      content: firstPContent,
    },
    [formattedPId]: {
      [LINKED_LIST_NODE_ID]: formattedPId,
      [LINKED_LIST_NODE_NEXT_ID]: spacerId,
      type: 'p',
      content: formattedPContent,
      formatSelections: fromTestArray([
        [17],
        [4, SELECTION_ACTION_BOLD],
        [1],
        [4, SELECTION_ACTION_CODE],
        [1],
        [
          ,
          SELECTION_ACTION_LINK,
          { key: 'linkUrl', value: 'http://some.site' },
        ],
      ]),
    },
    [spacerId]: {
      [LINKED_LIST_NODE_ID]: spacerId,
      [LINKED_LIST_NODE_NEXT_ID]: h2Id,
      type: 'spacer',
      content: '',
    },
    [h2Id]: {
      [LINKED_LIST_NODE_ID]: h2Id,
      [LINKED_LIST_NODE_NEXT_ID]: '56da',
      type: 'h2',
      content: h2Content,
    },
    '56da': {
      [LINKED_LIST_NODE_ID]: '56da',
      [LINKED_LIST_NODE_NEXT_ID]: formattedLiIdPrev,
      type: 'li',
      content: "Here's a list",
    },
    [formattedLiIdPrev]: {
      [LINKED_LIST_NODE_ID]: formattedLiIdPrev,
      [LINKED_LIST_NODE_NEXT_ID]: formattedLiId,
      type: 'li',
      content: formattedLiIdPrevContent,
    },
    [formattedLiId]: {
      [LINKED_LIST_NODE_ID]: formattedLiId,
      [LINKED_LIST_NODE_NEXT_ID]: preId,
      type: 'li',
      content: formattedLiContent,
      formatSelections: fromTestArray([
        [4],
        [4, SELECTION_ACTION_BOLD],
        [1],
        [1, SELECTION_ACTION_ITALIC],
        [1],
        [5, SELECTION_ACTION_CODE],
        [1],
        [2, SELECTION_ACTION_SITEINFO],
        [1],
        [7, SELECTION_ACTION_STRIKETHROUGH],
        [5],
        [, SELECTION_ACTION_LINK, { key: 'linkUrl', value: 'http://yep.com' }],
      ]),
    },
    [preId]: {
      [LINKED_LIST_NODE_ID]: preId,
      [LINKED_LIST_NODE_NEXT_ID]: 'f063',
      type: 'pre',
      content: 'var someCode = "here";',
    },
    f063: {
      [LINKED_LIST_NODE_ID]: 'f063',
      [LINKED_LIST_NODE_NEXT_ID]: '61cf',
      type: 'pre',
      content: 'function getIt(sendIt) {',
    },
    '61cf': {
      [LINKED_LIST_NODE_ID]: '61cf',
      [LINKED_LIST_NODE_NEXT_ID]: '7a38',
      type: 'pre',
      content: '  const yep = false;',
    },
    '7a38': {
      [LINKED_LIST_NODE_ID]: '7a38',
      [LINKED_LIST_NODE_NEXT_ID]: pre2Id,
      type: 'pre',
      content: '}',
    },
    [pre2Id]: {
      [LINKED_LIST_NODE_ID]: pre2Id,
      [LINKED_LIST_NODE_NEXT_ID]: imgId,
      type: 'pre',
      content: 'getIt();',
    },
    [imgId]: {
      [LINKED_LIST_NODE_ID]: imgId,
      [LINKED_LIST_NODE_NEXT_ID]: '09a0',
      type: 'image',
      content: '',
      meta: {
        url: 'b38d29e7bbd96a4df4d7ac1fa442de358702b1635319c696f27c23c2bcc9d70d',
        width: 669,
        height: 1000,
        caption: "Kinzua Dam '91",
        rotationDegrees: 90,
      },
    },
    '09a0': {
      [LINKED_LIST_NODE_ID]: '09a0',
      [LINKED_LIST_NODE_NEXT_ID]: quoteId,
      type: 'h2',
      content: "Here's a big quote",
    },
    [quoteId]: {
      [LINKED_LIST_NODE_ID]: quoteId,
      [LINKED_LIST_NODE_NEXT_ID]: lastNodeIdP,
      type: 'quote',
      content: '',
      meta: {
        url:
          'https://www.theguardian.com/theguardian/2007/sep/13/greatinterviews',
        quote:
          "It's an attempt to bring the figurative thing up on to the nervous system more violently and more poignantly.",
        author: 'Frances Bacon',
        context: 'interviews with David Sylvester in 1963, 1966 and 1979',
      },
    },
    [lastNodeIdP]: {
      [LINKED_LIST_NODE_ID]: lastNodeIdP,
      [LINKED_LIST_NODE_NEXT_ID]: undefined,
      type: 'p',
      content: lastNodeContent,
    },
  },
};
