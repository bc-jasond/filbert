import {
  KEYCODE_DOWN_ARROW,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_UP_ARROW,
} from '@filbert/constants';
import { getNode, getPrev, getNext, getId } from '@filbert/linked-list';
import { contentClean, isMetaType } from '@filbert/document';
import {
  caretIsOnEdgeOfParagraphText,
  getRange,
  setCaret,
} from '../../common/dom.mjs';
import { stopAndPrevent } from '../../common/utils';
import { Map } from 'immutable';

// Intercept arrow keys when moving into or out of MetaType nodes
// no-op otherwise to allow native browser behaviour inside contenteditable text
export async function handleArrows({
  evt,
  selectionOffsets,
  documentModel,
  sectionEdit,
  editSectionNode,
  closeAllEditContentMenus,
}) {
  // return the prev or next node if the caret is at the "edge" of a paragraph
  // and the user hits the corresponding arrow key
  function getNeighborOnArrowNavigation() {
    const { startNodeId } = selectionOffsets;
    const currentNode = getNode(documentModel, startNodeId);
    let neighborNode;
    const [
      isAtTop,
      isAtEnd,
      isAtBottom,
      isAtStart,
    ] = caretIsOnEdgeOfParagraphText();
    if (
      (evt.keyCode === KEYCODE_UP_ARROW && isAtTop) ||
      (evt.keyCode === KEYCODE_LEFT_ARROW &&
        // NOTE: if the content is empty, there will be a ZERO_LENGTH char and user would
        // have to hit left twice without this code
        (isAtStart || contentClean(currentNode).length === 0))
    ) {
      neighborNode = getPrev(documentModel, startNodeId);
    } else if (
      (evt.keyCode === KEYCODE_DOWN_ARROW && isAtBottom) ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW &&
        (isAtEnd || contentClean(currentNode).length === 0))
    ) {
      neighborNode = getNext(documentModel, startNodeId);
    }
    return Map(neighborNode);
  }

  if (
    ![
      KEYCODE_UP_ARROW,
      KEYCODE_DOWN_ARROW,
      KEYCODE_LEFT_ARROW,
      KEYCODE_RIGHT_ARROW,
    ].includes(evt.keyCode) ||
    // don't override user adjusting selection with arrows
    evt.shiftKey
  ) {
    return false;
  }
  console.debug('ARROW');
  const { caretStart, caretEnd } = selectionOffsets;

  // collapse range if there's highlighted selection and the user hits an arrow
  if (caretStart !== caretEnd) {
    if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
      // up or left - collapse to start
      getRange().collapse(true);
    } else {
      // down or right - collapse to end
      getRange().collapse(false);
    }
    stopAndPrevent(evt);
    return true;
  }

  // if there's no currently selected MetaType node
  if (!getId(editSectionNode)) {
    // see if we've entered one
    const neighborNode = getNeighborOnArrowNavigation(evt, selectionOffsets);
    if (neighborNode.size === 0) {
      // we won't be leaving the current node, let contenteditable handle the caret
      console.log('ARROW - not leaving current node');
      return true;
    }
    stopAndPrevent(evt);
    if (isMetaType(neighborNode)) {
      await sectionEdit(getId(neighborNode));
      return true;
    }
    setCaret({
      startNodeId: getId(neighborNode),
      caretStart: [KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)
        ? -1
        : 0,
    });
    return true;
  }

  /* TODO: move this into the respective edit menus to handle their own closing and arrow nav */
  //
  // we're currently inside a selected MetaType node
  // only leave edit section menu if user hit's up / down arrow
  // user can still use tab to move vertically between inputs
  // if (
  //   shouldShowEditSectionMenu &&
  //   ![KEYCODE_UP_ARROW, KEYCODE_DOWN_ARROW].includes(evt.keyCode)
  // ) {
  //   return;
  // }
  stopAndPrevent(evt);
  if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
    const prevNode = getPrev(documentModel, editSectionNode);
    if (prevNode.size === 0) {
      return;
    }
    if (isMetaType(prevNode)) {
      await sectionEdit(getId(prevNode));
      return;
    }
    await closeAllEditContentMenus();
    setCaret({ startNodeId: getId(prevNode) });
    return;
  }
  // down or right arrows
  const nextNode = getNext(documentModel, editSectionNode);
  if (!nextNode) {
    return;
  }
  if (isMetaType(nextNode)) {
    await sectionEdit(getId(nextNode));
    return;
  }
  await closeAllEditContentMenus();
  setCaret({ startNodeId: getId(nextNode), caretStart: 0 });
  return true;
}
