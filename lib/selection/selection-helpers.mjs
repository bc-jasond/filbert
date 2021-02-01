import { LinkedList, LinkedListNode } from '@filbert/linked-list';
import { cleanTextOrZeroLengthPlaceholder, info } from '@filbert/util';

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
export const SELECTION_LINK_URL = 'linkUrl';

export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';

export class FormatSelectionNode extends LinkedListNode {
  constructor(values = {}) {
    // set defaults
    // TODO: move "length" out of __values?
    super(values);
  }
  get bold() {
    return this.values.get(SELECTION_ACTION_BOLD);
  }
  set bold(value) {
    return this.setValue(SELECTION_ACTION_BOLD, !!value);
  }
  get italic() {
    return this.values.get(SELECTION_ACTION_ITALIC);
  }
  set italic(value) {
    return this.setValue(SELECTION_ACTION_ITALIC, !!value);
  }
  get code() {
    return this.values.get(SELECTION_ACTION_CODE);
  }
  set code(value) {
    return this.setValue(SELECTION_ACTION_CODE, !!value);
  }
  get siteinfo() {
    return this.values.get(SELECTION_ACTION_SITEINFO);
  }
  set siteinfo(value) {
    return this.setValue(SELECTION_ACTION_SITEINFO, !!value);
  }
  get mini() {
    return this.values.get(SELECTION_ACTION_MINI);
  }
  set mini(value) {
    return this.setValue(SELECTION_ACTION_MINI, !!value);
  }
  get strikethrough() {
    return this.values.get(SELECTION_ACTION_STRIKETHROUGH);
  }
  set strikethrough(value) {
    return this.setValue(SELECTION_ACTION_STRIKETHROUGH, !!value);
  }
  get link() {
    return this.values.get(SELECTION_ACTION_LINK);
  }
  set link(value) {
    return this.setValue(SELECTION_ACTION_LINK, !!value);
  }
  get linkUrl() {
    return this.values.get(SELECTION_LINK_URL);
  }
  set linkUrl(value) {
    if (typeof value !== 'string') {
      throw new TypeError('linkUrl only accepts string');
    }
    return this.setValue(SELECTION_LINK_URL, value);
  }
  get length() {
    return this.values.get(SELECTION_LENGTH, -1);
  }
  set length(value) {
    return this.setValue(SELECTION_LENGTH, value ? value : -1);
  }
  copy() {
    return new FormatSelectionNode(this.toJSON());
  }
  hasIdenticalFormats(that) {
    // handle empty input
    if (!that) {
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
      if (this.values.get(key, false) != that.values.get(key, false)) {
        isEqual = false;
      }
    });
    return isEqual;
  }

  /**
   * all formats from this and that
   */
  unionFormats(that) {
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
        this.values.get(key) === undefined &&
        that.values.get(key) === undefined
      ) {
        return;
      }
      this.setValue(key, this.values.get(key) || that.values.get(key));
    });
    return this;
  }

  toString() {
    return JSON.stringify(this, null, 2);
  }
}

export class FormatSelections extends LinkedList {
  /**
   * testing helpers
   */
  static fromTestArray(values) {
    const formatSelections = new FormatSelections();
    while (values.length) {
      const current = new FormatSelectionNode();
      const [currentLength, ...currentValues] = values.shift();
      current.length = currentLength;
      currentValues.forEach((v) => {
        if (typeof v === 'object') {
          if (v.key === SELECTION_ID) {
            current.id = v.value;
          } else {
            current.setValue(v.key, v.value);
          }
        } else {
          current.setValue(v, true);
        }
      });
      formatSelections.append(current);
    }
    return formatSelections;
  }

  constructor(head, nodes = {}) {
    super(head, nodes, FormatSelectionNode);
  }

  /**
   * convert to array of values without ids for easy quality check in tests
   */
  toArrayWithoutIds() {
    let current = this.head;
    let output = [];
    while (current) {
      output.push(current.values.toJS());
      current = this.getNext(current);
    }
    return output;
  }

  maybeMergeSelections(left, right) {
    // handle empty input
    if (!left) {
      return right;
    }
    // no merge if different formats, return the right node as "next"
    if (!left.hasIdenticalFormats(right)) {
      return right;
    }

    left.length += right.length;
    this.setNode(left);
    this.remove(right);
    return left;
  }

  /**
   * find the FormatSelectionNode that contains start (a collapsed caret position) and increase length by count
   */
  adjustSelectionOffsetsAdd(start, count) {
    let current = this.head;
    let caretPosition = 0;
    // find the selection
    while (current.next && start >= caretPosition + current.length) {
      caretPosition += current.length;
      current = this.getNext(current);
    }
    // and increase it's length if it's not at the end
    if (this.isTail(current)) {
      return this;
    }
    current.length += count;
    return this.setNode(current);
  }

  /**
   * TODO: split into "collapsed" & "range" caret helpers?
   * adjust the size / remove format selections after a delete operation
   */
  adjustSelectionOffsetsRemove(contentLengthBeforeUpdate, start, count) {
    let current = this.head;
    let caretPosition = 0;
    const formatSelectionsAdjusted = new FormatSelections();
    // did we delete all content for the node? - count is negative
    if (contentLengthBeforeUpdate + count === 0) {
      // return empty selections
      return formatSelectionsAdjusted;
    }
    // since count is negative, start is actually the caret end :) - find the start
    const deleteCaretStart = start + count; // count is negative
    // loop through all selections
    while (current) {
      // give last selection a length for comparison (it will be -1)
      const currentLength =
        current.length === -1
          ? contentLengthBeforeUpdate - caretPosition
          : current.length;
      let newLength = currentLength;
      if (
        caretPosition >= deleteCaretStart &&
        caretPosition + currentLength <= start
      ) {
        // whole selection was deleted, skip
        caretPosition += currentLength;
        current = this.getNext(current);
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
        !this.isTail(current) &&
        caretPosition < start &&
        caretPosition + currentLength > start
      ) {
        newLength = caretPosition + currentLength - start;
      }
      current.length = newLength;
      formatSelectionsAdjusted.append(current);
      // advance cursor and selection pointer
      caretPosition += currentLength;
      current = this.getNext(current);
    }
    // clean tail
    formatSelectionsAdjusted.clean();
    return formatSelectionsAdjusted;
  }

  mergeIdenticalFormats() {
    let current = this.head;
    while (current) {
      const next = this.getNext(current);
      current = this.maybeMergeSelections(current, next);
    }
    return this;
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
  adjustSelectionOffsetsAndCleanup(
    contentLengthAfterUpdate,
    contentLengthBeforeUpdate = 0,
    start = 0,
    count = 0
  ) {
    const doesRemoveCharacters = count < 0;
    // no-op?
    if (start === 0 && count === 0) {
      return this;
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
    if (this.size === 1) {
      return this;
    }

    info('ADJUST ', this, ' -- offset: ', start, ' count: ', count);
    // if we're ADDING content
    if (!doesRemoveCharacters) {
      return this.adjustSelectionOffsetsAdd(start, count);
    }
    // if we're DELETING content:
    const formatSelectionsAdjusted = this.adjustSelectionOffsetsRemove(
      contentLengthBeforeUpdate,
      start,
      count
    );
    // MERGE any neighbors that have identical formats?
    return formatSelectionsAdjusted.mergeIdenticalFormats().clean();
  }

  /**
   * Takes a highlight range in paragraph content and maps it to a new FormatSelection linked list.
   * adjusting/removing existing overlapping selections
   * NOTE: doesn't merge neighboring selections with identical formats, this happens on update
   */
  getSelectionByContentOffset(contentLength, start, end) {
    // TODO: validation of start & end against nodeModel.get('content')?.length
    const length = end - start;
    // first see if the exact Selection already exists?

    let formatSelectionsUpdated = new FormatSelections();
    let returnSelection;
    // default one empty selection
    if (!this.head) {
      this.append();
    }
    let current = this.head;
    let caretPosition = 0;

    while (current) {
      const currentStart = caretPosition;
      const currentEnd =
        current.length === -1 ? contentLength : caretPosition + current.length;
      const currentCopy = current.copy();

      // exact match
      if (start === currentStart && end === currentEnd) {
        returnSelection = formatSelectionsUpdated.append(currentCopy);
      }
      // current is outside of the selection - add to updated list
      else if (currentEnd <= start || currentStart >= end) {
        formatSelectionsUpdated.append(currentCopy);
      }
      // current is inside of the selection - add formats to tail (which is returnSelection)
      else if (currentStart >= start && currentEnd <= end) {
        // head is inside selection
        if (!returnSelection) {
          currentCopy.length = length;
          returnSelection = formatSelectionsUpdated.append(currentCopy);
        } else {
          formatSelectionsUpdated.setNode(
            returnSelection.unionFormats(currentCopy)
          );
        }
      }
      // overlap completely - middle
      else if (start > currentStart && end < currentEnd) {
        let rightLength = currentCopy.length - length - (start - currentStart);
        // left side of current
        currentCopy.length = start - currentStart;
        formatSelectionsUpdated.append(currentCopy);
        // new selection
        currentCopy.length = length;
        currentCopy.id = undefined;
        returnSelection = formatSelectionsUpdated.append(currentCopy);
        // right side of current
        currentCopy.length = rightLength;
        formatSelectionsUpdated.append(currentCopy);
      }
      // newSelection end overlaps current (LEFT)
      // NOTE: must be end < currentEnd. Cannot be end === currentEnd - this case needs to fall into RIGHT overlap
      else if (end >= currentStart && end < currentEnd) {
        const idBak = currentCopy.id;
        if (returnSelection) {
          // update existing new FormatSelection
          formatSelectionsUpdated.setNode(
            returnSelection.unionFormats(currentCopy)
          );
        } else {
          // creating new FormatSelection
          currentCopy.length = length;
          currentCopy.id = undefined;
          returnSelection = formatSelectionsUpdated.append(currentCopy);
        }
        currentCopy.length = currentEnd - end;
        currentCopy.id = idBak;
        formatSelectionsUpdated.append(currentCopy);
      }
      // newSelection start overlaps current (RIGHT)
      else if (start >= currentStart && start <= currentEnd) {
        currentCopy.length = start - currentStart;
        formatSelectionsUpdated.append(currentCopy);
        currentCopy.length = length;
        currentCopy.id = undefined;
        returnSelection = formatSelectionsUpdated.append(currentCopy);
      }

      caretPosition += current.length;
      current = this.getNext(current);
    }

    return {
      formatSelections: formatSelectionsUpdated.clean(),
      id: returnSelection.id,
    };
  }

  /**
   * insert a new formatted selection
   * NOTE: getSelectionByContentOffset() does the hard work of carving out a new selection
   *  this function just puts it back BUT, also merges neighboring selections
   *  with identical formats
   */
  replaceSelection(updatedSelection) {
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

  splitSelectionsAtCaretOffset(caretStart) {
    let leftFormatSelections = new FormatSelections();
    let rightFormatSelections = new FormatSelections();
    let current = this.head;
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

  concatSelections(otherFormatSelections, leftContentLength) {
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
  getContentBySelections(content) {
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

  clean() {
    // no op on empty list
    if (this.size === 0) {
      return this;
    }
    const tail = this.getAt(this.size - 1);
    // if there's only 1 format selection and it's "empty", remove it
    if (
      this.size === 1 &&
      tail.hasIdenticalFormats(new FormatSelectionNode())
    ) {
      return this.remove(tail);
    }
    tail.length = -1;
    tail.next = undefined;
    return this.setNode(tail);
  }

  toJSON() {
    if (
      this.size === 1 &&
      this.tail.hasIdenticalFormats(new FormatSelectionNode())
    ) {
      return {};
    }
    return { head: this.head && this.head, nodes: this.nodes.toJS() };
  }

  static fromJSON(json) {
    return LinkedList.fromJSON(json, FormatSelectionNode)
  }

  toString() {
    const prefix = 'FormatSelections\n';
    if (!this.head) {
      return `${prefix}empty\n`;
    }
    let current = this.head;
    let output = `${prefix}head: ${current}\n`;
    while (current?.next) {
      output = `${output}${current}\n`;
      current = this.getNext(current.next);
    }
    return output;
  }
}
