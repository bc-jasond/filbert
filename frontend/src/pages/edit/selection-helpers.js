import { List, Record } from 'immutable';

import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_END,
  SELECTION_LINK_URL,
  SELECTION_START
} from '../../common/constants';
import { cleanTextOrZeroLengthPlaceholder } from '../../common/utils';

export const Selection = Record({
  [SELECTION_START]: 0,
  [SELECTION_END]: -1,
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

export function formatSelections(s) {
  if (!List.isList(s)) {
    return '';
  }
  return `${s.reduce(
    (acc, v) =>
      `${acc} | start: ${v.get(SELECTION_START)}, end: ${v.get(SELECTION_END)}`,
    ''
  )} |`;
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
  return selectionTypesInOrder.reduce(
    (acc, key) => acc || left.get(key) !== right.get(key),
    false
  );
}

/**
 * make sure that all characters in the paragraph are in a selection
 * @param selections
 */
function fillEnds(nodeModel) {
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    return nodeModel;
  }
  const contentLength = nodeModel.get('content', '').length;
  let newSelections = selections;
  let minStart = contentLength;
  let maxEnd = 0;
  selections.forEach(s => {
    minStart = Math.min(minStart, s.get(SELECTION_START));
    maxEnd = Math.max(maxEnd, s.get(SELECTION_END));
  });
  if (minStart > 0) {
    newSelections = newSelections.insert(
      0,
      Selection({ [SELECTION_START]: 0, [SELECTION_END]: minStart })
    );
  }
  if (maxEnd < contentLength) {
    newSelections = newSelections.push(
      Selection({ [SELECTION_START]: maxEnd, [SELECTION_END]: contentLength })
    );
  }
  if (!selections.equals(newSelections)) {
    console.info('FILL ENDS      ', formatSelections(newSelections));
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
    if (
      current === selections.last() ||
      selectionsHaveDifferentFormats(current, next)
    ) {
      newSelections = newSelections.push(current);
      current = next;
    } else {
      // if the formats are the same, just extend the current selection
      current = current.set(SELECTION_END, next.get(SELECTION_END));
    }
  }
  newSelections = newSelections.push(current);
  // SUPER PERFORMANCE OPTIMIZATION: if there's only one Selection and it's empty - unset 'selections'
  if (
    newSelections.size === 1 &&
    !selectionsHaveDifferentFormats(newSelections.get(0), Selection())
  ) {
    return nodeModel.deleteIn(['meta', 'selections']);
  }
  if (!selections.equals(newSelections)) {
    console.info('MERGE ADJACENT ', formatSelections(newSelections));
    return setSelections(nodeModel, newSelections);
  }
  // no-op
  return nodeModel;
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
  const diffRangeStart = Math.min(start, start + count);
  const diffRangeEnd = Math.max(start, start + count);
  const doesRemoveCharacters = count < 0;
  // compare beforeContent length for delete operations, nodeMode.get('content') for add operations
  const contentLength = Math.max(
    nodeModel.get('content', '').length,
    beforeContent.length
  );
  // validate input
  if (
    // don't test for no-op case
    !(start === 0 && count === 0) &&
    // can't start before 0
    (start < 0 ||
      // can't start beyond contentLength
      start > contentLength ||
      // trying to delete too far left (past 0)
      start + count < 0 ||
      // trying to add too far right (past contentLength)
      start + count > contentLength)
  ) {
    throw new Error(
      `adjustSelectionOffsetsAndCleanup out of bounds!\n${JSON.stringify(
        nodeModel.toJS()
      )}\n${start}\n${count}`
    );
  }
  const selections = getSelections(nodeModel);
  if (selections.size === 0) {
    return nodeModel.deleteIn(['meta', 'selections']);
  }
  let newSelections = List();
  // TODO: refactor to remove continue statements?
  /* eslint-disable no-continue */
  for (let i = 0; i < selections.size; i++) {
    let current = selections.get(i);
    // const currentJS = current.toJS();
    if (doesRemoveCharacters) {
      // selection completely enveloped by diff - skip
      if (
        current.get(SELECTION_START) >= diffRangeStart &&
        current.get(SELECTION_END) <= diffRangeEnd
      ) {
        continue;
      }
      // selection comes before diff - push as is
      if (current.get(SELECTION_END) <= diffRangeStart) {
        newSelections = newSelections.push(current);
        continue;
      }
      // selection overlaps diff to the left - set end to diffRangeStart
      if (
        current.get(SELECTION_START) < diffRangeStart &&
        current.get(SELECTION_END) <= diffRangeEnd
      ) {
        newSelections = newSelections.push(
          current.set(SELECTION_END, diffRangeStart)
        );
        continue;
      }
      // diff completely inside selection - add "count" to end
      if (
        current.get(SELECTION_START) <= diffRangeStart &&
        current.get(SELECTION_END) > diffRangeEnd
      ) {
        newSelections = newSelections.push(
          current.set(SELECTION_END, current.get(SELECTION_END) + count)
        );
        continue;
      }
      // selection overlaps diff to the right - set start to diffRangeStart, add "count" to end
      if (
        current.get(SELECTION_START) < diffRangeEnd &&
        current.get(SELECTION_END) > diffRangeEnd
      ) {
        newSelections = newSelections.push(
          current
            .set(SELECTION_START, diffRangeStart)
            .set(SELECTION_END, current.get(SELECTION_END) + count)
        );
        continue;
      }
      // selection comes after diff - add "count" to start, add "count" to end
      if (
        current.get(SELECTION_START) >= diffRangeEnd &&
        current.get(SELECTION_END) > diffRangeEnd
      ) {
        newSelections = newSelections.push(
          current
            .set(SELECTION_START, current.get(SELECTION_START) + count)
            .set(SELECTION_END, current.get(SELECTION_END) + count)
        );
      }
    } else {
      // ADDING characters
      if (current.get(SELECTION_START) >= start) {
        current = current.set(
          SELECTION_START,
          current.get(SELECTION_START) + count
        );
      }
      if (current.get(SELECTION_END) >= start) {
        current = current.set(
          SELECTION_END,
          current.get(SELECTION_END) + count
        );
      }
      newSelections = newSelections.push(current);
    }
  }
  /* eslint-enable no-continue */

  let newModel = nodeModel;
  if (!selections.equals(newSelections)) {
    console.info(
      'ADJUST         ',
      formatSelections(newSelections),
      ' -- offset: ',
      start,
      ' count: ',
      count,
      ' content length: ',
      contentLength
    );
    newModel = setSelections(nodeModel, newSelections);
  }
  newModel = fillEnds(newModel);
  return mergeAdjacentSelectionsWithSameFormats(newModel);
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
          return newVal && oldVal;
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
export function upsertSelection(nodeModel, newSelection) {
  let didPushNewSelection = false;
  let newSelections = List();
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
    } else
    // current selection doesn't overlap - push it
    if (
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
 * NOTE: this function returns an array of Left & Right selections List()s NOT a document nodeModel
 * the reason is because we don't have a Right model (don't have an id) yet.  I could make this so but, it seems reach-outy
 *
 * @param nodeModel
 * @param caretOffset
 * @returns {List<any>[]}
 */
export function splitSelectionsAtCaretOffset(
  leftNodeModel,
  rightNodeModel,
  caretOffset
) {
  let left = List();
  let right = List();
  const selections = getSelections(leftNodeModel);
  for (let i = 0; i < selections.size; i++) {
    const current = selections.get(i);
    // const currentJS = current.toJS();
    if (current.get(SELECTION_END) <= caretOffset) {
      left = left.push(current);
    } else if (current.get(SELECTION_START) >= caretOffset) {
      right = right.push(
        current
          .set(SELECTION_START, current.get(SELECTION_START) - caretOffset)
          .set(SELECTION_END, current.get(SELECTION_END) - caretOffset)
      );
    } else {
      // caretOffset must be in the middle of a selection, split
      left = left.push(current.set(SELECTION_END, caretOffset));
      right = right.push(
        current
          .set(SELECTION_START, 0)
          .set(SELECTION_END, current.get(SELECTION_END) - caretOffset)
      );
    }
  }
  leftNodeModel = setSelections(leftNodeModel, left);
  leftNodeModel = adjustSelectionOffsetsAndCleanup(leftNodeModel);
  rightNodeModel = setSelections(rightNodeModel, right);
  rightNodeModel = adjustSelectionOffsetsAndCleanup(rightNodeModel);
  return [leftNodeModel, rightNodeModel];
}

export function concatSelections(leftModel, rightModel) {
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
  return adjustSelectionOffsetsAndCleanup(leftModel);
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
